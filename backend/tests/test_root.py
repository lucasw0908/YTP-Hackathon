from fastapi.testclient import TestClient


def test_root(test_client: TestClient):
    response = test_client.get("/api/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World!"}