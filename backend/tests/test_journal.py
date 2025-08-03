import pytest
import httpx

BASE_URL = "http://localhost:8080"
        
@pytest.mark.asyncio
async def test_create_entry():
    print("Starting test_create_entry...")
    async with httpx.AsyncClient() as client:
        payload = {"title": "Cool day", "content": "I had such a nice time play football with my friends."}
        resp = await client.post(f"{BASE_URL}/api/journal/entries", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert "entry" in data
        global entry_id
        entry_id = data["entry"]["id"]
        print("\nentry_id:", entry_id)


@pytest.mark.asyncio
async def test_get_entries():
    print("Starting test_get_entries...")
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/api/journal/entries")
        assert resp.status_code == 200
        data = resp.json()
        assert "entries" in data
        for entry in data["entries"]:
            print("Entry details:", entry["title"])

@pytest.mark.asyncio
async def test_get_entry():
    print("Starting test_get_entry...")
    async with httpx.AsyncClient() as client:
        # Use entry_id from previous test
        resp = await client.get(f"{BASE_URL}/api/journal/entries/{entry_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert "entry" in data
        print("Entry details:", data["entry"]["title"])

@pytest.mark.asyncio
async def test_update_entry():
    print("Starting test_update_entry...")
    async with httpx.AsyncClient() as client:
        payload = {"title": "Daily grattitude"}
        resp = await client.put(f"{BASE_URL}/api/journal/entries/{entry_id}", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["entry"]["title"] == "Updated Title"
        print("Entry updated:", data["entry"]["title"])

@pytest.mark.asyncio
async def test_complete_entry():
    print("Starting test_complete_entry...")
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/api/journal/entries/{entry_id}/complete")
        assert resp.status_code == 200
        data = resp.json()
        assert "entry" in data
        assert "facts_extracted" in data
        print("Entry marked complete:", data["entry"]["title"], "-", data["entry"]["status"])

@pytest.mark.asyncio
async def test_get_entry_facts():
    print("Starting test_get_entry_facts...")
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/api/journal/entries/{entry_id}/facts")
        assert resp.status_code == 200
        data = resp.json()
        assert "facts" in data
        print("Facts extracted:", data["facts"])


@pytest.mark.asyncio
async def test_get_journal_stats():
    print("Starting test_get_journal_stats...")
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/api/journal/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_entries" in data
        assert "recent_entries" in data
        # Print all stats
        for key, value in data.items():
            print(f"{key}: {value}")

@pytest.mark.asyncio
async def test_delete_entry():
    print("Starting test_delete_entry...")
    async with httpx.AsyncClient() as client:
        resp = await client.delete(f"{BASE_URL}/api/journal/entries/{entry_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert "message" in data
