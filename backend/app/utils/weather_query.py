# 用經緯度跟時間查詢天氣狀況，four states: sunny, rainy, largerainy, windy

import requests
from datetime import datetime

def get_weather(lat, lon, target_time=None):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current_weather": True,
        "hourly": "weathercode,windspeed_10m",
        "timezone": "auto"
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        weather_code = None
        wind_speed = None

        if target_time:
            target_iso = target_time.replace(" ", "T")
            times = data["hourly"]["time"]
            
            if target_iso in times:
                idx = times.index(target_iso)
                weather_code = data["hourly"]["weathercode"][idx]
                wind_speed = data["hourly"]["windspeed_10m"][idx]
            else:
                return "Error: 找不到該時間點的預報資料 (超出預報範圍或格式錯誤)"
        else:
            weather_code = data["current_weather"]["weathercode"]
            wind_speed = data["current_weather"]["windspeed"]

        return parse_weather_condition(weather_code, wind_speed)

    except requests.exceptions.RequestException as e:
        return f"Error: 請求失敗 {e}"

def parse_weather_condition(code, wind_speed):
    if wind_speed > 35.0:
        return "windy"
        
    # WMO code
    # 0-3: 晴天/多雲
    if code in [0, 1, 2, 3]:
        return "sunny"
    # 51-63: 毛毛雨/小到中雨
    elif code in [51, 53, 55, 56, 57, 61, 63]:
        return "rainy"
    # 65-99: 大雨/暴雨/雷陣雨/冰雹
    elif code in [65, 66, 67, 80, 81, 82, 95, 96, 99]:
        return "largerainy"
    else:
        # idk what is this...
        return "other"


test_lat = 25.0769078
test_lon = 121.5733101

future_time = "2026-04-26 14:00" 
forecast = get_weather(test_lat, test_lon, future_time) # 預測
print(f"({future_time}): {forecast}")
forecast = get_weather(test_lat, test_lon) # 當下
print(f"(current): {forecast}")