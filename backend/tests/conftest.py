import pytest
from fastapi.testclient import TestClient

from app import create_app


app = create_app()

@pytest.fixture(scope="module")
def test_client():
    with TestClient(app) as c:
        yield c
        
@pytest.mark.webtest
def test_root(test_client: TestClient):
    response = test_client.get("/api/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World!"}