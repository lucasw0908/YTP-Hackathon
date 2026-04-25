import React, { useEffect, useMemo, useState } from 'react';
import { Map, Train } from 'lucide-react';
import NavigationMap from './NavigationMap';
import MrtMap from './MrtMap';
import { useNavigation } from '../hooks/useNavigation';
import { useLocation as useLocationCtx } from '../contexts/LocationContext';
import type { Route, TransportMode, Waypoint } from '../types/wayPoint';

// 定義要傳遞給 MrtMap 的站點與轉乘資訊
export interface MrtStationData {
    code: string;
    transferToLine?: string;
    transferLineName?: string;
}

const LINE_NAMES: Record<string, string> = {
    BL: '板南線', BR: '文湖線', G: '松山新店線',
    O: '中和新蘆線', R: '淡水信義線', Y: '環狀線',
};

const MODE_EMOJI: Record<TransportMode, string> = {
    walk: '🚶', bike: '🚲', metro: '🚇',
};

function activityDesc(mode: TransportMode, wp?: Waypoint | null): string {
    if (mode === 'walk') return '沿綠色路徑步行';
    if (mode === 'bike') return '沿橘色路徑騎車';
    if (mode === 'metro') {
        const line = (wp as any)?.line as string | undefined;
        return `搭乘${line ? (LINE_NAMES[line] ?? line) : '捷運'}`;
    }
    return '前進中';
}

function computeNextAction(route: Route, currentIndex: number, mode: TransportMode, isComplete: boolean): string {
    if (isComplete) return '已抵達目的地 ✅';
    const { waypoints } = route;
    const currentWp = waypoints[currentIndex] ?? null;
    const base = activityDesc(mode, currentWp);

    if (
        currentWp &&
        (currentWp.role === 'transition' || currentWp.role === 'transfer' || currentWp.role === 'destination')
    ) {
        return (currentWp as any).instruction ?? base;
    }

    for (let i = currentIndex + 1; i < waypoints.length; i++) {
        const wp = waypoints[i];
        if (wp.role === 'waypoint') continue;

        if (wp.role === 'transition') {
            const station = (wp as any).station as string | undefined;
            if (wp.mode === 'metro') return `${base}，前往${station ?? ''}站入站`;
            if (wp.mode === 'walk') return `${base}，即將出站步行`;
            return `${base}，即將切換交通方式`;
        }
        if (wp.role === 'transfer') {
            const station = (wp as any).station as string | undefined;
            const toLine = (wp as any).toLine as string | undefined;
            const lineName = toLine ? (LINE_NAMES[toLine] ?? toLine) : '';
            return `${base}，在${station ?? ''}換${lineName}`;
        }
        if (wp.role === 'destination') {
            const station = (wp as any).station as string | undefined;
            return `${base}，即將抵達${station ?? '目的地'}`;
        }
    }
    return base;
}

interface NavControllerProps {
    route: Route;
}

export default function NavController({ route }: NavControllerProps) {
    const nav = useNavigation(route);
    const { currentStationCode, gps } = useLocationCtx();

    const [manualMrt, setManualMrt] = useState<boolean | null>(null);
    useEffect(() => setManualMrt(null), [nav.activePositioning]);
    const showMrt = manualMrt !== null ? manualMrt : nav.activePositioning === 'beacon';

    // 擷取捷運路線站碼與轉乘資訊
    const metroRouteStations = useMemo<MrtStationData[]>(() => {
        const seen = new Set<string>();
        const result: MrtStationData[] = [];
        for (const wp of route.waypoints) {
            if (wp.mode === 'metro') {
                const code = (wp as any).stationCode as string | undefined;
                if (code && !seen.has(code)) {
                    seen.add(code);
                    const stationData: MrtStationData = { code };
                    // 提取轉乘資訊
                    if (wp.role === 'transfer') {
                        const toLine = (wp as any).toLine as string | undefined;
                        if (toLine) {
                            stationData.transferToLine = toLine;
                            stationData.transferLineName = LINE_NAMES[toLine] ?? toLine;
                        }
                    }
                    result.push(stationData);
                }
            }
        }
        return result;
    }, [route]);

    const activeMetroIndex = currentStationCode
        ? metroRouteStations.findIndex(s => s.code === currentStationCode)
        : -1;

    const nextActionText = useMemo(
        () => computeNextAction(route, nav.currentIndex, nav.activeMode, nav.isComplete),
        [route, nav.currentIndex, nav.activeMode, nav.isComplete],
    );

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* 實體地圖層 */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${showMrt ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <NavigationMap route={route} />
            </div>

            {/* 捷運圖層 */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${showMrt ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <MrtMap
                    hideHeader
                    stationsData={metroRouteStations}
                    activeRouteIndex={activeMetroIndex}
                />
            </div>

            {/* 地圖切換按鈕（右上角） */}
            <div className="absolute top-4 right-4 z-[1000] flex bg-white rounded-full shadow-lg p-1 gap-1">
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

            {/* 阻擋式確認視窗（Modal） */}
            {nav.pendingPrompt && !nav.isComplete && (
                <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100 opacity-100">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-4xl bg-blue-50 w-12 h-12 flex items-center justify-center rounded-full">
                                {nav.pendingPrompt.isMrtEntry ? '🚇' : '📍'}
                            </span>
                            <h3 className="text-xl font-black text-gray-800">
                                {nav.pendingPrompt.isMrtEntry ? '準備進入捷運站' : '抵達節點'}
                            </h3>
                        </div>
                        <p className="text-gray-600 mb-8 font-medium leading-relaxed">
                            {nav.pendingPrompt.text}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={nav.cancelPrompt}
                                className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                稍後再說
                            </button>
                            <button
                                onClick={nav.confirmAdvance}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
                            >
                                確認繼續
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 抵達提示 */}
            {nav.isComplete && (
                <div className="absolute top-16 left-4 right-4 z-[1000] bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-bold text-center">
                    🎉 已抵達目的地！
                </div>
            )}

            {/* 底部狀態列 */}
            <div className="absolute bottom-14 left-4 right-4 z-[1000] bg-white/95 backdrop-blur rounded-xl shadow-lg px-4 py-3">
                <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">{MODE_EMOJI[nav.activeMode]}</span>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-800 leading-snug">
                            {nextActionText}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                            <span>{nav.activePositioning === 'gps' ? '📡 GPS' : '🔵 Beacon'}</span>
                            <span>{nav.currentIndex} / {route.waypoints.length}</span>
                            {import.meta.env.DEV && (
                                <span className={gps ? 'text-green-500' : 'text-red-400'}>
                                    {gps ? `${gps.lat.toFixed(4)},${gps.lng.toFixed(4)}` : '無GPS'}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* 開發用手動推進 */}
                    {import.meta.env.DEV && (
                        <button
                            onClick={nav.advance}
                            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1.5 rounded-lg text-gray-600 shrink-0"
                        >
                            ▶
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}