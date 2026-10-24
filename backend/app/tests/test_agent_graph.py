import pytest
from httpx import AsyncClient

from app.services.agent_graph import agent_workflow


@pytest.mark.asyncio
async def test_langgraph_workflow_direct():
    state = {
        "task_id": "test-task-1",
        "instruction": "Find all projects using FastAPI",
        "project_id": None,
        "is_confirmed": False,
        "intent": "",
        "target_project": None,
        "all_projects": [
            {
                "id": "proj-1",
                "name": "Backend Service",
                "technologies": ["Python", "FastAPI"],
                "status": "Completed",
                "project_type": "Backend API",
            }
        ],
        "action_result": None,
        "proposed_changes": None,
        "response_message": "",
        "requires_approval": False,
        "status": "pending",
        "error": None,
    }

    result = await agent_workflow.ainvoke(state)
    assert result["intent"] == "search"
    assert result["status"] == "executed"
    assert "Backend Service" in result["response_message"]


@pytest.mark.asyncio
async def test_langgraph_update_requires_approval():
    state = {
        "task_id": "test-task-2",
        "instruction": "Mark this project as Completed",
        "project_id": "proj-1",
        "is_confirmed": False,
        "intent": "",
        "target_project": {
            "id": "proj-1",
            "name": "Backend Service",
            "status": "In Development",
        },
        "all_projects": [],
        "action_result": None,
        "proposed_changes": None,
        "response_message": "",
        "requires_approval": False,
        "status": "pending",
        "error": None,
    }

    result = await agent_workflow.ainvoke(state)
    assert result["intent"] == "update_metadata"
    assert result["requires_approval"] is True
    assert result["proposed_changes"] == {"status": "Completed"}
    assert "confirm" in result["response_message"].lower()


@pytest.mark.asyncio
async def test_agent_api_endpoint_flow(client: AsyncClient):
    # 1. Create a project first
    p_res = await client.post(
        "/api/v1/projects",
        json={"name": "Vision AI", "description": "Computer vision pipelines", "status": "In Development"},
    )
    p_id = p_res.json()["id"]

    # 2. Ask agent to summarize
    task_res = await client.post(
        "/api/v1/agent/tasks",
        json={"instruction": "Summarize project Vision AI", "project_id": p_id},
    )
    assert task_res.status_code == 200
    data = task_res.json()
    assert data["intent"] == "summary"
    assert "Vision AI" in data["response_message"]

    # 3. List agent tasks to verify database audit log
    history_res = await client.get("/api/v1/agent/tasks")
    assert history_res.status_code == 200
    tasks_list = history_res.json()
    assert tasks_list["total"] >= 1
    assert any(t["id"] == data["task_id"] for t in tasks_list["items"])
