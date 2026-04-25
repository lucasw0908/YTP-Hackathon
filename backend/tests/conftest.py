import pytest
from fastapi.testclient import TestClient

from app import create_app


app = create_app()

@pytest.fixture(scope="module")
def test_client():
    with TestClient(app) as c:
        yield c