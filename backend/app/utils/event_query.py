import json
import logging
from datetime import datetime
from typing import Optional

from pydantic import BaseModel
from tavily import TavilyClient
from google import genai
from geopy.geocoders import ArcGIS
from geopy.location import Location

from ..config import SettingsDep


log = logging.getLogger(__name__)

class SearchRequest(BaseModel):
    query: str

class SearchLocation(BaseModel):
    lat: float
    lng: float
    
class SearchEvent(BaseModel):
    name: str
    time: str
    venue: str
    address: str
    location: Location
    
class EventQueryManager:
    def __init__(self, settings: SettingsDep):
        self.gemini_model_name = "gemini-2.5-flash"
        self.tavily_client = TavilyClient(settings.api.TAVILY_APIKEY)
        self.gemini_client = genai.Client(settings.api.GEMINI_APIKEY)
        self.geolocator = ArcGIS(user_agent="taipei_event_bot")

    async def get_location_data(self, venue_name: str):
        if not venue_name or str(venue_name).lower() == "null":
            return {"address": None, "lat": None, "lng": None}
            
        try:
            query_target = venue_name if "台北" in venue_name else f"台北市 {venue_name}"
            location: Optional[Location] = await self.geolocator.geocode(query_target, timeout=10)
            
            if location is not None:
                return {
                    "address": location.address,
                    "lat": location.latitude,
                    "lng": location.longitude
                }
            return {"address": None, "lat": None, "lng": None}
        
        except Exception as e:
            log.error(exc_info=e)
            return {"address": None, "lat": None, "lng": None}

    async def get_ai_overview(self, request: SearchRequest, settings: SettingsDep) -> list[SearchEvent]:
        current_date_str = datetime.now().strftime(settings.defaults.DATETIME_FORMAT)
        enhanced_query = f"{request.query} 展覽 表演 {current_date_str} 場館 時間"
        
        search_response = self.tavily_client.search(
            query=enhanced_query,
            search_depth="advanced",
            max_results=5
        )
        
        context = ""
        for result in search_response.get("results", []):
            context += f"內容: {result["content"]}\n\n"

        prompt = f"""
        你是一個精準的資料擷取助理。今天是 {current_date_str}。
        請從以下網頁內容中，找出「今天」在台北舉辦的活動。
        
        【擷取規則】：
        1. 只能從提供的網頁資料擷取，不可自行編造。
        2. "venue" 欄位請填寫「場館、展館或地標名稱」（例如：臺北市立美術館、華山文創園區）。若真的只有門牌才寫門牌。若完全無地點資訊則填 null。
        3. 剔除沒有明確時間的活動。
        
        請嚴格以 JSON 格式回傳：
        [
        {{
            "name": "活動名稱",
            "time": "時間或時段",
            "venue": "場館名稱"
        }}
        ]

        [網頁資料]:
        {context}
        """

        llm_response = self.gemini_client.models.generate_content(
            model=self.gemini_model_name,
            contents=prompt,
        )

        raw_text = llm_response.text.strip()
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()
            
        events: list[dict[str, str]] = json.loads(raw_text)

        final_results = []
        for event in events:
            loc_data = await self.get_location_data(event.get("venue"))
            
            name = event.get("name")
            time = event.get("time")
            venue = event.get("venue")
            address = loc_data["address"]
            lat = loc_data["lat"]
            lng = loc_data["lng"]
            
            if not all([name, time, venue, address, lat, lng]):
                print(f"kicked: {name}")
                continue
                
            final_results.append(SearchEvent(
                name=name,
                time=time,
                venue=venue,
                address=address,
                location=SearchLocation(lat=lat, lng=lng)
            ))
        return final_results
    