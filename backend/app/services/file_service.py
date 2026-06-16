from fastapi import UploadFile, HTTPException
from app.core.config import settings

ALLOWED_TYPES = {"application/pdf"}
MAX_SIZE_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


async def read_upload(file: UploadFile) -> tuple[bytes, str, str]:
    """
    Read uploaded file and return (content_bytes, filename, content_type).
    Validates type and size. Does NOT save to disk — caller stores in DB.
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Only PDF files are accepted. You uploaded: {file.content_type}"
        )

    content = await file.read()

    if len(content) > MAX_SIZE_BYTES:
        size_mb = len(content) / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"File size {size_mb:.1f}MB exceeds the {settings.MAX_FILE_SIZE_MB}MB limit"
        )

    return content, file.filename, file.content_type


# Keep save_upload for backward compatibility but now returns None
# (callers updated to use read_upload instead)
async def save_upload(file: UploadFile, folder: str = "uploads") -> str:
    """Deprecated — use read_upload() instead. Kept for compatibility."""
    content, filename, content_type = await read_upload(file)
    # Return a placeholder — callers should be updated to use read_upload
    return f"/db-stored/{filename}"