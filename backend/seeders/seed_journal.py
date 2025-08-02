import asyncio
import httpx

BASE_URL = "http://localhost:8080"

sample_entries = [
    {
        "title": "Day 1: Facing My Fears",
        "content": (
            "Today started with a wave of anxiety about my upcoming math test. I spent the morning reviewing formulas and practicing problems, "
            "but I couldn't shake the feeling of self-doubt. At school, I tried to focus on my breathing and remind myself that preparation is key. "
            "During the test, my hands trembled, but I pushed through each question. Afterward, I felt a mix of relief and uncertainty. "
            "I reflected on how fear often magnifies challenges, and how facing it head-on is the only way to grow."
        )
    },
    {
        "title": "Day 2: Connection and Collaboration",
        "content": (
            "Our group project meeting was after classes today. I was hesitant to share my ideas, worried they might not be good enough. "
            "But my teammates were supportive, and together we brainstormed creative solutions. We divided the tasks based on our strengths. "
            "I left the meeting feeling more connected and grateful for the power of collaboration. Later, I journaled about how working with others "
            "can help overcome personal insecurities."
        )
    },
    {
        "title": "Day 3: Overcoming Stage Fright",
        "content": (
            "We presented our history project in front of the class. My heart raced as I spoke, but I focused on the message rather than my nerves. "
            "The teacher praised our teamwork and research. I felt a surge of pride and realized that stepping outside my comfort zone is essential for growth. "
            "I spent the evening reflecting on how public speaking, though intimidating, is a skill I want to keep developing."
        )
    },
    {
        "title": "Day 4: Finding Focus",
        "content": (
            "I spent hours at the library preparing for next week's science exam. The quiet atmosphere helped me concentrate deeply. "
            "I made detailed notes and created a study schedule. I noticed how my mind wandered less when I set clear goals. "
            "After studying, I felt accomplished and more confident about the upcoming test. I wrote about the importance of environment in productivity."
        )
    },
    {
        "title": "Day 5: Navigating Conflict",
        "content": (
            "A disagreement arose with a friend over our project responsibilities. Initially, I felt frustrated and defensive. "
            "We decided to talk openly about our concerns, and I listened to her perspective. The conversation was tense but honest. "
            "We found a compromise and agreed to communicate better. I reflected on how conflict, though uncomfortable, can strengthen relationships when handled with empathy."
        )
    },
    {
        "title": "Day 6: Joy in Small Victories",
        "content": (
            "Today was the school soccer match. I was nervous but excited. During the game, I scored a goal and felt a rush of joy. "
            "Our team won, and everyone celebrated together. The experience reminded me of the value of persistence and teamwork. "
            "Later, I journaled about how small victories can boost self-esteem and motivate me to keep trying, even when things seem tough."
        )
    },
    {
        "title": "Day 7: Managing Overwhelm",
        "content": (
            "Homework piled up and I felt overwhelmed. My mind raced with deadlines and expectations. I decided to take a break and went for a walk in the park. "
            "The fresh air and movement helped me clear my thoughts. When I returned, I prioritized my tasks and tackled them one by one. "
            "I reflected on how self-care and breaks are essential for mental health and productivity."
        )
    },
    {
        "title": "Day 8: Celebrating Progress",
        "content": (
            "Received my math test results today—B+! I felt proud and relieved. I called my parents to share the news, and they were supportive. "
            "I thought about how my hard work paid off and how important it is to celebrate progress, not just perfection. "
            "I journaled about gratitude and the encouragement I get from my family."
        )
    },
    {
        "title": "Day 9: Learning New Skills",
        "content": (
            "Attended a workshop on time management. The speaker shared practical strategies for organizing study schedules and balancing activities. "
            "I realized I often underestimate the power of planning. I created a weekly planner and set realistic goals. "
            "Reflecting on the day, I felt motivated to implement these new skills and track my growth."
        )
    },
    {
        "title": "Day 10: Reflection and Gratitude",
        "content": (
            "Spent the evening reflecting on the past week. I wrote about my challenges, achievements, and moments of connection. "
            "I feel grateful for supportive friends, family, and teachers. Journaling has helped me process emotions and recognize patterns in my thoughts. "
            "Looking ahead, I want to continue this habit and focus on self-compassion and growth."
        )
    },
]

async def seed_journals():
    async with httpx.AsyncClient() as client:
        for entry in sample_entries:
            resp = await client.post(f"{BASE_URL}/api/journal/entries", json=entry)
            print(f"Seeded: {entry['title']} - Status: {resp.status_code}")

if __name__ == "__main__":
    asyncio.run(seed_journals())