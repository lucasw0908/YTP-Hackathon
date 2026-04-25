// src/components/NavigationMap.tsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLocation } from '../contexts/LocationContext';

// 🐛 修復 Leaflet 預設 Icon 破圖的問題 (Webpack/Vite 常見問題)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 🌟 自訂：代表「使用者現在位置」的藍色小圓點
const userIcon = L.divIcon({
  className: 'custom-user-icon',
  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// 讓地圖自動跟隨使用者的 Hook
function MapAutoCenter({ gps }: { gps: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (gps) {
      map.flyTo([gps.lat, gps.lng], map.getZoom()); // 平滑移動到玩家位置
    }
  }, [gps, map]);
  return null;
}

// 傳入 Props：目的地與後端給的路徑
interface NavigationMapProps {
  destinationName: string;
  routeCoords: { lat: number; lng: number }[]; // 後端算好的路線 [起點, 轉彎處..., 終點]
}

export default function NavigationMap({ destinationName, routeCoords }: NavigationMapProps) {
  const { gps } = useLocation(); // 從我們之前寫好的 Context 拿實時 GPS

  // 如果還沒抓到 GPS，先用台北車站當預設中心
  const centerPos: [number, number] = gps ? [gps.lat, gps.lng] : [25.0478, 121.5170];
  const destPos = routeCoords.length > 0 ? routeCoords[routeCoords.length - 1] : null;

  return (
    <div className="w-full h-full relative">
      {!gps && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-sm font-bold shadow">
          正在獲取 GPS 定位...
        </div>
      )}

      {/* 建立 Leaflet 地圖 */}
      <MapContainer 
        center={centerPos} 
        zoom={16} 
        style={{ height: '100%', width: '100%', zIndex: 10 }}
        zoomControl={false}
      >
        {/* 底圖圖層：使用免費的 CartoDB 漂亮底圖 (比預設的 OSM 更適合導航) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* 自動跟隨視角 */}
        <MapAutoCenter gps={gps} />

        {/* 1. 畫出導航路線 (藍色粗線) */}
        {routeCoords.length > 0 && (
          <Polyline 
            positions={routeCoords.map(c => [c.lat, c.lng])} 
            color="#3b82f6" 
            weight={6} 
            opacity={0.7} 
          />
        )}

        {/* 2. 終點標記 */}
        {destPos && (
          <Marker position={[destPos.lat, destPos.lng]}>
            <Popup>
              <strong>任務終點：</strong><br />{destinationName}
            </Popup>
          </Marker>
        )}

        {/* 3. 使用者實時位置標記 */}
        {gps && (
          <Marker position={[gps.lat, gps.lng]} icon={userIcon} zIndexOffset={1000} />
        )}
      </MapContainer>
    </div>
  );
}