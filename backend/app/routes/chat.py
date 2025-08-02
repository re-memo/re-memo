"""
Chat interface API routes.
"""

from quart import Blueprint, request, jsonify
from datetime import datetime
from typing import List, Dict
from app.models.database import get_db_session
from app.models.chat import ChatSession, ChatMessage
from app.models.facts import UserFact
from app.services.ai_processor import AIProcessor
from app.services.vector_search import VectorSearchService
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

bp = Blueprint('chat', __name__)


@bp.route('/message', methods=['POST'])
async def send_message():
    """Send a chat message and get AI response."""
    try:
        data = await request.get_json()
        
        if not data or not data.get('message'):
            return jsonify({"error": "Message content is required"}), 400
        
        message = data['message']
        session_id = data.get('session_id')
        
        async with get_db_session() as session_db:
            # Get or create chat session
            if session_id:
                chat_session = await ChatSession.get_by_id(session_db, session_id)
                if not chat_session:
                    return jsonify({"error": "Chat session not found"}), 404
            else:
                # Create new session
                chat_session = await ChatSession.create(session_db, title=f"Chat started at {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}")
                session_id = chat_session.id
            
            # Store user message
            user_message = await ChatMessage.create(
                session_db, 
                session_id, 
                "user", 
                message
            )
            
            # Get recent messages for context
            recent_messages = await ChatMessage.get_recent_messages(session_db, session_id, limit=10)
            
            # Get relevant facts for context
            vector_search = VectorSearchService()
            relevant_facts = await vector_search.find_related_facts_for_entry(
                session_db, 
                message, 
                limit=5
            )
            
            # Generate AI response
            ai_processor = AIProcessor()
            
            # Convert messages to chat format
            chat_history = []
            for msg in recent_messages[:-1]:  # Exclude the current message
                chat_history.append({
                    "role": msg.role,
                    "content": msg.content
                })
            
            ai_response = await ai_processor.generate_chat_response(
                message, 
                chat_history, 
                relevant_facts
            )
            
            # Store AI response
            ai_message = await ChatMessage.create(
                session_db,
                session_id,
                "assistant",
                ai_response,
                model_used=settings.DEFAULT_MODEL,  # Use from settings
                context_facts_count=len(relevant_facts)
            )
            
            # Update session timestamp
            chat_session.updated_at = datetime.utcnow()
            
            # Commit the transaction
            await session_db.commit()
            
            return jsonify({
                "session_id": session_id,
                "user_message": user_message.to_dict(),
                "ai_response": ai_message.to_dict(),
                "context_facts": [fact.to_dict() for fact in relevant_facts]
            })
            
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}")
        return jsonify({"error": "Failed to process message"}), 500


@bp.route('/history', methods=['GET'])
async def get_chat_history():
    """Get chat history for a session."""
    try:
        session_id = request.args.get('session_id')
        limit = int(request.args.get('limit', 50))
        
        if not session_id:
            return jsonify({"error": "Session ID is required"}), 400
        
        async with get_db_session() as session_db:
            chat_session = await ChatSession.get_by_id(session_db, session_id)
            if not chat_session:
                return jsonify({"error": "Chat session not found"}), 404
            
            messages = await ChatMessage.get_session_messages(session_db, session_id, limit)
            
            return jsonify({
                "session": chat_session.to_dict(),
                "messages": [msg.to_dict() for msg in messages],
                "total_messages": len(messages)
            })
        
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        return jsonify({"error": "Failed to get chat history"}), 500


@bp.route('/sessions', methods=['GET'])
async def get_chat_sessions():
    """Get all chat sessions."""
    try:
        limit = int(request.args.get('limit', 20))
        
        async with get_db_session() as session_db:
            sessions = await ChatSession.get_all(session_db, limit)
            
            sessions_info = []
            for session in sessions:
                session_dict = session.to_dict()
                
                # Get last message for preview
                recent_messages = await ChatMessage.get_session_messages(session_db, session.id, limit=1)
                if recent_messages:
                    session_dict['last_message'] = recent_messages[-1].to_dict()
                
                sessions_info.append(session_dict)
            
            return jsonify({
                "sessions": sessions_info,
                "total_sessions": len(sessions_info)
            })
        
    except Exception as e:
        logger.error(f"Error getting chat sessions: {str(e)}")
        return jsonify({"error": "Failed to get chat sessions"}), 500


@bp.route('/sessions/<session_id>', methods=['DELETE'])
async def delete_chat_session(session_id):
    """Delete a chat session."""
    try:
        async with get_db_session() as session_db:
            chat_session = await ChatSession.get_by_id(session_db, session_id)
            if not chat_session:
                return jsonify({"error": "Chat session not found"}), 404
            
            await chat_session.delete(session_db)
            
            return jsonify({
                "message": "Chat session deleted successfully",
                "session_id": session_id
            })
            
    except Exception as e:
        logger.error(f"Error deleting chat session: {str(e)}")
        return jsonify({"error": "Failed to delete chat session"}), 500


@bp.route('/sessions', methods=['POST'])
async def create_chat_session():
    """Create a new chat session."""
    try:
        data = await request.get_json()
        title = data.get('title') if data else None
        
        async with get_db_session() as session_db:
            chat_session = await ChatSession.create(session_db, title)
            
            return jsonify({
                "session": chat_session.to_dict(),
                "message": "Chat session created successfully"
            }), 201
            
    except Exception as e:
        logger.error(f"Error creating chat session: {str(e)}")
        return jsonify({"error": "Failed to create chat session"}), 500


@bp.route('/suggest-questions', methods=['POST'])
async def suggest_questions():
    """Suggest relevant questions based on user's journal content."""
    try:
        data = await request.get_json()
        context = data.get('context', '') if data else ''
        
        async with get_db_session() as session_db:
            # Get recent facts for context
            recent_facts = await UserFact.get_recent(session_db, limit=10)
            
            ai_processor = AIProcessor()
            questions = await ai_processor.suggest_questions_from_context(context, recent_facts)
            
            return jsonify({
                "suggested_questions": questions,
                "context_facts_count": len(recent_facts)
            })
            
    except Exception as e:
        logger.error(f"Error suggesting questions: {str(e)}")
        return jsonify({"error": "Failed to suggest questions"}), 500


@bp.route('/quick-insights', methods=['GET'])
async def get_quick_insights():
    """Get quick insights from recent journal entries."""
    try:
        async with get_db_session() as session_db:
            # Get recent facts
            recent_facts = await UserFact.get_recent(session_db, limit=20)
            
            ai_processor = AIProcessor()
            insights = await ai_processor.generate_quick_insights(recent_facts)
            
            return jsonify({
                "insights": insights,
                "facts_analyzed": len(recent_facts)
            })
            
    except Exception as e:
        logger.error(f"Error getting quick insights: {str(e)}")
        return jsonify({"error": "Failed to get quick insights"}), 500


@bp.route('/export-chat', methods=['GET'])
async def export_chat():
    """Export chat history for a session."""
    try:
        session_id = request.args.get('session_id')
        format_type = request.args.get('format', 'json')  # json, txt, md
        
        if not session_id:
            return jsonify({"error": "Session ID is required"}), 400
        
        async with get_db_session() as session_db:
            chat_session = await ChatSession.get_by_id(session_db, session_id)
            if not chat_session:
                return jsonify({"error": "Chat session not found"}), 404
            
            messages = await ChatMessage.get_session_messages(session_db, session_id, limit=1000)
            
            if format_type == 'json':
                return jsonify({
                    "session": chat_session.to_dict(),
                    "messages": [msg.to_dict() for msg in messages],
                    "exported_at": datetime.utcnow().isoformat()
                })
            
            elif format_type == 'txt':
                # TODO: Implement text export
                content = f"Chat Session: {chat_session.title or 'Untitled'}\n"
                content += f"Exported: {datetime.utcnow().isoformat()}\n\n"
                
                for msg in messages:
                    content += f"[{msg.role.upper()}] {msg.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
                    content += f"{msg.content}\n\n"
                
                return content, 200, {'Content-Type': 'text/plain'}
            
            else:
                return jsonify({"error": "Unsupported export format"}), 400
            
    except Exception as e:
        logger.error(f"Error exporting chat: {str(e)}")
        return jsonify({"error": "Failed to export chat"}), 500
