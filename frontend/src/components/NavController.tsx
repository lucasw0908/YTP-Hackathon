import { useEffect, useMemo, useState } from 'react';
import { Map, Train, Play, Target, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import NavigationMap from './NavigationMap';
import MrtMap, { type RouteStationEntry } from './MrtMap';
import IconMapper from './IconMapper';
import { useNavigation, type NavPrompt } from '../hooks/useNavigation';
import { useLocation as useLocationCtx } from '../contexts/LocationContext';
import type { Route, TransportMode, Waypoint } from '../types/wayPoint';
import stationsRaw from '../assets/stations.json';

import MissionView from './MissionView';
import type { Task } from '../api/tasksApi';
import { markMissionComplete } from '../api/tasksApi';
import { getDepartureTimes, getStationNameById, type DepartureInfo } from '../api/metroApi';

interface NavControllerProps {
    route: Route;
    task?: Task;
}

type StationRecord = { id: string; name: string; x: number; y: number };
const stationsData = stationsRaw as StationRecord[];

const LINE_NAMES: Record<string, string> = {
    BL: '板南線', BR: '文湖線', G: '松山新店線',
    O: '中和新蘆線', R: '淡水信義線', Y: '環狀線',
};

const MODE_EMOJI: Record<TransportMode, string> = {
    walk: '🚶', bike: '🚲', metro: '🚇',
};

const PROMPT_UI: Record<NavPrompt['promptType'], { emoji: string; title: string }> = {
    mrt_entry: { emoji: '🚇', title: '準備進入捷運站' },
    mrt_exit: { emoji: '🚉', title: '準備離開捷運站' },
    transfer: { emoji: '🔄', title: '抵達轉乘站' },
    transition: { emoji: '🔀', title: '需要切換交通方式' },
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
    if (isComplete) return '已抵達目的地';
    const { waypoints } = route;
    const currentWp = waypoints[currentIndex] ?? null;
    const base = activityDesc(mode, currentWp);

    if (currentWp && (currentWp.role === 'transition' || currentWp.role === 'transfer' || currentWp.role === 'destination')) {
        return (currentWp as any).instruction ?? base;
    }

    for (let i = currentIndex + 1; i < waypoints.length; i++) {
        const wp = waypoints[i];
        if (wp.role === 'waypoint') continue;
        if (wp.role === 'transition') {
            const station = (wp as any).station as string | undefined;
            if (wp.mode === 'metro') return `${base}，前往${station ?? ''}站入站`;
            if ((wp as any).stationCode) return `${base}，即將出站步行`;
            return `${base}，即將切換交通方式`;
        }
        if (wp.role === 'transfer') {
            const station = (wp as any).station as string | undefined;
            const toLine = (wp as any).toLine as string | undefined;
            return `${base}，在${station ?? ''}換${toLine ? (LINE_NAMES[toLine] ?? toLine) : '線'}`;
        }
        if (wp.role === 'destination') {
            const station = (wp as any).station as string | undefined;
            return `${base}，即將抵達${station ?? '目的地'}`;
        }
    }
    return base;
}


export default function NavController({ route, task }: NavControllerProps) {
    const nav = useNavigation(route);
    const { currentStationCode, gps } = useLocationCtx();

    const [activeTab, setActiveTab] = useState<'map' | 'mrt' | 'mission'>(() =>
        nav.activePositioning === 'beacon' ? 'mrt' : 'map'
    );

    useEffect(() => {
        console.log("dd", gps)
    }, [gps])

    useEffect(() => {
        if (!nav.pendingInstruction) return;
        const t = setTimeout(nav.clearInstruction, 4000);
        return () => clearTimeout(t);
    }, [nav.pendingInstruction]);

    useEffect(() => {
        if (nav.isComplete && task?.task_id) {
            markMissionComplete(task.task_id);
        }
    }, [nav.isComplete, task?.task_id]);

    const [trainPanelOpen, setTrainPanelOpen] = useState(false);
    const [departures, setDepartures] = useState<DepartureInfo[]>([]);
    const [loadingDepartures, setLoadingDepartures] = useState(false);

    const fetchDepartures = () => {
        if (!currentStationCode) return;
        const stationName = getStationNameById(currentStationCode);
        if (!stationName) return;
        setLoadingDepartures(true);
        getDepartureTimes(stationName).then(data => {
            setDepartures(data);
            setLoadingDepartures(false);
        });
    };

    useEffect(() => {
        if (nav.activeMode !== 'metro') {
            setDepartures([]);
            setTrainPanelOpen(false);
            return;
        }
        fetchDepartures();
    }, [currentStationCode, nav.activeMode]);

    function handleConfirm() {
        const type = nav.pendingPrompt?.promptType;
        if (type === 'mrt_entry') setActiveTab('mrt');
        else if (type === 'mrt_exit') setActiveTab('map');
        nav.confirmAdvance();
    }

    // 依站名去重（同物理站不同線別 code 只保留第一次出現）
    // 同時納入有 stationCode 的 transition（捷運出口站）
    const metroRouteStations = useMemo<RouteStationEntry[]>(() => {
        const seenNames = new Set<string>();
        const result: RouteStationEntry[] = [];
        for (const wp of route.waypoints) {
            const isMetroSeg = wp.mode === 'metro';
            const isMetroExit = wp.role === 'transition' && !!(wp as any).stationCode;
            if (!isMetroSeg && !isMetroExit) continue;
            const code = (wp as any).stationCode as string | undefined;
            const name = (wp as any).station as string | undefined;
            const key = name ?? code;
            if (!key || seenNames.has(key)) continue;
            seenNames.add(key);
            if (code) result.push({ code, name });
        }
        return result;
    }, [route]);

    // 即時 beacon 比對（有訊號時最準確）
    const activeMetroIndex = useMemo(() => {
        if (!currentStationCode) return -1;
        const directIdx = metroRouteStations.findIndex(s => s.code === currentStationCode);
        if (directIdx !== -1) return directIdx;
        const stationName = stationsData.find(s => s.id === currentStationCode)?.name;
        if (!stationName) return -1;
        return metroRouteStations.findIndex(s => s.name === stationName);
    }, [currentStationCode, metroRouteStations]);

    // 根據導航進度推算已過站數（beacon 無訊號時的 fallback，取兩者較大值）
    const activeMetroIndexFromNav = useMemo(() => {
        let passed = 0;
        for (let i = 0; i < metroRouteStations.length; i++) {
            const wpIdx = route.waypoints.findIndex(
                wp => (wp as any).stationCode === metroRouteStations[i].code
            );
            if (wpIdx !== -1 && wpIdx < nav.currentIndex) passed = i + 1;
        }
        return passed;
    }, [metroRouteStations, route.waypoints, nav.currentIndex]);

    const effectiveActiveMetroIndex = Math.max(activeMetroIndex, activeMetroIndexFromNav);

    const nextActionText = useMemo(
        () => computeNextAction(route, nav.currentIndex, nav.activeMode, nav.isComplete),
        [route, nav.currentIndex, nav.activeMode, nav.isComplete],
    );

    const promptUI = nav.pendingPrompt ? PROMPT_UI[nav.pendingPrompt.promptType] : null;

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* Leaflet 地圖層 */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'map' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <NavigationMap route={route} currentIndex={nav.currentIndex} />
            </div>

            {/* 捷運圖層 */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'mrt' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <MrtMap
                    hideHeader
                    routeStations={metroRouteStations}
                    activeRouteIndex={effectiveActiveMetroIndex}
                />
            </div>

            {/* 任務圖層 */}
            {task && (
                <div className={`absolute inset-0 transition-opacity duration-300 z-50 ${activeTab === 'mission' ? 'opacity-100 bg-white' : 'opacity-0 pointer-events-none'}`}>
                    {activeTab === 'mission' && <MissionView task={task} />}
                </div>
            )}

            {/* 地圖切換按鈕 */}
            <div className="absolute top-15 right-4 z-[1000] flex bg-white rounded-full shadow-lg p-1 gap-1">
                <button
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeTab === 'map' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    onClick={() => setActiveTab('map')}
                >
                    <Map size={13} /> 地圖
                </button>
                <button
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeTab === 'mrt' ? 'bg-purple-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    onClick={() => setActiveTab('mrt')}
                >
                    <Train size={13} /> 捷運
                </button>
                {task && (
                    <button
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeTab === 'mission' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('mission')}
                    >
                        <Target size={13} /> 任務
                    </button>
                )}
            </div>

            {/* 一般節點指示橫幅（4 秒自動消失） */}
            {nav.isComplete || (nav.pendingInstruction && !nav.pendingPrompt) && (
                <div className="absolute top-16 left-4 right-4 z-1000 bg-amber-50 border border-amber-300 px-4 py-3 rounded-xl shadow-lg text-sm font-bold text-amber-800 animate-pulse">
                    {nav.isComplete ? "到達目的地！" : nav.pendingInstruction}
                </div>
            )}

            {/* 重大節點確認 Modal */}
            {nav.pendingPrompt && !nav.isComplete && (
                <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-4xl bg-blue-50 w-12 h-12 flex items-center justify-center rounded-full shrink-0">
                                <IconMapper emoji={promptUI?.emoji ?? '📍'} size={32} className="text-blue-600" />
                            </span>
                            <h3 className="text-xl font-black text-gray-800">
                                {promptUI?.title ?? '確認節點'}
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
                                onClick={handleConfirm}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
                            >
                                確認繼續
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* 底部區塊（列車動態 + 狀態列） */}
            <div className="absolute bottom-4 left-4 right-4 z-1000 flex flex-col gap-2">

                {/* 列車動態面板：僅在捷運模式下顯示 */}
                {nav.activeMode === 'metro' && (
                    <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg overflow-hidden">
                        <button
                            onClick={() => setTrainPanelOpen(p => !p)}
                            className="w-full flex items-center justify-between px-4 py-2.5"
                        >
                            <span className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                <Train size={13} className="text-blue-500" />
                                {currentStationCode
                                    ? (getStationNameById(currentStationCode) ?? '列車動態')
                                    : '列車動態'}
                            </span>
                            <span className="flex items-center gap-2">
                                {loadingDepartures && (
                                    <RefreshCw size={11} className="text-gray-400 animate-spin" />
                                )}
                                {trainPanelOpen
                                    ? <ChevronDown size={14} className="text-gray-400" />
                                    : <ChevronUp size={14} className="text-gray-400" />}
                            </span>
                        </button>
                        {trainPanelOpen && (
                            <div className="border-t border-gray-100 px-4 py-2 max-h-40 overflow-y-auto">
                                {departures.length === 0 && !loadingDepartures && (
                                    <p className="text-[11px] text-gray-400 text-center py-2">目前無列車資訊</p>
                                )}
                                {departures.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between py-1 text-xs border-b border-gray-50 last:border-0">
                                        <span className="text-gray-600 truncate">{d.depart} → {d.destination}</span>
                                        <span className="font-bold text-blue-600 shrink-0 ml-3">{d.time}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 狀態列 */}
                <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                        <IconMapper emoji={MODE_EMOJI[nav.activeMode]} size={24} className="shrink-0 text-blue-500" />
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-800 leading-snug truncate">
                                {nextActionText}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                    <IconMapper emoji={nav.activePositioning === 'gps' ? '📡' : '🔵'} size={10} />
                                    {nav.activePositioning === 'gps' ? 'GPS' : 'Beacon'}
                                </span>
                                <span>{nav.currentIndex} / {route.waypoints.length}</span>
                                {import.meta.env.DEV && (
                                    <span className={gps ? 'text-green-500' : 'text-red-400'}>
                                        {gps ? `${gps.lat.toFixed(4)},${gps.lng.toFixed(4)}` : '無GPS'}
                                    </span>
                                )}
                            </div>
                        </div>
                        {import.meta.env.DEV && (
                            <button
                                onClick={nav.advance}
                                className="text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded-lg text-gray-600 shrink-0"
                            >
                                <Play size={12} fill="currentColor" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
