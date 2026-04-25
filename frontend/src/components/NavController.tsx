import React, { useEffect, useState } from 'react';
import { Map, Train, X } from 'lucide-react';
import NavigationMap from './NavigationMap';
import MrtMap from './MrtMap';
import { useNavigation } from '../hooks/useNavigation';
import type { Route, TransportMode } from '../types/wayPoint';

const MODE_LABEL: Record<TransportMode, string> = {
    walk: '步行中',
    bike: '騎車中',
    metro: '搭捷運中',
};
const MODE_EMOJI: Record<TransportMode, string> = {
    walk: '🚶',
    bike: '🚲',
    metro: '🚇',
};

interface NavControllerProps {
    route: Route;
}

export default function NavController({ route }: NavControllerProps) {
    const nav = useNavigation(route);

    // null = 跟著 positioning 自動切換；true = 強制顯示捷運圖
    const [manualMrt, setManualMrt] = useState<boolean | null>(null);

    // 定位模式切換時清除手動覆蓋，回到自動
    useEffect(() => {
        setManualMrt(null);
    }, [nav.activePositioning]);

    const showMrt = manualMrt !== null ? manualMrt : nav.activePositioning === 'beacon';

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* 實體地圖層 */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${showMrt ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <NavigationMap route={route} />
            </div>

            {/* 捷運圖層 */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${showMrt ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <MrtMap />
            </div>

            {/* 地圖切換按鈕（右上角） */}
            <div className="absolute top-4 right-4 z-1000 flex bg-white rounded-full shadow-lg p-1 gap-1">
                <button
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${!showMrt ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    onClick={() => setManualMrt(showMrt ? null : false)}
                >
                    <Map size={13} /> 地圖
                </button>
                <button
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${showMrt ? 'bg-purple-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    onClick={() => setManualMrt(showMrt ? null : true)}
                >
                    <Train size={13} /> 捷運
                </button>
            </div>

            {/* 提示橫幅 */}
            {nav.pendingInstruction && !nav.isComplete && (
                <div className="absolute top-16 left-4 right-4 z-1000 bg-amber-400 text-amber-900 px-4 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center justify-between">
                    <span>{nav.pendingInstruction}</span>
                    <button onClick={nav.clearInstruction} className="ml-3 shrink-0">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* 抵達橫幅 */}
            {nav.isComplete && (
                <div className="absolute top-16 left-4 right-4 z-1000 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-bold text-center">
                    🎉 已抵達目的地！
                </div>
            )}

            {/* 底部狀態列 */}
            <div className="absolute bottom-4 left-4 right-4 z-1000 bg-white/90 backdrop-blur rounded-xl shadow px-4 py-2 flex items-center gap-3 text-sm">
                <span className="text-2xl">{MODE_EMOJI[nav.activeMode]}</span>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 truncate">
                        {nav.isComplete ? '導航完成' : MODE_LABEL[nav.activeMode]}
                    </div>
                    <div className="text-xs text-gray-500">
                        {nav.activePositioning === 'gps' ? '📡 GPS 定位中' : '🔵 Beacon 定位中'}
                    </div>
                </div>
                <div className="text-xs text-gray-400 shrink-0">
                    {nav.currentIndex} / {route.waypoints.length}
                </div>
                {/* 測試用手動推進 */}
                {import.meta.env.DEV && (
                    <button
                        onClick={nav.advance}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg text-gray-600"
                    >
                        ▶
                    </button>
                )}
            </div>
        </div>
    );
}
