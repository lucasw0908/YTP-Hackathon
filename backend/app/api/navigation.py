from fastapi import APIRouter, HTTPException, Query
import os
import logging
from typing import List
from pydantic import BaseModel

from app.utils.navigation_utils import NavigationMVP

router = APIRouter(prefix="/navigation", tags=["Navigation"])

# 初始化導航服務
ORS_API_KEY = "5b3ce3597851110001cf62483f55f974310b4d04b09684ea34f9b96c"
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "static")
STATION_LOC_FILE = os.path.join(STATIC_DIR, "station_location.json")
LINE_INFO_FILE = os.path.join(STATIC_DIR, "line_info.json")

try:
    nav_app = NavigationMVP(ORS_API_KEY, STATION_LOC_FILE, LINE_INFO_FILE)
except Exception as e:
    logging.error(f"Failed to initialize NavigationMVP: {e}")
    nav_app = None

class NavigationResponse(BaseModel):
    id: str
    totalDistanceMeters: int
    estimatedDurationSeconds: int
    waypoints: list

@router.get("", response_model=NavigationResponse)
def get_navigation(
    start_lat: float = Query(..., description="起點緯度"),
    start_lng: float = Query(..., description="起點經度"),
    end_lat: float = Query(..., description="終點緯度"),
    end_lng: float = Query(..., description="終點經度")
):
    if not nav_app:
        raise HTTPException(status_code=500, detail="Navigation service is not initialized properly")

    try:
        user_location = [start_lng, start_lat]
        target_location = [end_lng, end_lat]
        route_data = nav_app.plan(user_location, target_location)
        return route_data
    except Exception as e:
        logging.error(f"Navigation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
