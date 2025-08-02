"""
AI processing API routes.
"""

from quart import Blueprint, request, jsonify
import logging
from app.models.database import get_db_session
from app.models.journal import JournalEntry
from app.models.facts import UserFact
from app.services.ai_processor import AIProcessor
from app.services.vector_search import VectorSearchService

logger = logging.getLogger(__name__)

bp = Blueprint('ai', __name__)


@bp.route('/process-entry', methods=['POST'])
async def process_entry():
    """Process a journal entry to extract facts and events."""
    try:
        data = await request.get_json()
        
        if not data or not data.get('entry_id'):
            return jsonify({"error": "Entry ID is required"}), 400
        
        entry_id = data['entry_id']
        
        async with get_db_session() as session:
            entry = await JournalEntry.get_by_id(session, entry_id)
            
            if not entry:
                return jsonify({"error": "Entry not found"}), 404
            
            # Process entry with AI
            ai_processor = AIProcessor()
            facts_data = await ai_processor.extract_facts_from_entry(
                entry.content, entry.title
            )
            
            # Store facts in database
            facts = []
            if facts_data:
                facts = await UserFact.create_bulk(session, facts_data, entry_id)
            
            return jsonify({
                "message": "Entry processed successfully",
                "entry_id": entry_id,
                "facts_extracted": len(facts),
                "facts": [fact.to_dict() for fact in facts]
            })
            
    except Exception as e:
        logger.error(f"Error processing entry: {str(e)}")
        return jsonify({"error": "Failed to process entry"}), 500


@bp.route('/topics', methods=['GET'])
async def get_topics():
    """Get recent topics for suggestions."""
    try:
        limit = int(request.args.get('limit', 10))
        
        async with get_db_session() as session:
            topics = await UserFact.get_recent_topics(session, limit)
            
            return jsonify({
                "topics": topics,
                "total": len(topics)
            })
            
    except Exception as e:
        logger.error(f"Error getting topics: {str(e)}")
        return jsonify({"error": "Failed to retrieve topics"}), 500


@bp.route('/suggest-prompt', methods=['POST'])
async def suggest_prompt():
    """Generate a writing prompt for a specific topic."""
    try:
        data = await request.get_json()
        
        if not data or not data.get('topic'):
            return jsonify({"error": "Topic is required"}), 400
        
        topic = data['topic']
        
        async with get_db_session() as session:
            # Get related facts for context
            related_facts = await UserFact.get_by_topic(session, topic, 10)
            
            # Generate prompt using AI
            ai_processor = AIProcessor()
            prompt = await ai_processor.generate_topic_prompt(topic, related_facts)
            
            return jsonify({
                "topic": topic,
                "prompt": prompt,
                "related_facts_count": len(related_facts)
            })
            
    except Exception as e:
        logger.error(f"Error generating prompt: {str(e)}")
        return jsonify({"error": "Failed to generate prompt"}), 500


@bp.route('/review-entry', methods=['POST'])
async def review_entry():
    """Generate an AI review for a journal entry."""
    try:
        data = await request.get_json()
        
        if not data or not data.get('entry_id'):
            return jsonify({"error": "Entry ID is required"}), 400
        
        entry_id = data['entry_id']
        
        async with get_db_session() as session:
            entry = await JournalEntry.get_by_id(session, entry_id)
            
            if not entry:
                return jsonify({"error": "Entry not found"}), 404
            
            # Find related facts for context
            vector_search = VectorSearchService()
            related_facts = await vector_search.find_related_facts_for_entry(
                session, entry.content, entry_id, 10
            )
            
            # Generate review using AI
            ai_processor = AIProcessor()
            review = await ai_processor.review_entry(entry.content, related_facts)
            
            return jsonify({
                "entry_id": entry_id,
                "review": review,
                "related_facts_count": len(related_facts),
                "related_facts": [fact.to_dict() for fact in related_facts[:5]]
            })
            
    except Exception as e:
        logger.error(f"Error reviewing entry: {str(e)}")
        return jsonify({"error": "Failed to generate review"}), 500


@bp.route('/search-similar', methods=['POST'])
async def search_similar():
    """Search for facts similar to a query."""
    try:
        data = await request.get_json()
        
        if not data or not data.get('query'):
            return jsonify({"error": "Query is required"}), 400
        
        query = data['query']
        limit = data.get('limit', 10)
        similarity_threshold = data.get('similarity_threshold', 0.7)
        
        async with get_db_session() as session:
            vector_search = VectorSearchService()
            similar_facts = await vector_search.search_similar_facts(
                session, query, limit, similarity_threshold
            )
            
            results = []
            for fact, similarity in similar_facts:
                fact_data = fact.to_dict()
                fact_data['similarity_score'] = similarity
                results.append(fact_data)
            
            return jsonify({
                "query": query,
                "results": results,
                "total_results": len(results)
            })
            
    except Exception as e:
        logger.error(f"Error searching similar facts: {str(e)}")
        return jsonify({"error": "Failed to search similar facts"}), 500


@bp.route('/topic-clusters', methods=['GET'])
async def get_topic_clusters():
    """Get clustered facts by topic similarity."""
    try:
        topic = request.args.get('topic')
        n_clusters = int(request.args.get('n_clusters', 5))
        
        async with get_db_session() as session:
            vector_search = VectorSearchService()
            clusters = await vector_search.get_fact_clusters(session, topic, n_clusters)
            
            # Format clusters for response
            formatted_clusters = {}
            for cluster_id, facts in clusters.items():
                formatted_clusters[str(cluster_id)] = {
                    "facts": [fact.to_dict() for fact in facts],
                    "count": len(facts),
                    "main_topics": list(set(fact.topic for fact in facts))
                }
            
            return jsonify({
                "clusters": formatted_clusters,
                "total_clusters": len(clusters),
                "topic_filter": topic
            })
            
    except Exception as e:
        logger.error(f"Error getting topic clusters: {str(e)}")
        return jsonify({"error": "Failed to get topic clusters"}), 500


@bp.route('/suggest-topics', methods=['GET'])
async def suggest_topics():
    """Suggest new topics for exploration based on user's history."""
    try:
        limit = int(request.args.get('limit', 5))
        
        async with get_db_session() as session:
            # Get user's recent facts
            from sqlalchemy.future import select
            result = await session.execute(
                select(UserFact)
                .order_by(UserFact.timestamp.desc())
                .limit(50)
            )
            recent_facts = result.scalars().all()
            
            # Generate topic suggestions
            ai_processor = AIProcessor()
            suggested_topics = await ai_processor.suggest_topics(recent_facts, limit)
            
            return jsonify({
                "suggested_topics": suggested_topics,
                "based_on_facts": len(recent_facts)
            })
            
    except Exception as e:
        logger.error(f"Error suggesting topics: {str(e)}")
        return jsonify({"error": "Failed to suggest topics"}), 500


@bp.route('/analyze-patterns', methods=['GET'])
async def analyze_patterns():
    """Analyze patterns in user's journaling habits and topics."""
    try:
        days = int(request.args.get('days', 30))
        
        async with get_db_session() as session:
            from datetime import datetime, timedelta
            from sqlalchemy.future import select
            from sqlalchemy import func
            
            # Get facts from the last N days
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            result = await session.execute(
                select(UserFact)
                .where(UserFact.timestamp >= cutoff_date)
                .order_by(UserFact.timestamp.desc())
            )
            recent_facts = result.scalars().all()
            
            # Analyze patterns
            topic_counts = {}
            fact_type_counts = {}
            daily_counts = {}
            
            for fact in recent_facts:
                # Topic analysis
                topic_counts[fact.topic] = topic_counts.get(fact.topic, 0) + 1
                
                # Fact type analysis
                fact_type_counts[fact.fact_type.value] = fact_type_counts.get(fact.fact_type.value, 0) + 1
                
                # Daily activity
                day_key = fact.timestamp.strftime('%Y-%m-%d')
                daily_counts[day_key] = daily_counts.get(day_key, 0) + 1
            
            # Sort topics by frequency
            top_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            
            return jsonify({
                "analysis_period_days": days,
                "total_facts": len(recent_facts),
                "top_topics": [{"topic": topic, "count": count} for topic, count in top_topics],
                "fact_type_distribution": fact_type_counts,
                "daily_activity": daily_counts,
                "most_active_day": max(daily_counts.keys(), key=lambda k: daily_counts[k]) if daily_counts else None
            })
            
    except Exception as e:
        logger.error(f"Error analyzing patterns: {str(e)}")
        return jsonify({"error": "Failed to analyze patterns"}), 500


@bp.route('/health', methods=['GET'])
async def ai_health_check():
    """Check AI services health."""
    try:
        ai_processor = AIProcessor()
        
        # Check LLM client
        llm_health = await ai_processor.llm_client.health_check()
        
        # Check embedding service
        embedding_stats = await ai_processor.embedding_service.get_embedding_stats()
        
        return jsonify({
            "llm_service": llm_health,
            "embedding_service": {
                "status": "healthy" if embedding_stats.get("model_loaded") else "degraded",
                "stats": embedding_stats
            }
        })
        
    except Exception as e:
        logger.error(f"Error checking AI health: {str(e)}")
        return jsonify({"error": "Failed to check AI health"}), 500
