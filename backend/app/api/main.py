import logging

from fastapi import APIRouter

from ..utils.hotel import get_all_hotels


log = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Hello, World!"}

@router.get("/hotel")
async def hotel():
    return get_all_hotels()