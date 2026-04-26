import requests
import logging
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


log = logging.getLogger(__name__)


class WeatherStatus(BaseModel):
    WMO_CODE: int
    status: Literal["windy", "sunny", "rainy", "large_rainy", "others"]


def get_weather(lat: float, lng: float, target_time: datetime):
    # time format: "2026-04-26 14:00"
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current_weather": True,
        "hourly": "weathercode,windspeed_10m",
        "timezone": "auto"
    }

    target_time_str = datetime.strftime(target_time, "%Y-%m-%d %H:%M")
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()

    weather_code: int = ...
    wind_speed: float = ...
    
    target_iso: str = target_time_str.replace(" ", "T")
    times: list = data["hourly"]["time"]
    
    if target_iso in times:
        idx = times.index(target_iso)
        weather_code = data["hourly"]["weathercode"][idx]
        wind_speed = data["hourly"]["windspeed_10m"][idx]
    else:
        weather_code = data["current_weather"]["weathercode"]
        wind_speed = data["current_weather"]["windspeed"]

    return parse_weather_condition(weather_code, wind_speed)


def parse_weather_condition(code: int, wind_speed: float) -> WeatherStatus:
    if wind_speed > 35.0:
        return WeatherStatus(WMO_CODE=code, status="windy")
    
    # 0-3: 晴天/多雲
    if code in [0, 1, 2, 3]:
        return WeatherStatus(WMO_CODE=code, status="sunny")
    
    # 51-63: 毛毛雨/小到中雨
    elif code in [51, 53, 55, 56, 57, 61, 63]:
        return WeatherStatus(WMO_CODE=code, status="rainy")
    
    # 65-99: 大雨/暴雨/雷陣雨/冰雹
    elif code in [65, 66, 67, 80, 81, 82, 95, 96, 99]:
        return WeatherStatus(WMO_CODE=code, status="large_rainy")
    
    log.warning(f"Unexpect WMO code: {code}")
    return WeatherStatus(WMO_CODE=code, status="others")