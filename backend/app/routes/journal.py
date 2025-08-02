"""
Journal entry CRUD API routes.
"""

from quart import Blueprint, request, jsonify
from quart.helpers import make_response
import logging
from app.models.database import get_db_session
from app.models.journal import JournalEntry
from app.models.facts import UserFact
import math

logger = logging.getLogger(__name__)

bp = Blueprint('journal', __name__)


def calculate_pagination(page: int, limit: int, total_count: int) -> dict:
    """Calculate pagination metadata."""
    # Ensure valid values
    page = max(1, page)
    limit = max(1, min(100, limit))  # Limit between 1 and 100
    
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
    
    return {
        "page": page,
        "limit": limit,
        "total_count": total_count,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
        "start_index": (page - 1) * limit + 1 if total_count > 0 else 0,
        "end_index": min(page * limit, total_count)
    }


@bp.route('/entries', methods=['GET'])
async def get_entries():
    """Get all journal entries with pagination."""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        search = request.args.get('search', '')
        
        async with get_db_session() as session:
            if search:
                # Search with pagination
                entries = await JournalEntry.search(session, search, page, limit)
                total_count = await JournalEntry.count_search(session, search)
            else:
                # Regular pagination
                entries = await JournalEntry.get_all(session, page, limit)
                total_count = await JournalEntry.count_all(session)
            
            # Calculate pagination metadata
            pagination = calculate_pagination(page, limit, total_count)
            
            return jsonify({
                "entries": [entry.to_dict() for entry in entries],
                "search": search if search else None,
                **pagination
            })
            
    except ValueError as e:
        logger.error(f"Invalid pagination parameters: {str(e)}")
        return jsonify({"error": "Invalid pagination parameters"}), 400
    except Exception as e:
        logger.error(f"Error getting entries: {str(e)}")
        return jsonify({"error": "Failed to retrieve entries"}), 500


@bp.route('/entries', methods=['POST'])
async def create_entry():
    """Create a new journal entry."""
    try:
        data = await request.get_json()
        
        if not data or not data.get('content'):
            return jsonify({"error": "Content is required"}), 400
        
        title = data.get('title', 'Untitled Entry')
        content = data.get('content')
        
        async with get_db_session() as session:
            entry = await JournalEntry.create(session, title, content)
            await session.commit()
            
            return jsonify({
                "message": "Entry created successfully",
                "entry": entry.to_dict()
            }), 201
            
    except Exception as e:
        logger.error(f"Error creating entry: {str(e)}")
        return jsonify({"error": "Failed to create entry"}), 500


@bp.route('/entries/<int:entry_id>', methods=['GET'])
async def get_entry(entry_id):
    """Get a specific journal entry by ID."""
    try:
        async with get_db_session() as session:
            entry = await JournalEntry.get_by_id(session, entry_id)
            
            if not entry:
                return jsonify({"error": "Entry not found"}), 404
            
            # Get associated facts
            facts = await UserFact.get_by_entry_id(session, entry_id)
            
            entry_data = entry.to_dict()
            entry_data['facts'] = [fact.to_dict() for fact in facts]
            
            return jsonify({"entry": entry_data})
            
    except Exception as e:
        logger.error(f"Error getting entry {entry_id}: {str(e)}")
        return jsonify({"error": "Failed to retrieve entry"}), 500


@bp.route('/entries/<int:entry_id>', methods=['PUT'])
async def update_entry(entry_id):
    """Update a journal entry."""
    try:
        data = await request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        async with get_db_session() as session:
            entry = await JournalEntry.get_by_id(session, entry_id)
            
            if not entry:
                return jsonify({"error": "Entry not found"}), 404
            
            # Update allowed fields
            update_data = {}
            if 'title' in data:
                update_data['title'] = data['title']
            if 'content' in data:
                update_data['content'] = data['content']
            
            if update_data:
                await entry.update(session, **update_data)
                await session.commit()
            
            return jsonify({
                "message": "Entry updated successfully",
                "entry": entry.to_dict()
            })
            
    except Exception as e:
        logger.error(f"Error updating entry {entry_id}: {str(e)}")
        return jsonify({"error": "Failed to update entry"}), 500


@bp.route('/entries/<int:entry_id>', methods=['DELETE'])
async def delete_entry(entry_id):
    """Delete a journal entry."""
    try:
        async with get_db_session() as session:
            entry = await JournalEntry.get_by_id(session, entry_id)
            
            if not entry:
                return jsonify({"error": "Entry not found"}), 404
            
            await entry.delete(session)
            
            return jsonify({"message": "Entry deleted successfully"})
            
    except Exception as e:
        logger.error(f"Error deleting entry {entry_id}: {str(e)}")
        return jsonify({"error": "Failed to delete entry"}), 500


@bp.route('/entries/<int:entry_id>/complete', methods=['POST'])
async def complete_entry(entry_id):
    """Mark entry as complete and trigger AI processing."""
    try:
        async with get_db_session() as session:
            entry = await JournalEntry.get_by_id(session, entry_id)
            
            if not entry:
                return jsonify({"error": "Entry not found"}), 404
            
            # Mark as complete
            await entry.mark_complete(session)
            
            # Trigger AI processing
            from app.services.ai_processor import AIProcessor
            ai_processor = AIProcessor()
            
            # Extract facts from the entry
            facts_data = await ai_processor.extract_facts_from_entry(
                entry.content, entry.title
            )
            
            # Store facts in database
            if facts_data:
                facts = await UserFact.create_bulk(session, facts_data, entry_id)
                logger.info(f"Created {len(facts)} facts for entry {entry_id}")
            
            # Commit all changes
            await session.commit()
            
            # Get updated entry with facts
            updated_entry = entry.to_dict()
            facts = await UserFact.get_by_entry_id(session, entry_id)
            updated_entry['facts'] = [fact.to_dict() for fact in facts]
            
            return jsonify({
                "message": "Entry completed and processed successfully",
                "entry": updated_entry,
                "facts_extracted": len(facts_data) if facts_data else 0
            })
            
    except Exception as e:
        logger.error(f"Error completing entry {entry_id}: {str(e)}")
        return jsonify({"error": "Failed to complete entry"}), 500


@bp.route('/entries/<int:entry_id>/facts', methods=['GET'])
async def get_entry_facts(entry_id):
    """Get all facts for a specific entry."""
    try:
        async with get_db_session() as session:
            entry = await JournalEntry.get_by_id(session, entry_id)
            
            if not entry:
                return jsonify({"error": "Entry not found"}), 404
            
            facts = await UserFact.get_by_entry_id(session, entry_id)
            
            return jsonify({
                "entry_id": entry_id,
                "facts": [fact.to_dict() for fact in facts],
                "total_facts": len(facts)
            })
            
    except Exception as e:
        logger.error(f"Error getting facts for entry {entry_id}: {str(e)}")
        return jsonify({"error": "Failed to retrieve facts"}), 500


@bp.route('/stats', methods=['GET'])
async def get_journal_stats():
    """Get journal statistics."""
    try:
        async with get_db_session() as session:
            # Get recent entries
            recent_entries = await JournalEntry.get_recent_completed(session, 10)
            
            # Count total entries by status
            from sqlalchemy.future import select
            from sqlalchemy import func
            from app.models.journal import EntryStatus
            
            total_result = await session.execute(select(func.count(JournalEntry.id)))
            total_entries = total_result.scalar()
            
            draft_result = await session.execute(
                select(func.count(JournalEntry.id))
                .where(JournalEntry.status == EntryStatus.DRAFT)
            )
            draft_count = draft_result.scalar()
            
            complete_result = await session.execute(
                select(func.count(JournalEntry.id))
                .where(JournalEntry.status == EntryStatus.COMPLETE)
            )
            complete_count = complete_result.scalar()
            
            # Count total facts
            fact_result = await session.execute(select(func.count(UserFact.id)))
            total_facts = fact_result.scalar()
            
            return jsonify({
                "total_entries": total_entries,
                "draft_entries": draft_count,
                "complete_entries": complete_count,
                "total_facts": total_facts,
                "recent_entries": [entry.to_dict() for entry in recent_entries]
            })
            
    except Exception as e:
        logger.error(f"Error getting journal stats: {str(e)}")
        return jsonify({"error": "Failed to retrieve statistics"}), 500
