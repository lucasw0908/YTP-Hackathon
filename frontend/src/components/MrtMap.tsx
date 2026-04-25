import { useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { MapPin, Navigation } from 'lucide-react';
import classNames from 'classnames';

import stationsRaw from '../assets/stations.json';
import './MrtMap.css';
import mapImg from "../assets/metro.png";
import { useLocation } from '../contexts/LocationContext';

export interface Station {
  id: string;
  name: string;
  x: number;
  y: number;
}

const stationsData = stationsRaw as Station[];

export interface RouteStationEntry {
  code: string;
  name?: string;
}

interface MrtMapProps {
  selectedStation?: Station | null;
  onStationSelect?: (station: Station) => void;
  hideHeader?: boolean;
  /** 路線站點列表，優先以 code 查找，找不到時 fallback 用 name 查找（不同線別同站名） */
  routeStations?: RouteStationEntry[];
  activeRouteIndex?: number;
}

export default function MrtMap({
  selectedStation = null,
  onStationSelect,
  hideHeader = false,
  routeStations: routeStationsProp,
  activeRouteIndex = -1,
}: MrtMapProps) {
  const { currentStationCode } = useLocation();

  const currentStation = useMemo<Station | null>(() => {
    if (!currentStationCode) return null;
    return stationsData.find((s) => s.id === currentStationCode) || null;
  }, [currentStationCode]);

  const resolvedRouteStations = useMemo(() => {
    if (!routeStationsProp) return [];
    return routeStationsProp.map((entry, idx) => {
      // 優先 ID 精確比對，找不到時 fallback 名稱比對（同物理站、不同線別 code 的情況）
      const station =
        stationsData.find(s => s.id === entry.code) ??
        (entry.name ? stationsData.find(s => s.name === entry.name) : undefined) ??
        null;
      return { station, code: entry.code, name: entry.name, idx };
    }).filter(e => e.station !== null) as { station: Station; code: string; name?: string; idx: number }[];
  }, [routeStationsProp]);

  const mapAreaTop = hideHeader ? 0 : 76;

  return (
    <div className="mrt-map-container relative h-full w-full">
      {!hideHeader && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur shadow-sm p-4 border-b border-gray-200">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Navigation size={24} className="text-blue-500" />
            台北捷運大富翁
          </h1>
          <div className="text-xs text-gray-500 mt-1">
            {currentStation ? '📡 真實藍牙定位中' : '⚠️ 等待定位訊號...'}
          </div>
        </div>
      )}

      <div
        className="absolute left-0 right-0 bottom-0 overflow-hidden"
        style={{ top: mapAreaTop }}
      >
        <TransformWrapper
          initialScale={1.5}
          minScale={0.5}
          maxScale={5}
          centerOnInit={true}
          wheel={{ step: 0.001 }}
          doubleClick={{ disabled: true }}
          pinch={{ step: 5 }}
          limitToBounds={true}
          panning={{ velocityDisabled: false, lockAxisX: false, lockAxisY: false }}
        >
          <TransformComponent
            wrapperClass="react-transform-wrapper"
            contentClass="react-transform-component"
          >
            <div className="map-content">
              <img src={mapImg} alt="Taipei MRT Map" className="map-image" />

              {stationsData.map((station) => (
                <button
                  key={station.id}
                  className={classNames(
                    'station-button absolute w-6 h-6 -ml-[5px] -mt-[5px] rounded-full cursor-pointer transition-colors',
                    {
                      'ring-4 ring-red-500 bg-red-500/30': selectedStation?.id === station.id,
                      'hover:bg-black/10': selectedStation?.id !== station.id,
                    }
                  )}
                  style={{ left: `${station.x}px`, top: `${station.y}px` }}
                  onClick={() => onStationSelect?.(station)}
                  title={station.name}
                  aria-label={`查看 ${station.name} 站資訊`}
                />
              ))}

              {/* 路線站點高亮徽章 */}
              {resolvedRouteStations.map(({ station, idx }) => {
                const isPast = activeRouteIndex >= 0 && idx < activeRouteIndex;
                const isActive = activeRouteIndex >= 0 && idx === activeRouteIndex;
                const bg = isPast ? '#9ca3af' : isActive ? '#3b82f6' : '#f97316';
                const size = isActive ? 22 : 18;
                return (
                  <div
                    key={`route-${idx}`}
                    className="absolute pointer-events-none z-20"
                    style={{
                      left: station.x,
                      top: station.y,
                      transform: 'translate(-50%, calc(-100% - 6px))',
                    }}
                  >
                    <div
                      style={{
                        width: size, height: size,
                        borderRadius: '50%',
                        background: bg,
                        border: '2px solid white',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 'bold', color: 'white',
                      }}
                    >
                      {idx + 1}
                    </div>
                  </div>
                );
              })}

              {/* 使用者目前位置（beacon） */}
              {currentStation && (
                <div
                  className="absolute pointer-events-none transition-all duration-500 z-30 flex flex-col items-center"
                  style={{
                    left: currentStation.x,
                    top: currentStation.y,
                    transform: 'translate(-37%, -45%)',
                  }}
                >
                  <MapPin size={32} fill="#3b82f6" color="white" className="animate-pulse drop-shadow-md" />
                  <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded mt-1 shadow whitespace-nowrap font-bold">
                    你在這裡
                  </span>
                </div>
              )}

              {selectedStation && (
                <div
                  className="absolute pointer-events-none transition-all duration-300 z-40 flex flex-col items-center"
                  style={{
                    left: selectedStation.x,
                    top: selectedStation.y,
                    transform: 'translate(-31%, -90%)',
                  }}
                >
                  <MapPin size={36} fill="#e53e3e" color="white" className="animate-bounce drop-shadow-lg" />
                </div>
              )}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
}
