import logging
import json
import os
import asyncio
import httpx
from datetime import datetime
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from google import genai
from google.genai import types
from pydantic import BaseModel

from ..models import SessionDep, TravelPlan, Mission
from ..config import SettingsDep
from ..utils.weather_query import get_weather
from ..utils.event_query import EventQueryManager, SearchRequest
from ..utils.metro_lookup import MetroLookup

log = logging.getLogger(__name__)
router = APIRouter(prefix="/mission")

# 1. 修改 Pydantic 模型，移除經緯度欄位
class GameTask(BaseModel):
    task_id: int
    task_name: str
    location_name: str
    description: str
    type: str
    estimated_duration_mins: int

class MissionResponse(BaseModel):
    tasks: List[GameTask]

# 2. 實作非同步地理編碼函數 (若查無結果回傳 None)
async def geocode_location(location_name: str, default_city: str = "台北") -> Optional[Tuple[float, float]]:
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": f"{default_city} {location_name}",
        "format": "json",
        "limit": 1
    }
    headers = {
        "User-Agent": "MissionGeneratorApp/1.0"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                if data:
                    return float(data[0]["lat"]), float(data[0]["lon"])
        except Exception as e:
            log.error(f"Geocoding error for {location_name}: {e}")
            
    return None

@router.get("/newmission")
async def generate_new_missions(session: SessionDep, settings: SettingsDep, user_id: Optional[int] = None):
    """
    Generate missions for the user based on preferences, weather, and events.
    """
    if user_id:
        stmt = select(TravelPlan).where(TravelPlan.user_id == user_id).order_by(TravelPlan.created_at.desc())
    else:
        stmt = select(TravelPlan).order_by(TravelPlan.created_at.desc())
    
    plan_record = (await session.execute(stmt)).scalars().first()
    if not plan_record:
        raise HTTPException(status_code=404, detail="No travel plan found for user. Please complete the survey first.")
    
    plan_data = plan_record.data
    prefs = plan_data.get("preferences", {})
    
    lat, lng = 25.0330, 121.5654
    weather_status = get_weather(lat, lng, datetime.now())
    weather_desc = f"天氣狀態: {weather_status.status} (WMO Code: {weather_status.WMO_CODE})"
    
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
        try:
            event_manager = EventQueryManager(settings)
            events = await event_manager.get_ai_overview(SearchRequest(query="台北今日活動"), settings)
            events_desc = "\n".join([f"- {e.name} @ {e.venue} ({e.time})" for e in events]) if events else "今日無重大公開活動"
        except Exception as e:
            log.error(f"Live event search failed: {e}")
    
    client = genai.Client(api_key=settings.api.GEMINI_APIKEY)
    
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
    3. location_name 必須是確實存在的知名地標或店家，名稱需完整準確以便於地圖搜尋。
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

    # 3. 取得經緯度，並過濾失敗的任務
    tasks = [geocode_location(t.location_name) for t in mission_data.tasks]
    coordinates = await asyncio.gather(*tasks)

    metro = MetroLookup(static_dir)
    new_missions = []
    
    for t, coords in zip(mission_data.tasks, coordinates):
        if not coords:
            # 查詢不到經緯度就放棄此任務
            log.warning(f"Skipping task '{t.task_name}': Geocoding failed for '{t.location_name}'")
            continue
            
        lat, lng = coords
        nearest = metro.find_nearest_station(lat, lng)
        
        db_mission = Mission(
            user_id=user_id,
            task_name=t.task_name,
            location_name=t.location_name,
            description=t.description,
            mission_type=t.type,
            estimated_duration_mins=t.estimated_duration_mins,
            lat=lat,
            lng=lng,
            nearest_station_id=nearest["id"] if nearest else None,
            nearest_station_name=nearest["name"] if nearest else None
        )
        new_missions.append(db_mission)
    
    if not new_missions:
         raise HTTPException(status_code=500, detail="Failed to geocode any of the generated missions.")

    session.add_all(new_missions)
    await session.commit()
    
    return {
        "success": True,
        "count": len(new_missions), # 回傳實際成功建立的任務數量
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