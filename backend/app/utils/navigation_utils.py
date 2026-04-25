import json
import math
import requests
from collections import deque

class OpenRouteServiceClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {'Authorization': api_key, 'Content-Type': 'application/json'}
        self.base_url = "https://api.openrouteservice.org"

    def _get_route(self, profile: str, start_lon_lat, end_lon_lat):
        url = f"{self.base_url}/v2/directions/{profile}/geojson"
        payload = {"coordinates": [start_lon_lat, end_lon_lat]}
        res = requests.post(url, json=payload, headers=self.headers)
        if res.status_code == 200:
            feature = res.json()['features'][0]
            return {
                'summary': feature['properties']['summary'],
                'coordinates': feature['geometry']['coordinates']
            }
        return None

    def get_walking_route(self, start_lon_lat, end_lon_lat):
        return self._get_route("foot-walking", start_lon_lat, end_lon_lat)

    def get_cycling_route(self, start_lon_lat, end_lon_lat):
        return self._get_route("cycling-regular", start_lon_lat, end_lon_lat)

class MRTNetwork:
    def __init__(self, station_locations: list, line_info: list):
        self.stations = {}
        self.graph = {}
        self._initialize_data(station_locations, line_info)

    def _haversine(self, lat1, lon1, lat2, lon2):
        R, phi1, phi2 = 6371000, math.radians(lat1), math.radians(lat2)
        dphi, dlambda = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
        a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
        return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    def _initialize_data(self, locations: list, lines: list):
        name_to_ids = {}
        for loc in locations:
            s_id = loc["StationID"]
            s_name = loc["StationName"]["Zh_tw"]
            self.stations[s_id] = {
                "name": s_name,
                "lat": loc["StationPosition"]["PositionLat"],
                "lon": loc["StationPosition"]["PositionLon"],
                "line": "".join([c for c in s_id if c.isalpha()])
            }
            if s_name not in name_to_ids:
                name_to_ids[s_name] = []
            name_to_ids[s_name].append(s_id)
            self.graph[s_id] = set()

        for line in lines:
            sorted_stations = sorted(line["Stations"], key=lambda x: x["Sequence"])
            for i, st in enumerate(sorted_stations):
                s_id = st["StationID"]
                if i > 0:
                    prev_id = sorted_stations[i-1]["StationID"]
                    if prev_id in self.graph and s_id in self.graph:
                        self.graph[s_id].add(prev_id)
                        self.graph[prev_id].add(s_id)

        for ids in name_to_ids.values():
            for i in range(len(ids)):
                for j in range(i + 1, len(ids)):
                    if ids[i] in self.graph and ids[j] in self.graph:
                        self.graph[ids[i]].add(ids[j])
                        self.graph[ids[j]].add(ids[i])

    def find_nearest_station(self, lat: float, lon: float):
        return min(
            self.stations.keys(),
            key=lambda sid: self._haversine(lat, lon, self.stations[sid]["lat"], self.stations[sid]["lon"])
        )

    def get_route_path_stations(self, start_id: str, end_id: str):
        queue = deque([[start_id]])
        visited = set([start_id])
        path = []
        
        while queue:
            curr_path = queue.popleft()
            node = curr_path[-1]
            if node == end_id:
                path = curr_path
                break
            for neighbor in self.graph.get(node, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(curr_path + [neighbor])
                    
        if not path: return []
        
        result = []
        for s_id in path:
            st = self.stations[s_id]
            result.append({
                "name": st["name"], 
                "coord": [st["lon"], st["lat"]],
                "line": st["line"],
                "stationCode": s_id
            })
        return result

class YouBikeManager:
    def __init__(self):
        self.stations = []
        self._fetch_data()
        
    def _fetch_data(self):
        try:
            res = requests.get("https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json")
            if res.status_code == 200:
                self.stations = res.json()
        except:
            pass

    def _haversine(self, lat1, lon1, lat2, lon2):
        R, phi1, phi2 = 6371000, math.radians(lat1), math.radians(lat2)
        dphi, dlambda = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
        a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
        return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    def find_nearest_station(self, lat, lon, action="rent", max_dist=800):
        best_station = None
        min_dist = max_dist
        
        for st in self.stations:
            if st.get('act') != '1': continue
            if action == "rent" and st.get('available_rent_bikes', 0) == 0: continue
            if action == "return" and st.get('available_return_bikes', 0) == 0: continue
                
            d = self._haversine(lat, lon, st['latitude'], st['longitude'])
            if d < min_dist:
                min_dist = d
                best_station = st
                
        return best_station

class NavigationMVP:
    def __init__(self, ors_key: str, loc_file: str, line_file: str):
        self.ors = OpenRouteServiceClient(ors_key)
        with open(loc_file, 'r', encoding='utf-8') as f:
            loc_data = json.load(f)
        with open(line_file, 'r', encoding='utf-8') as f:
            line_data = json.load(f)
            
        self.mrt = MRTNetwork(loc_data, line_data)
        self.youbike = YouBikeManager()

    def _optimize_with_youbike(self, start_loc, end_loc, walk_route):
        if not walk_route: return None
        rent_st = self.youbike.find_nearest_station(start_loc[1], start_loc[0], action="rent", max_dist=600)
        return_st = self.youbike.find_nearest_station(end_loc[1], end_loc[0], action="return", max_dist=600)
        
        if rent_st and return_st and rent_st['sno'] != return_st['sno']:
            rent_loc = [rent_st['longitude'], rent_st['latitude']]
            return_loc = [return_st['longitude'], return_st['latitude']]
            
            walk1 = self.ors.get_walking_route(start_loc, rent_loc)
            bike = self.ors.get_cycling_route(rent_loc, return_loc)
            walk2 = self.ors.get_walking_route(return_loc, end_loc)
            
            if walk1 and bike and walk2:
                total_duration = walk1['summary']['duration'] + bike['summary']['duration'] + walk2['summary']['duration'] + 180
                total_distance = walk1['summary']['distance'] + bike['summary']['distance'] + walk2['summary']['distance']
                if total_duration + 120 <= walk_route['summary']['duration']:
                    return [
                        {"mode": "walk", "coords": walk1['coordinates']},
                        {"mode": "bike", "coords": bike['coordinates']},
                        {"mode": "walk", "coords": walk2['coordinates']}
                    ], total_duration, total_distance
        return None

    def _add_surface_segments(self, waypoints, segments):
        for seg in segments:
            coords = seg["coords"]
            mode = seg["mode"]
            for i, coord in enumerate(coords):
                if i == 0 and waypoints:
                    last_wp = waypoints[-1]
                    # 處理步行與自行車的切換點
                    if last_wp['mode'] in ['walk', 'bike'] and last_wp['mode'] != mode and last_wp['role'] == 'waypoint':
                        last_wp['role'] = 'transition'
                        last_wp['mode'] = mode
                        last_wp['instruction'] = '請在此租借 YouBike 並開始騎乘' if mode == 'bike' else '請在此歸還 YouBike 並改為步行'
                        continue
                    # 若為出站後的銜接，跳過重複座標
                    if last_wp['role'] == 'transition' and 'station' in last_wp:
                        continue

                waypoints.append({
                    "coord": coord,
                    "mode": mode,
                    "role": "waypoint",
                    "positioning": "gps"
                })

    def plan(self, start_coord, end_coord):
        waypoints = []
        total_duration = 0
        total_distance = 0

        start_st_id = self.mrt.find_nearest_station(start_coord[1], start_coord[0])
        end_st_id = self.mrt.find_nearest_station(end_coord[1], end_coord[0])
        start_st = self.mrt.stations[start_st_id]
        end_st = self.mrt.stations[end_st_id]

        # 1. 起點 -> 捷運站
        walk_to_start = self.ors.get_walking_route(start_coord, [start_st["lon"], start_st["lat"]])
        if walk_to_start:
            yb_opt = self._optimize_with_youbike(start_coord, [start_st["lon"], start_st["lat"]], walk_to_start)
            if yb_opt:
                self._add_surface_segments(waypoints, yb_opt[0])
                total_duration += yb_opt[1]
                total_distance += yb_opt[2]
            else:
                self._add_surface_segments(waypoints, [{"mode": "walk", "coords": walk_to_start['coordinates']}])
                total_duration += walk_to_start['summary']['duration']
                total_distance += walk_to_start['summary']['distance']

        # 2. 進入捷運站
        mrt_stations = self.mrt.get_route_path_stations(start_st_id, end_st_id)
        if waypoints and mrt_stations:
            waypoints[-1].update({
                "role": "transition",
                "mode": "metro",
                "positioning": "beacon",
                "instruction": f"進入 {mrt_stations[0]['name']} 站搭乘捷運",
                "station": mrt_stations[0]['name'],
                "stationCode": mrt_stations[0]['stationCode']
            })

        # 3. 捷運路徑與轉乘
        for i in range(len(mrt_stations)):
            st = mrt_stations[i]
            total_duration += 120 # 預估每站約 2 分鐘
            
            if i == len(mrt_stations) - 1:
                waypoints.append({
                    "coord": st["coord"],
                    "mode": "metro",
                    "role": "waypoint",
                    "positioning": "beacon",
                    "station": st["name"],
                    "stationCode": st["stationCode"],
                    "line": st["line"]
                })
                break

            next_st = mrt_stations[i+1]
            if st["name"] == next_st["name"] and st["line"] != next_st["line"]:
                waypoints.append({
                    "coord": st["coord"],
                    "mode": "metro",
                    "role": "transfer",
                    "positioning": "beacon",
                    "station": st["name"],
                    "stationCode": st["stationCode"],
                    "fromLine": st["line"],
                    "toLine": next_st["line"],
                    "instruction": f"於 {st['name']} 轉乘 {next_st['line']} 線"
                })
                total_duration += 300 # 轉乘預估時間
            else:
                waypoints.append({
                    "coord": st["coord"],
                    "mode": "metro",
                    "role": "waypoint",
                    "positioning": "beacon",
                    "station": st["name"],
                    "stationCode": st["stationCode"],
                    "line": st["line"]
                })

        # 4. 離開捷運站
        walk_to_end = self.ors.get_walking_route([end_st["lon"], end_st["lat"]], end_coord)
        if waypoints and walk_to_end:
            waypoints[-1].update({
                "role": "transition",
                "mode": "walk",
                "positioning": "gps",
                "instruction": f"離開 {mrt_stations[-1]['name']} 站"
            })

        # 5. 捷運站 -> 終點
        if walk_to_end:
            yb_opt = self._optimize_with_youbike([end_st["lon"], end_st["lat"]], end_coord, walk_to_end)
            if yb_opt:
                self._add_surface_segments(waypoints, yb_opt[0])
                total_duration += yb_opt[1]
                total_distance += yb_opt[2]
            else:
                self._add_surface_segments(waypoints, [{"mode": "walk", "coords": walk_to_end['coordinates']}])
                total_duration += walk_to_end['summary']['duration']
                total_distance += walk_to_end['summary']['distance']

        # 6. 標記終點
        if waypoints:
            waypoints[-1]['role'] = 'destination'

        return {
            "id": "route_generated_01",
            "totalDistanceMeters": round(total_distance),
            "estimatedDurationSeconds": round(total_duration),
            "waypoints": waypoints
        }
