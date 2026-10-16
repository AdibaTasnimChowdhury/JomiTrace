from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_returns_200():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "JomiTrace"
    assert "version" in data
    assert data["rule_version"] == "0.2"
    assert "timestamp" in data

def test_root_endpoint_returns_service_info():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "JomiTrace"
    assert data["health_check"] == "/api/health"
