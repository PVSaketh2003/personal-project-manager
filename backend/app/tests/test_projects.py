import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_project_crud_flow(client: AsyncClient):
    # 1. Create Project
    payload = {
        "name": "Edge AI Surveillance",
        "description": "Real-time edge object detection with YOLO and TensorRT",
        "repository_url": "https://github.com/PVSaketh2003/edge-ai-surveillance",
        "status": "In Development",
        "project_type": "Machine Learning / Edge AI",
        "primary_language": "Python",
        "technologies": ["Python", "PyTorch", "TensorRT", "FastAPI"],
        "readme_summary": "High speed inference pipeline on Jetson devices",
    }
    create_res = await client.post("/api/v1/projects", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    project_id = created["id"]
    assert created["name"] == "Edge AI Surveillance"
    assert created["status"] == "In Development"
    assert "FastAPI" in created["technologies"]

    # 2. Duplicate Detection
    dup_res = await client.post("/api/v1/projects", json=payload)
    assert dup_res.status_code == 409

    # 3. Get Project by ID
    get_res = await client.get(f"/api/v1/projects/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == project_id

    # 4. Update Project (Patch)
    patch_payload = {
        "status": "Completed",
        "deployment_url": "https://demo.pvsairamsaketh.in/edge-ai",
    }
    patch_res = await client.patch(f"/api/v1/projects/{project_id}", json=patch_payload)
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Completed"
    assert patch_res.json()["deployment_url"] == "https://demo.pvsairamsaketh.in/edge-ai"

    # 5. List Projects
    list_res = await client.get("/api/v1/projects")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    assert any(p["id"] == project_id for p in list_data["items"])

    # 6. Search Projects
    search_res = await client.get("/api/v1/projects/search?q=Surveillance")
    assert search_res.status_code == 200
    assert search_res.json()["total"] >= 1

    # 7. Dashboard Statistics
    dash_res = await client.get("/api/v1/dashboard/stats")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_projects"] >= 1
    assert dash_data["completed_projects"] >= 1
    assert dash_data["deployed_projects"] >= 1

    # 8. Delete Project
    del_res = await client.delete(f"/api/v1/projects/{project_id}")
    assert del_res.status_code == 204

    # 9. Verify Deletion
    get_deleted = await client.get(f"/api/v1/projects/{project_id}")
    assert get_deleted.status_code == 404
