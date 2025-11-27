"""
Authentication API routes.
"""

from quart import Blueprint, request, jsonify, g
import logging
from app.models.database import get_db_session
from app.models.user import User
from app.middleware.auth import create_access_token, require_auth

logger = logging.getLogger(__name__)

bp = Blueprint('auth', __name__)


@bp.route('/register', methods=['POST'])
async def register():
    """Register a new user."""
    try:
        data = await request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({"error": "Username and password are required"}), 400
        
        username = data['username'].strip()
        password = data['password']
        
        # Validate username
        if len(username) < 3:
            return jsonify({"error": "Username must be at least 3 characters"}), 400
        if len(username) > 100:
            return jsonify({"error": "Username must be at most 100 characters"}), 400
        
        # Validate password
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        
        async with get_db_session() as session:
            # Check if username already exists
            existing_user = await User.get_by_username(session, username)
            if existing_user:
                return jsonify({"error": "Username already exists"}), 409
            
            # Create new user
            user = await User.create(session, username, password)
            await session.commit()
            
            # Generate token for immediate login
            token = create_access_token(user.id, user.username)
            
            return jsonify({
                "message": "User registered successfully",
                "user": user.to_dict(),
                "token": token
            }), 201
            
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        return jsonify({"error": "Failed to register user"}), 500


@bp.route('/login', methods=['POST'])
async def login():
    """Login and get JWT token."""
    try:
        data = await request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({"error": "Username and password are required"}), 400
        
        username = data['username'].strip()
        password = data['password']
        
        async with get_db_session() as session:
            user = await User.authenticate(session, username, password)
            
            if not user:
                return jsonify({"error": "Invalid username or password"}), 401
            
            # Generate token
            token = create_access_token(user.id, user.username)
            
            return jsonify({
                "message": "Login successful",
                "user": user.to_dict(),
                "token": token
            })
            
    except Exception as e:
        logger.error(f"Error logging in: {str(e)}")
        return jsonify({"error": "Failed to login"}), 500


@bp.route('/me', methods=['GET'])
@require_auth
async def get_current_user():
    """Get current authenticated user info."""
    try:
        return jsonify({
            "user": g.user.to_dict()
        })
    except Exception as e:
        logger.error(f"Error getting user info: {str(e)}")
        return jsonify({"error": "Failed to get user info"}), 500
