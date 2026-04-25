import logging

from fastapi import APIRouter, File, UploadFile, HTTPException

from ..config import SettingsDep
from ..utils.hotel import find_hotel
from ..utils.judge import judge_mission


log = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Hello, World!"}

@router.get("/hotel")
async def hotel(keyword: str, settings: SettingsDep):
    return find_hotel(keyword, settings)


@router.post("/judge")
async def judge(mission_description: str, settings: SettingsDep, file: UploadFile = File(...)):
    
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="only support JPG or PNG")
    
    content = await file.read()
    return await judge_mission(mission_description, settings, content, file.content_type)