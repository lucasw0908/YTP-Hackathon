import logging

from fastapi import APIRouter

from ..config import SettingsDep
from ..utils.hotel import find_hotel


log = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Hello, World!"}

@router.get("/hotel")
async def hotel(keyword: str, settings: SettingsDep):
    return find_hotel(keyword, settings)