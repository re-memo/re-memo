"""
AI processing service using Langchain for fact extraction and analysis.
"""

from typing import List, Dict, Any, Optional
import json
import logging
from app.services.llm_client import LLMClient
from app.services.embeddings import EmbeddingService
from app.models.facts import UserFact, FactType
from app.config.settings import settings
import random
from app.models.journal import JournalEntry

logger = logging.getLogger(__name__)


class AIProcessor:
    """AI processor for extracting facts and generating insights from journal entries."""
    
    def __init__(self):
        self.llm_client = LLMClient()
        self.embedding_service = EmbeddingService()
        self.settings = settings
    
    async def extract_facts_from_entry(self, entry_text: str, entry_title: str = "") -> List[Dict[str, Any]]:
        """
        Extract facts, events, and insights from a journal entry.
        
        Returns:
            List of dictionaries with keys: content, topic, fact_type, original_snippet
        """
        try:
            # Prepare the extraction prompt
            system_prompt = """You are an AI assistant that extracts meaningful facts, events, and insights from journal entries.

Extract information from the journal entry and return it as a JSON array. Each item should have:
- content: The extracted fact/event/insight
- topic: A short topic/category (e.g., "work", "health", "relationships", "travel")
- fact_type: One of "event", "fact", "reflection", "goal", "emotion"
- original_snippet: The original text snippet this was extracted from

Guidelines:
- Focus on specific, meaningful information
- Include both events (things that happened) and reflections (thoughts/feelings)
- Identify goals and aspirations mentioned
- Capture emotional states and their contexts
- Use clear, concise language for content
- Keep topics general but descriptive
- Maximum 20 extractions per entry

Return only valid JSON array format."""

            user_prompt = f"""Journal Entry Title: {entry_title}

Journal Entry Content:
{entry_text}

Extract facts, events, and insights from this journal entry:"""

            # Call LLM for fact extraction
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            response = await self.llm_client.chat_completion(messages)
            
            # Parse JSON response
            try:
                facts_data = json.loads(response)
                if not isinstance(facts_data, list):
                    logger.warning("LLM response is not a list, wrapping in array")
                    facts_data = [facts_data] if facts_data else []
            except json.JSONDecodeError:
                logger.error(f"Failed to parse LLM response as JSON: {response}")
                # Try to extract JSON from response if it's wrapped in text
                import re
                json_match = re.search(r'\[.*\]', response, re.DOTALL)
                if json_match:
                    try:
                        facts_data = json.loads(json_match.group())
                    except json.JSONDecodeError:
                        facts_data = []
                else:
                    facts_data = []
            
            # Validate and clean the extracted facts
            valid_facts = []
            valid_fact_types = {ft.value for ft in FactType}
            
            for fact in facts_data[:self.settings.MAX_FACTS_PER_ENTRY]:
                if not isinstance(fact, dict):
                    continue
                
                # Ensure required fields
                if not all(key in fact for key in ['content', 'topic', 'fact_type']):
                    continue
                
                # Validate fact_type
                if fact['fact_type'] not in valid_fact_types:
                    fact['fact_type'] = 'fact'  # Default fallback
                
                # Generate embedding for the fact content
                embedding = await self.embedding_service.generate_embedding(fact['content'])
                fact['embedding_vector'] = embedding
                
                valid_facts.append({
                    'content': str(fact['content']).strip(),
                    'topic': str(fact['topic']).strip().lower(),
                    'fact_type': fact['fact_type'],
                    'original_snippet': fact.get('original_snippet', '').strip(),
                    'embedding_vector': embedding
                })
            
            logger.info(f"Extracted {len(valid_facts)} facts from journal entry")
            return valid_facts
            
        except Exception as e:
            logger.error(f"Error extracting facts from entry: {str(e)}")
            return []
    
    async def generate_topic_prompt(self, topic: str, user_facts: List[UserFact]) -> str:
        """
        Generate a contextual writing prompt based on a topic and user's history.
        """
        try:
            # Prepare context from user's facts
            fact_context = ""
            if user_facts:
                # Randomly select a single fact to keep the context concise
                selected_fact = random.choice(user_facts)
                fact_context = (f"- {selected_fact.content} (from {selected_fact.timestamp.strftime('%Y-%m-%d')})\n")
                # fact_context = "Based on your previous entries, here are some related facts:\n"
                # for fact in user_facts[:5]:  # Limit to 5 most relevant facts
                #     fact_context += f"- {fact.content} (from {fact.timestamp.strftime('%Y-%m-%d')})\n"
            
            system_prompt = f"""You are a thoughtful journaling assistant. Generate a personalized writing prompt for the topic "{topic}".

The prompt should:
- Start by mentioning the user entry related to the topic, provided in the Fact context section below
- Be specific enough to inspire writing but open enough for creativity
- Encourage introspection and personal growth
- Be concise, no more than 1-3 sentences long

Fact context:
{fact_context}"""

            user_prompt = f"Generate a writing prompt for the topic: {topic}"
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            response = await self.llm_client.chat_completion(messages)
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error generating topic prompt: {str(e)}")
            return f"Write about your recent experiences with {topic}. What have you learned?"
    
    async def review_entry(self, entry_text: str, related_facts: List[UserFact]) -> str:
        """
        Generate an AI review of a journal entry comparing it to past entries.
        """
        try:
            # Prepare context from related facts
            context = ""
            if related_facts:
                context = "Related information from your previous entries:\n"
                for fact in related_facts[:10]:
                    context += f"- {fact.content} ({fact.topic}, {fact.timestamp.strftime('%Y-%m-%d')})\n"
            
            system_prompt = """You are a supportive AI journaling companion. Provide a thoughtful review of the user's journal entry.

Your review should:
- Acknowledge the user's thoughts and experiences
- Identify patterns, growth, or recurring themes when possible
- Be concise, no more than 2-4 sentences long
- Avoid being overly clinical or therapeutic

Focus on being a caring, observant friend who notices details and patterns."""

            user_prompt = f"""Journal Entry:
{entry_text}

{context}

Please provide a thoughtful review of this journal entry:"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            response = await self.llm_client.chat_completion(messages)
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error generating entry review: {str(e)}")
            return "Thank you for sharing your thoughts. Keep reflecting and writing!"
    
    async def generate_chat_response(self, message: str, chat_history: List[Dict], user_facts: List[UserFact]) -> str:
        """
        Generate a chat response based on user message, chat history, and user facts.
        """
        try:
            # Prepare context from user facts
            fact_context = ""
            if user_facts:
                fact_context = "\nRelevant information from the user's journal:\n"
                for fact in user_facts[:8]:
                    fact_context += f"- {fact.content} ({fact.topic})\n"
            
            system_prompt = f"""You are a helpful AI assistant for journaling and self-reflection. You have access to the user's journal entries and can help them explore their thoughts, find patterns, and gain insights.

Be:
- Supportive and encouraging
- Thoughtful and reflective
- Helpful in connecting ideas
- Respectful of their privacy and experiences
- Conversational but insightful

{fact_context}"""

            # Prepare conversation history
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add recent chat history (last 10 messages)
            for msg in chat_history[-10:]:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            response = await self.llm_client.chat_completion(messages)
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error generating chat response: {str(e)}")
            return "I'm having trouble processing your message right now. Please try again."
    
    async def suggest_topics(self, recent_facts: List[UserFact], limit: int = 5) -> List[str]:
        """
        Suggest writing topics based on recent facts and patterns.
        """
        try:
            if not recent_facts:
                return [
                    "gratitude", "goals", "relationships", "work", "health",
                    "learning", "creativity", "challenges", "growth", "future plans"
                ][:limit]
            
            # Extract topics from recent facts
            recent_topics = [fact.topic for fact in recent_facts[:20]]
            topic_counts = {}
            for topic in recent_topics:
                topic_counts[topic] = topic_counts.get(topic, 0) + 1
            
            # Get most common topics
            common_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
            
            system_prompt = """Based on the user's recent journal topics, suggest new related topics they might want to write about.

Return a simple list of 5 topic suggestions, one per line, without numbering or bullets.
Focus on:
- Related but unexplored aspects of their current topics
- Deeper reflection opportunities
- Growth and future-oriented themes
- Emotional and personal development areas"""

            topics_text = ", ".join([f"{topic} ({count} entries)" for topic, count in common_topics[:10]])
            user_prompt = f"Recent journal topics: {topics_text}\n\nSuggest 5 new writing topics:"
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            response = await self.llm_client.chat_completion(messages)
            
            # Parse response into topic list
            suggested_topics = [line.strip() for line in response.split('\n') if line.strip()]
            return suggested_topics[:limit]
            
        except Exception as e:
            logger.error(f"Error suggesting topics: {str(e)}")
            return ["reflection", "growth", "gratitude", "future", "learning"][:limit]
    
    async def suggest_questions_from_context(self, context: str, user_facts: List[UserFact]) -> List[str]:
        """
        Suggest questions based on context and user's fact history.
        """
        try:
            # TODO: Implement proper question suggestion
            # For now, return mock suggestions
            return [
                "How did this experience make you feel?",
                "What patterns do you notice in your recent entries?",
                "What would you like to explore more deeply?",
                "How has your perspective changed recently?",
                "What are you most grateful for today?"
            ]
            
        except Exception as e:
            logger.error(f"Error suggesting questions: {str(e)}")
            return ["What's on your mind today?"]
    
    async def generate_quick_insights(self, recent_facts: List[UserFact]) -> List[str]:
        """
        Generate quick insights from recent facts.
        """
        try:
            # TODO: Implement proper insight generation
            # For now, return mock insights
            insights = []
            
            if recent_facts:
                insights.append(f"You've been active in journaling with {len(recent_facts)} recent insights captured.")
                
                # Group by topic
                topics = {}
                for fact in recent_facts[:10]:
                    topic = fact.topic or "general"
                    topics[topic] = topics.get(topic, 0) + 1
                
                if topics:
                    top_topic = max(topics.items(), key=lambda x: x[1])
                    insights.append(f"Your most frequent topic lately has been '{top_topic[0]}' with {top_topic[1]} entries.")
                
                insights.append("Consider exploring how these recent experiences connect to your longer-term goals.")
            else:
                insights.append("Start journaling to unlock personalized insights about your thoughts and patterns.")
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generating quick insights: {str(e)}")
            return ["Welcome to your journaling journey!"]


    async def generate_reflection(
        self,
        query: str,
        related_entries: List[JournalEntry],
        related_facts: List[UserFact],
    ) -> str:
        """
        Produce a concise reflection that answers `query`, quoting directly
        from the most relevant notes when possible.
        """
        try:
            # ── Build quoted context ───────────────────────────────────────
            quotes_block = ""
            for fact in related_facts[:10]:
                snippet = (
                    fact.original_snippet.strip()
                    if fact.original_snippet
                    else fact.content.strip()
                )
                entry_title = next(
                    (e.title for e in related_entries if e.id == fact.entry_id),
                    "Untitled",
                )
                quotes_block += (
                    f'• "{snippet}" (⟨{entry_title}⟩ – {fact.timestamp.strftime("%Y-%m-%d")})\n'
                )

            system_prompt = """
You are an insightful journaling assistant. Use the supplied quotations from
the user's past notes to answer their question as accurately as possible.

Guidelines:
- Quote directly from the notes when it clarifies the point (keep quotes short).
- Reference the date in parentheses after each quote.
- Stay factual and avoid speculation.
- Be concise and limit yourself to 2–4 sentences total.
""".strip()

            user_prompt = f"""User query: {query}

Relevant quotations:
{quotes_block if quotes_block else "(no relevant quotes found)"}

Craft your answer now."""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]

            reply = await self.llm_client.chat_completion(messages)
            return reply.strip()

        except Exception as e:
            logger.error(f"Error generating reflection: {str(e)}")
            return "I'm unable to surface any related notes at the moment, but I'll keep improving!"