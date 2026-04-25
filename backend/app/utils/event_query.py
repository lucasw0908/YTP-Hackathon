# search for today's events in Taipei  {fastapi uvicorn tavily-python google-genai geopy}

import os
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from tavily import TavilyClient
from google import genai
from geopy.geocoders import ArcGIS

app = FastAPI()

tavily_client = TavilyClient(api_key="")
gemini_client = genai.Client(api_key="")

geolocator = ArcGIS(user_agent="taipei_event_bot")

class SearchRequest(BaseModel):
    query: str

def get_location_data(venue_name):
    """輸入場館名稱，返回地址與經緯度"""
    if not venue_name or str(venue_name).lower() == "null":
        return {"address": None, "lat": None, "lng": None}
        
    try:
        query_target = venue_name if "台北" in venue_name else f"台北市 {venue_name}"
        location = geolocator.geocode(query_target, timeout=10)
        
        if location:
            return {
                "address": location.address,
                "lat": location.latitude,
                "lng": location.longitude
            }
        return {"address": None, "lat": None, "lng": None}
    except Exception as e:
        print(f"地點轉換失敗 ({venue_name}): {e}")
        return {"address": None, "lat": None, "lng": None}

@app.post("/api/ai-overview")
def get_ai_overview(request: SearchRequest):
    try:
        current_date_str = datetime.now().strftime("%Y年%m月%d日")
        enhanced_query = f"{request.query} 展覽 表演 {current_date_str} 場館 時間"
        
        search_response = tavily_client.search(
            query=enhanced_query,
            search_depth="advanced",
            max_results=5
        )
        
        context = ""
        for result in search_response.get("results", []):
            context += f"內容: {result['content']}\n\n"

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

        llm_response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )

        raw_text = llm_response.text.strip()
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()
            
        events = json.loads(raw_text)

        final_results = []
        for event in events:
            loc_data = get_location_data(event.get('venue'))
            
            name = event.get('name')
            time = event.get('time')
            venue = event.get('venue')
            address = loc_data['address']
            lat = loc_data['lat']
            lng = loc_data['lng']
            
            if not all([name, time, venue, address, lat, lng]):
                print(f"kicked: {name}")
                continue
                
            final_results.append({
                "name": name,
                "time": time,
                "venue": venue,
                "address": address,
                "location": {
                    "lat": lat,
                    "lng": lng
                }
            })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


query = SearchRequest(query="台北今日活動")
results = get_ai_overview(query)
    