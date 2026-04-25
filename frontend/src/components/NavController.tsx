import React, { useEffect, useMemo, useState } from 'react';
import { Map, Train } from 'lucide-react';
import NavigationMap from './NavigationMap';
import MrtMap from './MrtMap';
import { useNavigation } from '../hooks/useNavigation';
import { useLocation as useLocationCtx } from '../contexts/LocationContext';
import type { Route, TransportMode, Waypoint } from '../types/wayPoint';

// ─── 線路中文名 ──────────────────────────────────────────────
const LINE_NAMES: Record<string, string> = {
    BL: '板南線', BR: '文湖線', G: '松山新店線',
    O: '中和新蘆線', R: '淡水信義線', Y: '環狀線',
};

const MODE_EMOJI: Record<TransportMode, string> = {
    walk: '🚶', bike: '🚲', metro: '🚇',
};

// ─── 目前活動描述 ────────────────────────────────────────────
function activityDesc(mode: TransportMode, wp?: Waypoint | null): string {
    if (mode === 'walk') return '沿綠色路徑步行';
    if (mode === 'bike') return '沿橘色路徑騎車';
    if (mode === 'metro') {
        const line = (wp as any)?.line as string | undefined;
        return `搭乘${line ? (LINE_NAMES[line] ?? line) : '捷運'}`;
    }
    return '前進中';
}

// ─── 下一步行動文字（前瞻整條路線） ──────────────────────────
function computeNextAction(route: Route, currentIndex: number, mode: TransportMode, isComplete: boolean): string {
    if (isComplete) return '已抵達目的地 ✅';
    const { waypoints } = route;
    const currentWp = waypoints[currentIndex] ?? null;
    const base = activityDesc(mode, currentWp);

    // 如果目前目標本身就是重要節點，直接顯示其 instruction
    if (
        currentWp &&
        (currentWp.role === 'transition' || currentWp.role === 'transfer' || currentWp.role === 'destination')
    ) {
        return (currentWp as any).instruction ?? base;
    }

    // 往前找下一個重要節點
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

    // 自動切換地圖：null = 跟 positioning 走，true/false = 手動覆蓋
    const [manualMrt, setManualMrt] = useState<boolean | null>(null);
    useEffect(() => setManualMrt(null), [nav.activePositioning]);
    const showMrt = manualMrt !== null ? manualMrt : nav.activePositioning === 'beacon';

    // 指引 4 秒後自動消失
    useEffect(() => {
        if (!nav.pendingInstruction) return;
        const t = setTimeout(nav.clearInstruction, 4000);
        return () => clearTimeout(t);
    }, [nav.pendingInstruction]);

    // 捷運路線站碼（去重，保持順序）
    const metroRouteStations = useMemo(() => {
        const seen = new Set<string>();
        const result: string[] = [];
        for (const wp of route.waypoints) {
            if (wp.mode === 'metro') {
                const code = (wp as any).stationCode as string | undefined;
                if (code && !seen.has(code)) { seen.add(code); result.push(code); }
            }
        }
        return result;
    }, [route]);

    const activeMetroIndex = currentStationCode
        ? metroRouteStations.indexOf(currentStationCode)
        : -1;

    // 下一步行動文字
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
                    routeStationCodes={metroRouteStations}
                    activeRouteIndex={activeMetroIndex}
                />
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

            {/* 使用者指引橫幅（4 秒自動消失，無需按鍵） */}
            {nav.pendingInstruction && !nav.isComplete && (
                <div className="absolute top-16 left-4 right-4 z-1000 bg-amber-50 border border-amber-300 px-4 py-3 rounded-xl shadow-lg text-sm font-bold text-amber-800 animate-pulse">
                    {nav.pendingInstruction}
                </div>
            )}

            {/* 抵達提示 */}
            {nav.isComplete && (
                <div className="absolute top-16 left-4 right-4 z-1000 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-bold text-center">
                    🎉 已抵達目的地！
                </div>
            )}

            {/* 底部狀態列 */}
            <div className="absolute bottom-4 left-4 right-4 z-1000 bg-white/95 backdrop-blur rounded-xl shadow-lg px-4 py-3">
                <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">{MODE_EMOJI[nav.activeMode]}</span>
                    <div className="flex-1 min-w-0">
                        {/* 下一步行動（主要資訊） */}
                        <div className="text-xs font-bold text-gray-800 leading-snug">
                            {nextActionText}
                        </div>
                        {/* 定位方式 + 進度 */}
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
