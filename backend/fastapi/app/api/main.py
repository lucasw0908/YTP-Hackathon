import logging

from fastapi import APIRouter


log = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Hello, World!"}