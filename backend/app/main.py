"""
Main Quart application entry point for re:memo backend.
"""

from quart import Quart, jsonify
from quart_cors import cors
import os
from app.config.settings import settings
from app.models.database import init_db
from app.routes import journal, ai, chat


def create_app() -> Quart:
    """Create and configure the Quart application."""
    app = Quart(__name__)
    
    # Load configuration
    app.config.update(settings.model_dump())
    
    # Enable CORS
    app = cors(app, allow_origin="*")
    
    # Initialize database
    init_db(app)
    
    # Register blueprints
    app.register_blueprint(journal.bp, url_prefix='/api/journal')
    app.register_blueprint(ai.bp, url_prefix='/api/ai')
    app.register_blueprint(chat.bp, url_prefix='/api/chat')
    
    @app.route('/api/health')
    async def health_check():
        """Health check endpoint."""
        return jsonify({
            "status": "healthy",
            "service": "re:memo-backend",
            "version": "1.0.0"
        })
    
    @app.route('/health')
    async def health_check_root():
        """Health check endpoint at root level for Docker."""
        return jsonify({
            "status": "healthy",
            "service": "re:memo-backend",
            "version": "1.0.0"
        })
    
    @app.errorhandler(404)
    async def not_found(error):
        return jsonify({"error": "Not found"}), 404
    
    @app.errorhandler(500)
    async def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        debug=settings.DEBUG
    )
