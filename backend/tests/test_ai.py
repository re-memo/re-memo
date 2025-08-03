import pytest
import httpx

BASE_URL = "http://localhost:8080"

@pytest.mark.asyncio
async def test_ai_health_check():
    print("Starting test_ai_health_check...")
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/api/ai/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "llm_service" in data
        assert "embedding_service" in data
        print("LLM health:", data["llm_service"])
        print("Embedding health:", data["embedding_service"])

# re:view
@pytest.mark.asyncio
async def test_review_entry():
    print("Starting test_review_entry...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Fetch a real entry ID first
        resp_entries = await client.get(f"{BASE_URL}/api/journal/entries")
        assert resp_entries.status_code == 200
        entries = resp_entries.json().get("entries", [])
        assert entries, "No journal entries available for testing review."
        entry_id = entries[0]["id"]

        resp = await client.post(f"{BASE_URL}/api/ai/review-entry", json={"entry_id": entry_id})
        assert resp.status_code == 200
        data = resp.json()
        assert "review" in data
        print("Review:", data["review"])

# help with journalling ideas
@pytest.mark.asyncio
async def test_get_topics():
    print("Starting test_get_topics...")
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/api/ai/topics?limit=5")
        assert resp.status_code == 200
        data = resp.json()
        assert "topics" in data
        print("Topics:", data["topics"])

@pytest.mark.asyncio
async def test_suggest_prompt():
    print("Starting test_suggest_prompt...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get a real topic first
        resp_topics = await client.get(f"{BASE_URL}/api/ai/topics?limit=5")
        assert resp_topics.status_code == 200
        topics = resp_topics.json().get("topics", [])
        assert topics, "No topics available for suggest-prompt test."
        topic = topics[0]

        resp = await client.post(f"{BASE_URL}/api/ai/suggest-prompt", json={"topic": topic})
        assert resp.status_code == 200
        data = resp.json()
        assert "prompt" in data
        print("Prompt:", data["prompt"])

# re:flect
@pytest.mark.asyncio
async def test_get_reflection():
    print("Starting test_get_reflection...")
    async with httpx.AsyncClient(timeout=30.0) as client:

        # 1️⃣  Form a genuine free-text query (not just a topic keyword)
        query = "What have i mentioned about public speaking?"
        print("Using free-text query:", query)

        # 2️⃣  Call /get-reflection
        resp_refl = await client.post(
            f"{BASE_URL}/api/ai/get-reflection",
            json={"query": query, "limit": 3},
        )
        assert resp_refl.status_code == 200
        data = resp_refl.json()

        # 3️⃣  Validate response structure
        assert "reflection" in data, "Missing reflection text"
        assert "notes" in data, "Missing notes list"
        print("Reflection:", data["reflection"])
        print("Notes returned:", data["notes"])


'''
# NOTE: this test creates embeddings on notes that may not be completed and in general not synced with the whole system.
# It is kept for now but should be deleted as soon as entry processing is integrated in journal entry completion.
@pytest.mark.asyncio
async def test_process_entry():
    print("Starting test_process_entry...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get entries and grab the first entry's ID
        resp = await client.get(f"{BASE_URL}/api/journal/entries")
        assert resp.status_code == 200
        entries = resp.json().get("entries", [])
        assert entries, "No journal entries found for testing."
        entry_id = entries[0]["id"]
        print("Using entry_id:", entry_id)

        # Call process-entry with the fetched entry_id
        resp = await client.post(f"{BASE_URL}/api/ai/process-entry", json={"entry_id": entry_id})
        assert resp.status_code == 200
        data = resp.json()
        assert "facts_extracted" in data
        print("Facts extracted:", data["facts_extracted"])
'''