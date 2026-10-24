from app.services.runner_service import RunnerService, find_free_port


def test_runner_helpers():
    port = find_free_port(start_port=9200)
    assert isinstance(port, int)
    assert port >= 9200

    target_dir = RunnerService.get_project_dir("My Cool Project @ 2026!")
    assert "My_Cool_Project___2026" in target_dir

    status = RunnerService.get_status("nonexistent-id")
    assert status["status"] == "idle"
