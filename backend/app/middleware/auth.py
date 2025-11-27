"""
JWT authentication middleware and utilities.
"""

from functools import wraps
from quart import request, jsonify, g
import jwt
from datetime import datetime, timedelta
from typing import Optional
import logging

from app.config.settings import settings
from app.models.database import get_db_session
from app.models.user import User

logger = logging.getLogger(__name__)


def create_access_token(user_id: int, username: str) -> str:
    """Create a JWT access token."""
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        return None


def get_token_from_header() -> Optional[str]:
    """Extract JWT token from Authorization header."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]  # Remove "Bearer " prefix
    return None


def require_auth(f):
    """Decorator to require JWT authentication for a route."""
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        token = get_token_from_header()
        
        if not token:
            return jsonify({"error": "Authorization token required"}), 401
        
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Store user info in g for access in route handlers
        g.user_id = payload.get("user_id")
        g.username = payload.get("username")
        
        # Verify user still exists in database
        async with get_db_session() as session:
            user = await User.get_by_id(session, g.user_id)
            if not user:
                return jsonify({"error": "User not found"}), 401
            g.user = user
        
        return await f(*args, **kwargs)
    
    return decorated_function


def get_current_user_id() -> int:
    """Get the current authenticated user's ID from the request context."""
    return g.user_id


def get_current_username() -> str:
    """Get the current authenticated user's username from the request context."""
    return g.username
