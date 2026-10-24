import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_conversation_persistence_and_multi_turn_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create a conversation
        create_res = await client.post(
            "/api/v1/agent/conversations",
            json={"title": "New Conversation", "project_id": None},
        )
        assert create_res.status_code == 201
        conv_data = create_res.json()
        conv_id = conv_data["id"]
        assert conv_data["title"] == "New Conversation"
        assert len(conv_data["messages"]) == 0

        # 2. Send first message (search query)
        msg_res1 = await client.post(
            f"/api/v1/agent/conversations/{conv_id}/messages",
            json={"content": "Find all computer vision projects in the catalog"},
        )
        assert msg_res1.status_code == 200
        data1 = msg_res1.json()
        assert data1["user_message"]["role"] == "user"
        assert data1["user_message"]["content"] == "Find all computer vision projects in the catalog"
        assert data1["assistant_message"]["role"] == "assistant"
        assert data1["agent_response"]["intent"] == "search"

        # 3. Check that conversation title was auto-generated and messages persisted
        get_conv = await client.get(f"/api/v1/agent/conversations/{conv_id}")
        assert get_conv.status_code == 200
        conv_detail = get_conv.json()
        assert len(conv_detail["messages"]) == 2
        assert conv_detail["title"] != "New Conversation"

        # 4. Multi-turn continuation: Send follow-up message
        msg_res2 = await client.post(
            f"/api/v1/agent/conversations/{conv_id}/messages",
            json={"content": "Summarize the repository and stack"},
        )
        assert msg_res2.status_code == 200
        data2 = msg_res2.json()
        assert data2["user_message"]["message_order"] == 2
        assert data2["assistant_message"]["message_order"] == 3

        # 5. List conversations
        list_res = await client.get("/api/v1/agent/conversations")
        assert list_res.status_code == 200
        items = list_res.json()["items"]
        assert any(c["id"] == conv_id for c in items)

        # 6. Update conversation title
        patch_res = await client.patch(
            f"/api/v1/agent/conversations/{conv_id}",
            json={"title": "Computer Vision Architecture Discussion"},
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["title"] == "Computer Vision Architecture Discussion"

        # 7. Delete conversation
        del_res = await client.delete(f"/api/v1/agent/conversations/{conv_id}")
        assert del_res.status_code == 204

        # 8. Confirm deleted
        get_del = await client.get(f"/api/v1/agent/conversations/{conv_id}")
        assert get_del.status_code == 404
