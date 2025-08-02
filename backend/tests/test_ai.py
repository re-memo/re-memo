import pytest
import httpx

BASE_URL = "http://localhost:8080"

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
    topic = "health"
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/api/ai/suggest-prompt", json={"topic": topic})
        assert resp.status_code == 200
        data = resp.json()
        assert "prompt" in data
        print("Prompt:", data["prompt"])

@pytest.mark.asyncio
async def test_review_entry():
    print("Starting test_review_entry...")
    entry_id = 1
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/api/ai/review-entry", json={"entry_id": entry_id})
        assert resp.status_code == 200
        data = resp.json()
        assert "review" in data
        print("Review:", data["review"])

@pytest.mark.asyncio
async def test_search_similar():
    print("Starting test_search_similar...")
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/api/ai/search-similar", json={"query": "exercise", "limit": 3})
        assert resp.status_code == 200
        data = resp.json()
        assert "results" in data
        print("Similar facts:", data["results"])

@pytest.mark.asyncio
async def test_get_topic_clusters():
    print("Starting test_get_topic_clusters...")
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/api/ai/topic-clusters?topic=health&n_clusters=2")
        assert resp.status_code == 200
        data = resp.json()
        assert "clusters" in data
        print("Clusters:", data["clusters"])

@pytest.mark.asyncio
async def test_suggest_topics():
    print("Starting test_suggest_topics...")
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/api/ai/suggest-topics?limit=3")
        assert resp.status_code == 200
        data = resp.json()
        assert "suggested_topics" in data
        print("Suggested topics:", data["suggested_topics"])

@pytest.mark.asyncio
async def test_analyze_patterns():
    print("Starting test_analyze_patterns...")
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/api/ai/analyze-patterns?days=7")
        assert resp.status_code == 200
        data = resp.json()
        assert "top_topics" in data
        print("Top topics:", data["top_topics"])

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
'''