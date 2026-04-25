import React, { useRef, useMemo } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
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

interface MrtMapProps {
  selectedStation?: Station | null;
  onStationSelect?: (station: Station) => void;
}

// ... (前面 import 保持不變)

export default function MrtMap({ selectedStation = null, onStationSelect }: MrtMapProps) {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  const { currentStationCode } = useLocation();

  const currentStation = useMemo<Station | null>(() => {
    if (!currentStationCode) return null;
    return stationsData.find((s) => s.id === currentStationCode) || null;
  }, [currentStationCode]);

  const handleStationClick = (station: Station) => {
    if (onStationSelect) {
      onStationSelect(station);
    }
  };

  return (
    // 🌟 1. 拿掉 flex flex-col，改用相對定位
    <div className="mrt-map-container /bg-green-500 relative h-full w-full">

      {/* 🌟 2. 讓 Header 絕對定位在最上方 */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur shadow-sm p-4 border-b border-gray-200">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Navigation size={24} className="text-blue-500" />
          台北捷運大富翁
        </h1>
        <div className="text-xs text-gray-500 mt-1">
          {currentStation ? '📡 真實藍牙定位中' : '⚠️ 等待定位訊號...'}
        </div>
      </div>

      {/* 🌟 3. 捨棄 flex-1，強制使用絕對定位撐開剩下的空間 (避開 Header 約 76px 的高度) */}
      <div className="absolute top-[76px] left-0 right-0 bottom-0 overflow-hidden">
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
              <img
                src={mapImg}
                alt="Taipei MRT Map"
                className="map-image"
              />

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
                  onClick={() => handleStationClick(station)}
                  title={station.name}
                  aria-label={`查看 ${station.name} 站資訊`}
                />
              ))}

              {currentStation && (
                <div
                  className="absolute pointer-events-none transition-all duration-500 z-10 flex flex-col items-center"
                  style={{
                    left: `${currentStation.x}px`,
                    top: `${currentStation.y}px`,
                    transform: 'translate(-37%, -45%)'
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
                  className="absolute pointer-events-none transition-all duration-300 z-20 flex flex-col items-center"
                  style={{
                    left: `${selectedStation.x}px`,
                    top: `${selectedStation.y}px`,
                    transform: 'translate(-31%, -90%)'
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