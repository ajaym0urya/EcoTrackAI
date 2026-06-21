import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.schemas import UtilityExtractionResponse
from backend.app.api.endpoints import get_llm_parser

client = TestClient(app)

def test_file_type_validation():
    """Verify that uploading non-allowed MIME types is rejected with 400."""
    response = client.post(
        "/api/v1/ingest",
        files={"file": ("test.txt", b"plain text content", "text/plain")}
    )
    assert response.status_code == 400
    assert "Only PDF, PNG, and JPEG formats are supported" in response.json()["detail"]

def test_empty_file_validation():
    """Verify that uploading empty files is rejected with 400."""
    response = client.post(
        "/api/v1/ingest",
        files={"file": ("empty.pdf", b"", "application/pdf")}
    )
    assert response.status_code == 400
    assert "uploaded file is empty" in response.json()["detail"]

def test_file_size_validation():
    """Verify that uploading files larger than 5MB is rejected with 400."""
    # Build content exceeding 5MB: 5MB + 1 byte
    oversized_content = b"x" * (5 * 1024 * 1024 + 1)
    response = client.post(
        "/api/v1/ingest",
        files={"file": ("large.pdf", oversized_content, "application/pdf")}
    )
    assert response.status_code == 400
    assert "exceeds maximum size limit" in response.json()["detail"]

def test_llm_parser_mock_success():
    """Verify standard response parsing when LLM succeeds."""
    mock_data = UtilityExtractionResponse(
        utility_type="electricity",
        consumption_value=325.4,
        unit="kWh",
        billing_period_start="2026-05-01",
        billing_period_end="2026-05-31"
    )

    class MockParser:
        async def parse_bill(self, file_bytes: bytes, mime_type: str):
            return mock_data

    # Override dependencies
    app.dependency_overrides[get_llm_parser] = lambda: MockParser()

    try:
        response = client.post(
            "/api/v1/ingest",
            files={"file": ("bill.png", b"fake binary data", "image/png")}
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["utility_type"] == "electricity"
        assert payload["consumption_value"] == 325.4
        assert payload["unit"] == "kWh"
        assert payload["billing_period_start"] == "2026-05-01"
        assert payload["billing_period_end"] == "2026-05-31"
    finally:
        app.dependency_overrides.clear()

def test_llm_parser_mock_failure():
    """Verify system robustness and proper status wrapping on LLM failures."""
    class FailingParser:
        async def parse_bill(self, file_bytes: bytes, mime_type: str):
            from fastapi import HTTPException
            raise HTTPException(
                status_code=502,
                detail="Error parsing bill via LLM pipeline: Mock LLM exception occurred"
            )

    app.dependency_overrides[get_llm_parser] = lambda: FailingParser()

    try:
        response = client.post(
            "/api/v1/ingest",
            files={"file": ("bill.pdf", b"fake binary data", "application/pdf")}
        )
        assert response.status_code == 502
        assert "Mock LLM exception occurred" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()

def test_rate_limiter():
    """Verify that hitting the ingest endpoint more than 5 times results in a 429."""
    from backend.app.api.endpoints import ingest_rate_limiter
    # Clear history to ensure a clean state
    ingest_rate_limiter.history.clear()

    # Make 5 requests that trigger validation failures but count as hits
    for _ in range(5):
        response = client.post(
            "/api/v1/ingest",
            files={"file": ("test.txt", b"plain text content", "text/plain")}
        )
        assert response.status_code == 400

    # The 6th request from the same IP should trigger a 429 rate limit error
    response = client.post(
        "/api/v1/ingest",
        files={"file": ("test.txt", b"plain text content", "text/plain")}
    )
    assert response.status_code == 429
    assert "Ingestion service is rate-limited" in response.json()["detail"]

