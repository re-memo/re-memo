"""
Chat interface API routes.
"""

from quart import Blueprint, request, jsonify
import logging
from datetime import datetime
from typing import List, Dict
from app.models.database import get_db_session
from app.models.facts import UserFact
from app.services.ai_processor import AIProcessor
from app.services.vector_search import VectorSearchService

logger = logging.getLogger(__name__)

bp = Blueprint('chat', __name__)

# In-memory chat history storage (in production, use Redis or database)
chat_sessions = {}


@bp.route('/message', methods=['POST'])
async def send_message():
    """Send a chat message and get AI response."""
    try:
        data = await request.get_json()
        
        if not data or not data.get('message'):
            return jsonify({"error": "Message is required"}), 400
        
        message = data['message']
        session_id = data.get('session_id', 'default')
        
        # Get or create chat session
        if session_id not in chat_sessions:
            chat_sessions[session_id] = []
        
        chat_history = chat_sessions[session_id]
        
        # Add user message to history
        user_message = {
            "role": "user",
            "content": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        chat_history.append(user_message)
        
        async with get_db_session() as session_db:
            # Search for relevant facts based on the message
            vector_search = VectorSearchService()
            relevant_facts = await vector_search.search_similar_facts(
                session_db, message, limit=8, similarity_threshold=0.5
            )
            
            # Extract just the facts for context
            context_facts = [fact for fact, _ in relevant_facts]
            
            # Generate AI response
            ai_processor = AIProcessor()
            ai_response = await ai_processor.generate_chat_response(
                message, chat_history[:-1], context_facts  # Exclude current message from history
            )
            
            # Add AI response to history
            ai_message = {
                "role": "assistant",
                "content": ai_response,
                "timestamp": datetime.utcnow().isoformat(),
                "context_facts_used": len(context_facts)
            }
            chat_history.append(ai_message)
            
            # Limit chat history size
            if len(chat_history) > 50:
                chat_history = chat_history[-40:]  # Keep last 40 messages
                chat_sessions[session_id] = chat_history
            
            return jsonify({
                "response": ai_response,
                "session_id": session_id,
                "context_facts_used": len(context_facts),
                "relevant_facts": [fact.to_dict() for fact, _ in relevant_facts[:3]]  # Show top 3
            })
            
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}")
        return jsonify({"error": "Failed to process message"}), 500


@bp.route('/history', methods=['GET'])
async def get_chat_history():
    """Get chat history for a session."""
    try:
        session_id = request.args.get('session_id', 'default')
        limit = int(request.args.get('limit', 20))
        
        chat_history = chat_sessions.get(session_id, [])
        
        # Return most recent messages
        recent_history = chat_history[-limit:] if len(chat_history) > limit else chat_history
        
        return jsonify({
            "session_id": session_id,
            "messages": recent_history,
            "total_messages": len(chat_history)
        })
        
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        return jsonify({"error": "Failed to retrieve chat history"}), 500


@bp.route('/sessions', methods=['GET'])
async def get_chat_sessions():
    """Get all chat sessions."""
    try:
        sessions_info = []
        
        for session_id, history in chat_sessions.items():
            if history:
                last_message = history[-1]
                sessions_info.append({
                    "session_id": session_id,
                    "message_count": len(history),
                    "last_activity": last_message.get("timestamp"),
                    "last_message_preview": last_message.get("content", "")[:100]
                })
        
        return jsonify({
            "sessions": sessions_info,
            "total_sessions": len(sessions_info)
        })
        
    except Exception as e:
        logger.error(f"Error getting chat sessions: {str(e)}")
        return jsonify({"error": "Failed to retrieve sessions"}), 500


@bp.route('/sessions/<session_id>', methods=['DELETE'])
async def delete_chat_session(session_id):
    """Delete a chat session."""
    try:
        if session_id in chat_sessions:
            del chat_sessions[session_id]
            return jsonify({"message": f"Session {session_id} deleted successfully"})
        else:
            return jsonify({"error": "Session not found"}), 404
            
    except Exception as e:
        logger.error(f"Error deleting chat session: {str(e)}")
        return jsonify({"error": "Failed to delete session"}), 500


@bp.route('/suggest-questions', methods=['POST'])
async def suggest_questions():
    """Suggest relevant questions based on user's journal content."""
    try:
        data = await request.get_json()
        topic = data.get('topic', '') if data else ''
        
        async with get_db_session() as session:
            # Get recent facts for context
            if topic:
                relevant_facts = await UserFact.get_by_topic(session, topic, 10)
            else:
                # Get most recent facts
                from sqlalchemy.future import select
                result = await session.execute(
                    select(UserFact)
                    .order_by(UserFact.timestamp.desc())
                    .limit(20)
                )
                relevant_facts = result.scalars().all()
            
            # Generate question suggestions using AI
            ai_processor = AIProcessor()
            
            # Create a prompt for question generation
            context = ""
            if relevant_facts:
                context = "Based on recent journal entries about:\n"
                topics_mentioned = list(set(fact.topic for fact in relevant_facts[:10]))
                context += "\n".join([f"- {topic}" for topic in topics_mentioned])
            
            question_prompt = f"""Generate 5 thoughtful questions that would help someone reflect on their experiences and gain insights. 
            
            {context}
            
            The questions should be:
            - Open-ended and thought-provoking
            - Focused on personal growth and reflection
            - Relevant to the topics mentioned
            - Encouraging of deeper self-examination
            
            Return just the questions, one per line."""
            
            messages = [
                {"role": "system", "content": "You are a thoughtful journaling coach who asks insightful questions."},
                {"role": "user", "content": question_prompt}
            ]
            
            response = await ai_processor.llm_client.chat_completion(messages)
            
            # Parse questions
            questions = [q.strip() for q in response.split('\n') if q.strip()]
            
            return jsonify({
                "suggested_questions": questions[:5],  # Limit to 5
                "based_on_topic": topic if topic else "recent entries",
                "context_facts": len(relevant_facts)
            })
            
    except Exception as e:
        logger.error(f"Error suggesting questions: {str(e)}")
        return jsonify({
            "suggested_questions": [
                "What patterns do you notice in your recent experiences?",
                "What have you learned about yourself lately?",
                "What are you most grateful for right now?",
                "What challenges are you facing and how might you approach them?",
                "What goals or aspirations are on your mind?"
            ],
            "based_on_topic": topic if topic else "general",
            "context_facts": 0
        })


@bp.route('/quick-insights', methods=['GET'])
async def get_quick_insights():
    """Get quick insights from recent journal entries."""
    try:
        days = int(request.args.get('days', 7))
        
        async with get_db_session() as session:
            from datetime import timedelta
            from sqlalchemy.future import select
            
            # Get recent facts
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            result = await session.execute(
                select(UserFact)
                .where(UserFact.timestamp >= cutoff_date)
                .order_by(UserFact.timestamp.desc())
                .limit(30)
            )
            recent_facts = result.scalars().all()
            
            if not recent_facts:
                return jsonify({
                    "insights": ["Start journaling to get personalized insights!"],
                    "period_days": days,
                    "facts_analyzed": 0
                })
            
            # Generate insights using AI
            ai_processor = AIProcessor()
            
            # Prepare context for insights
            facts_summary = "\n".join([
                f"- {fact.content} ({fact.topic}, {fact.fact_type.value})"
                for fact in recent_facts[:15]
            ])
            
            insight_prompt = f"""Based on these recent journal entries from the last {days} days, provide 3-5 brief insights about patterns, growth, or notable themes:

{facts_summary}

Return insights that are:
- Encouraging and supportive
- Based on observable patterns
- Focused on growth and self-awareness
- Brief (1-2 sentences each)

Format as a simple list, one insight per line."""

            messages = [
                {"role": "system", "content": "You are a supportive AI that helps people understand patterns in their journaling."},
                {"role": "user", "content": insight_prompt}
            ]
            
            response = await ai_processor.llm_client.chat_completion(messages)
            
            # Parse insights
            insights = [insight.strip() for insight in response.split('\n') if insight.strip()]
            
            return jsonify({
                "insights": insights[:5],  # Limit to 5
                "period_days": days,
                "facts_analyzed": len(recent_facts)
            })
            
    except Exception as e:
        logger.error(f"Error getting quick insights: {str(e)}")
        return jsonify({
            "insights": [
                "You're building a great journaling habit!",
                "Keep reflecting on your experiences to gain deeper insights."
            ],
            "period_days": days,
            "facts_analyzed": 0
        })


@bp.route('/export-chat', methods=['GET'])
async def export_chat():
    """Export chat history for a session."""
    try:
        session_id = request.args.get('session_id', 'default')
        format_type = request.args.get('format', 'json')  # json or text
        
        if session_id not in chat_sessions:
            return jsonify({"error": "Session not found"}), 404
        
        chat_history = chat_sessions[session_id]
        
        if format_type == 'text':
            # Format as readable text
            text_export = f"Chat Session: {session_id}\n"
            text_export += f"Exported: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}\n"
            text_export += "=" * 50 + "\n\n"
            
            for message in chat_history:
                role = "You" if message["role"] == "user" else "AI Assistant"
                timestamp = message.get("timestamp", "")
                content = message.get("content", "")
                
                text_export += f"{role} [{timestamp}]:\n{content}\n\n"
            
            return text_export, 200, {
                'Content-Type': 'text/plain',
                'Content-Disposition': f'attachment; filename=chat_{session_id}.txt'
            }
        else:
            # Return JSON format
            return jsonify({
                "session_id": session_id,
                "exported_at": datetime.utcnow().isoformat(),
                "message_count": len(chat_history),
                "messages": chat_history
            })
            
    except Exception as e:
        logger.error(f"Error exporting chat: {str(e)}")
        return jsonify({"error": "Failed to export chat"}), 500
