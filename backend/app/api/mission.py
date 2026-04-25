import logging
import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from google import genai
from google.genai import types

from ..models import SessionDep, TravelPlan, Mission
from ..config import SettingsDep
from ..utils.weather_query import get_weather
from ..utils.event_query import EventQueryManager, SearchRequest
from ..utils.metro_lookup import MetroLookup
from pydantic import BaseModel, Field

log = logging.getLogger(__name__)
router = APIRouter(prefix="/mission")

# LLM Models for Mission Generation (copied from apiresearch/mission.py)
class TaskLocation(BaseModel):
    lat: float
    lng: float

class GameTask(BaseModel):
    task_id: int
    task_name: str
    location_name: str
    description: str
    type: str
    estimated_duration_mins: int
    location: TaskLocation

class MissionResponse(BaseModel):
    tasks: List[GameTask]

@router.get("/newmission")
async def generate_new_missions(session: SessionDep, settings: SettingsDep, user_id: Optional[int] = None):
    """
    Generate 10 missions for the user based on preferences, weather, and events.
    """
    # 1. Get User Preferences from TravelPlan
    # For Hackathon, if user_id is None, just get the latest plan
    if user_id:
        stmt = select(TravelPlan).where(TravelPlan.user_id == user_id).order_by(TravelPlan.created_at.desc())
    else:
        stmt = select(TravelPlan).order_by(TravelPlan.created_at.desc())
    
    plan_record = (await session.execute(stmt)).scalars().first()
    if not plan_record:
        raise HTTPException(status_code=404, detail="No travel plan found for user. Please complete the survey first.")
    
    plan_data = plan_record.data
    prefs = plan_data.get("preferences", {})
    basic = plan_data.get("basic", {})
    
    # 2. Get Weather Info
    # Use Taipei as default location if not specified
    lat, lng = 25.0330, 121.5654
    weather_status = get_weather(lat, lng, datetime.now())
    weather_desc = f"天氣狀態: {weather_status.status} (WMO Code: {weather_status.WMO_CODE})"
    
    # 3. Get Event Info
    static_dir = os.path.join(settings.BASEDIR, "data", "static")
    events_file = os.path.join(static_dir, "events.json")
    events_desc = "今日無重大公開活動"
    
    if os.path.exists(events_file):
        try:
            with open(events_file, "r", encoding="utf-8") as f:
                cached_events = json.load(f)
                if cached_events:
                    events_desc = "\n".join([f"- {e['name']} @ {e['venue']} ({e['time']})" for e in cached_events])
        except Exception as e:
            log.error(f"Failed to read cached events: {e}")
    else:
        # Fallback to live search if no cache exists
        try:
            event_manager = EventQueryManager(settings)
            events = await event_manager.get_ai_overview(SearchRequest(query="台北今日活動"), settings)
            events_desc = "\n".join([f"- {e.name} @ {e.venue} ({e.time})" for e in events]) if events else "今日無重大公開活動"
        except Exception as e:
            log.error(f"Live event search failed: {e}")
    
    # 4. Generate Missions using Gemini
    client = genai.Client(api_key=settings.api.GEMINI_APIKEY)
    
    # Map preferences to human readable strings for the prompt
    prompt_context = f"""
    【環境資訊】
    - 當前時間：{datetime.now().strftime("%Y-%m-%d %H:%M")}
    - 今日天氣：{weather_desc}
    - 近期活動：{events_desc}
    
    【使用者偏好】
    - 旅伴：{prefs.get("q1", "未填寫")}
    - 預算：{prefs.get("q2", "未填寫")}
    - 行程緊湊度：{prefs.get("q4", "未填寫")}
    - 室內外偏好：{prefs.get("q5", "未填寫")}
    - 景點氛圍：{prefs.get("q6", "未填寫")}
    - 想體驗活動：{", ".join(prefs.get("q7", []))}
    - 夜間活動：{", ".join(prefs.get("q8", []))}
    - 絕對亮點：{prefs.get("q9", "未填寫")}
    """

    prompt = f"""
    你是一個專業的台北旅遊規劃師與實境遊戲任務設計師。
    請根據以下資訊設計 10 個具體的「打卡任務」(例如:和中正紀念堂蔣中正銅像合照)。
    
    {prompt_context}

    【任務設計規則】
    1. 嚴格設計 10 個任務。
    2. 任務必須包含明確動作與精確地點。
    3. location_name 必須是確實存在的地標。
    4. 請直接利用你的知識庫，提供該地點**最精確的經緯度座標** (lat, lng)，填入 location 欄位中。
    """

    try:
        llm_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=MissionResponse,
                temperature=0.7,
            )
        )
        
        mission_data = MissionResponse.model_validate_json(llm_response.text)
    except Exception as e:
        log.error(f"LLM Mission generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate missions via LLM.")

    # 5. Find Nearest MRT Station and Save to DB
    metro = MetroLookup(static_dir)
    
    new_missions = []
    for t in mission_data.tasks:
        nearest = metro.find_nearest_station(t.location.lat, t.location.lng)
        
        db_mission = Mission(
            user_id=user_id,
            task_name=t.task_name,
            location_name=t.location_name,
            description=t.description,
            mission_type=t.type,
            estimated_duration_mins=t.estimated_duration_mins,
            lat=t.location.lat,
            lng=t.location.lng,
            nearest_station_id=nearest["id"] if nearest else None,
            nearest_station_name=nearest["name"] if nearest else None
        )
        new_missions.append(db_mission)
    
    session.add_all(new_missions)
    await session.commit()
    
    return {
        "success": True,
        "count": len(new_missions),
        "missions": [
            {
                "id": m.id,
                "task_name": m.task_name,
                "location_name": m.location_name,
                "description": m.description,
                "nearest_station": m.nearest_station_name,
                "location": {"lat": m.lat, "lng": m.lng}
            } for m in new_missions
        ]
    }
