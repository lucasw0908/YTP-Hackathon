import json
import os
import math
from typing import Dict, List, Optional

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

class MetroLookup:
    def __init__(self, static_dir: str):
        file_path = os.path.join(static_dir, "station_location.json")
        with open(file_path, "r", encoding="utf-8") as f:
            self.stations = json.load(f)

    def find_nearest_station(self, lat: float, lng: float) -> Optional[Dict]:
        if lat is None or lng is None:
            return None
            
        min_dist = float('inf')
        nearest = None
        
        for station in self.stations:
            s_lat = station["StationPosition"]["PositionLat"]
            s_lng = station["StationPosition"]["PositionLon"]
            dist = haversine(lat, lng, s_lat, s_lng)
            if dist < min_dist:
                min_dist = dist
                nearest = {
                    "id": station["StationID"],
                    "name": station["StationName"]["Zh_tw"],
                    "distance": dist
                }
        return nearest
