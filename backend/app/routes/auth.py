"""
Authentication API routes.
"""

from quart import Blueprint, request, jsonify, g
import logging
from app.models.database import get_db_session
from app.models.user import User
from app.middleware.auth import create_access_token, require_auth, get_current_user_id

logger = logging.getLogger(__name__)

bp = Blueprint('auth', __name__)


@bp.route('/register', methods=['POST'])
@require_auth
async def register():
    """Register a new user. Only user ID 0 (admin) can register new users."""
    try:
        user_id = get_current_user_id()
        
        # Only user ID 0 can register new users
        if user_id != 0:
            return jsonify({"error": "Unauthorized: Only admin can register new users"}), 403
        
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
            
            return jsonify({
                "message": "User registered successfully",
                "user": user.to_dict()
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


@bp.route('/users', methods=['GET'])
@require_auth
async def list_users():
    """List all users. Only user ID 0 (admin) can access this."""
    try:
        user_id = get_current_user_id()
        
        # Only user ID 0 can list users
        if user_id != 0:
            return jsonify({"error": "Unauthorized: Only admin can list users"}), 403
        
        async with get_db_session() as session:
            users = await User.get_all(session)
            
            return jsonify({
                "users": [user.to_dict() for user in users]
            })
            
    except Exception as e:
        logger.error(f"Error listing users: {str(e)}")
        return jsonify({"error": "Failed to list users"}), 500


@bp.route('/users/<int:target_user_id>', methods=['DELETE'])
@require_auth
async def delete_user(target_user_id):
    """Delete a user. Only user ID 0 (admin) can delete users."""
    try:
        user_id = get_current_user_id()
        
        # Only user ID 0 can delete users
        if user_id != 0:
            return jsonify({"error": "Unauthorized: Only admin can delete users"}), 403
        
        # Cannot delete user ID 0
        if target_user_id == 0:
            return jsonify({"error": "Cannot delete admin user"}), 400
        
        async with get_db_session() as session:
            user = await User.get_by_id(session, target_user_id)
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            await session.delete(user)
            await session.commit()
            
            return jsonify({
                "message": "User deleted successfully",
                "user_id": target_user_id
            })
            
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        return jsonify({"error": "Failed to delete user"}), 500


@bp.route('/users/<int:target_user_id>/reset-password', methods=['POST'])
@require_auth
async def reset_password(target_user_id):
    """Reset a user's password. Only user ID 0 (admin) can reset passwords."""
    try:
        user_id = get_current_user_id()
        
        # Only user ID 0 can reset passwords
        if user_id != 0:
            return jsonify({"error": "Unauthorized: Only admin can reset passwords"}), 403
        
        data = await request.get_json()
        
        if not data or not data.get('password'):
            return jsonify({"error": "New password is required"}), 400
        
        password = data['password']
        
        # Validate password
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        
        async with get_db_session() as session:
            user = await User.get_by_id(session, target_user_id)
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Update password
            user.password_hash = User.hash_password(password)
            await session.commit()
            
            return jsonify({
                "message": "Password reset successfully",
                "user_id": target_user_id
            })
            
    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        return jsonify({"error": "Failed to reset password"}), 500
