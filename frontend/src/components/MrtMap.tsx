import React from 'react';
// 引用與 NavController 相同的介面
import type { MrtStationData } from './NavController'; 

interface MrtMapProps {
    hideHeader?: boolean;
    stationsData: MrtStationData[];  // 接收包含轉乘資訊的物件陣列
    activeRouteIndex: number;
}

export default function MrtMap({ hideHeader, stationsData, activeRouteIndex }: MrtMapProps) {
    return (
        <div className="w-full h-full bg-slate-50 p-6 overflow-y-auto">
            {!hideHeader && <h2 className="text-xl font-bold mb-4">捷運路線圖</h2>}
            
            <div className="flex flex-col gap-0 relative">
                {/* 垂直連線 */}
                <div className="absolute left-4 top-4 bottom-4 w-1 bg-gray-300 rounded-full z-0"></div>

                {stationsData.map((station, index) => {
                    const isActive = index === activeRouteIndex;
                    const isPast = index < activeRouteIndex;

                    return (
                        <div key={station.code} className="relative z-10 flex items-center gap-4 py-3">
                            {/* 站點圓點 */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors ${
                                isActive ? 'bg-blue-600 animate-pulse' : isPast ? 'bg-gray-400' : 'bg-gray-300'
                            }`}>
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                            
                            {/* 站名與轉乘資訊區塊 */}
                            <div className="flex flex-col">
                                <span className={`font-bold ${isActive ? 'text-blue-600 text-lg' : 'text-gray-700'}`}>
                                    {station.code}站
                                </span>
                                
                                {/* 顯示轉乘資訊 */}
                                {station.transferLineName && (
                                    <div className="mt-1 inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold border border-purple-200 w-fit">
                                        🚇 轉乘 {station.transferLineName}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}