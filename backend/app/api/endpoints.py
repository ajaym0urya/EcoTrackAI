import time
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from backend.app.schemas import UtilityExtractionResponse
from backend.app.services.llm_parser import LLMParserService
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/api/v1")

class RateLimiter:
    """Memory-based sliding window rate limiter to protect Gemini API token usage."""
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window = window_seconds
        self.history = {}

    async def __call__(self, request: Request):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        if client_ip not in self.history:
            self.history[client_ip] = []
            
        # Retain only timestamps within the active time window
        self.history[client_ip] = [t for t in self.history[client_ip] if now - t < self.window]
        
        if len(self.history[client_ip]) >= self.limit:
            logger.warning(f"Rate limit tripped for IP {client_ip}.")
            raise HTTPException(
                status_code=429,
                detail="Too many upload requests. Ingestion service is rate-limited to 5 bills per minute."
            )
            
        self.history[client_ip].append(now)

# Limit to 5 file uploads per minute per IP address
ingest_rate_limiter = RateLimiter(limit=5, window_seconds=60)

# Constraints: Max file size (5MB), Valid mime-types
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
VALID_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg"
}

def get_llm_parser() -> LLMParserService:
    return LLMParserService()

@router.post(
    "/ingest",
    response_model=UtilityExtractionResponse,
    summary="Ingest and parse a utility bill PDF/Image",
    description="Validates the file format and size, calls the Vision LLM parsing service, and returns structured consumption metrics.",
    dependencies=[Depends(ingest_rate_limiter)]
)
async def ingest_bill(
    file: UploadFile = File(...),
    parser: LLMParserService = Depends(get_llm_parser)
):
    # Validate content-type
    if file.content_type not in VALID_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Only PDF, PNG, and JPEG formats are supported."
        )

    # Read bytes and validate file size
    file_bytes = await file.read()
    file_size = len(file_bytes)
    
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum size limit of 5MB. Uploaded size: {file_size / (1024 * 1024):.2f}MB."
        )
        
    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty."
        )

    logger.info(f"Processing upload: {file.filename} ({file.content_type}, {file_size} bytes)")
    
    # Process file through parsing service
    extracted_data = await parser.parse_bill(file_bytes, file.content_type)
    return extracted_data
