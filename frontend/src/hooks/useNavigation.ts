import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from '../contexts/LocationContext';
import type { Route, Waypoint, TransportMode, PositioningMode } from '../types/wayPoint';

const GPS_ARRIVAL_RADIUS_M = 100;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface NavPrompt {
    targetIndex: number;
    text: string;
    /** 控制 Modal 的圖示與標題 */
    promptType: 'mrt_entry' | 'mrt_exit' | 'transfer' | 'transition';
}

export interface NavStatus {
    currentIndex: number;
    targetWaypoint: Waypoint | null;
    activeMode: TransportMode;
    activePositioning: PositioningMode;
    pendingPrompt: NavPrompt | null;
    pendingInstruction: string | null;
    isComplete: boolean;
    clearInstruction: () => void;
    confirmAdvance: () => void;
    cancelPrompt: () => void;
    advance: () => void;
}

export function useNavigation(route: Route | null): NavStatus {
    const { gps, currentStationCode } = useLocation();

    const [currentIndex, setCurrentIndex] = useState(() => {
        if (!route) return 0;
        const saved = localStorage.getItem(`nav_progress_${route.id}`);
        return saved ? parseInt(saved, 10) : 0;
    });

    const [pendingPrompt, setPendingPrompt] = useState<NavPrompt | null>(null);
    const [pendingInstruction, setPendingInstruction] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);

    const triggeredRef = useRef<Set<number>>(new Set(
        Array.from({ length: currentIndex }, (_, i) => i)
    ));

    const waypoints = route?.waypoints ?? [];
    const targetWaypoint = isComplete ? null : (waypoints[currentIndex] ?? null);

    // 路線切換時重置狀態
    useEffect(() => {
        if (!route) return;
        const saved = localStorage.getItem(`nav_progress_${route.id}`);
        const initialIdx = saved ? parseInt(saved, 10) : 0;
        setCurrentIndex(initialIdx);
        setPendingPrompt(null);
        setPendingInstruction(null);
        setIsComplete(false);
        triggeredRef.current = new Set(Array.from({ length: initialIdx }, (_, i) => i));
    }, [route?.id]);

    // 儲存進度到 LocalStorage
    useEffect(() => {
        if (route && !isComplete) {
            localStorage.setItem(`nav_progress_${route.id}`, currentIndex.toString());
        }
    }, [currentIndex, route?.id, isComplete]);

    const handleArrival = useCallback((index: number, wps: Waypoint[]) => {
        if (triggeredRef.current.has(index)) return;

        const wp = wps[index];
        if (!wp) return;

        triggeredRef.current.add(index);

        // 進站：transition 且 mode=metro
        const isMrtEntry = wp.role === 'transition' && wp.mode === 'metro';
        // 出站：transition 且有 stationCode（YouBike 切換點沒有 stationCode）
        const isMrtExit = wp.role === 'transition' && wp.mode !== 'metro' && !!(wp as any).stationCode;
        const isTransfer = wp.role === 'transfer';

        // 所有 transition / transfer 都詢問使用者確認
        const needsConfirmation = wp.role === 'transition' || wp.role === 'transfer';

        if (needsConfirmation) {
            const promptType: NavPrompt['promptType'] =
                isMrtEntry ? 'mrt_entry' :
                isMrtExit  ? 'mrt_exit'  :
                isTransfer ? 'transfer'  : 'transition';

            const text = (wp as any).instruction || (
                isMrtEntry ? '即將進入捷運站，請確認入站並切換至捷運圖' :
                isMrtExit  ? '即將離開捷運站，請確認出站並切換回地圖' :
                isTransfer ? '抵達轉乘站，請確認轉乘路線後繼續' :
                '請確認您已到達此位置，然後繼續前進'
            );
            setPendingPrompt({ targetIndex: index, text, promptType });
        } else {
            // 普通 waypoint 或 destination：自動推進
            if ((wp as any).instruction) {
                setPendingInstruction((wp as any).instruction);
            }
            if (wp.role === 'destination') {
                setIsComplete(true);
                localStorage.removeItem(`nav_progress_${route?.id}`);
            } else {
                setCurrentIndex(index + 1);
            }
        }
    }, [route?.id]);

    const confirmAdvance = useCallback(() => {
        if (!pendingPrompt) return;
        setCurrentIndex(pendingPrompt.targetIndex + 1);
        setPendingPrompt(null);
    }, [pendingPrompt]);

    const cancelPrompt = useCallback(() => {
        if (!pendingPrompt) return;
        triggeredRef.current.delete(pendingPrompt.targetIndex);
        setPendingPrompt(null);
    }, [pendingPrompt]);

    // GPS 距離檢測
    useEffect(() => {
        if (!gps || !targetWaypoint || isComplete || pendingPrompt) return;
        if (targetWaypoint.positioning !== 'gps') return;
        const [lng, lat] = targetWaypoint.coord;
        const dist = haversineDistance(gps.lat, gps.lng, lat, lng);
        if (dist < GPS_ARRIVAL_RADIUS_M) {
            handleArrival(currentIndex, waypoints);
        }
    }, [gps, targetWaypoint, isComplete, currentIndex, handleArrival, waypoints, pendingPrompt]);

    // Beacon 站碼比對
    useEffect(() => {
        if (!currentStationCode || !targetWaypoint || isComplete || pendingPrompt) return;
        if (targetWaypoint.positioning !== 'beacon') return;
        const wp = targetWaypoint as { stationCode?: string };
        if (wp.stationCode && wp.stationCode === currentStationCode) {
            handleArrival(currentIndex, waypoints);
        }
    }, [currentStationCode, targetWaypoint, isComplete, currentIndex, handleArrival, waypoints, pendingPrompt]);

    return {
        currentIndex,
        targetWaypoint,
        activeMode: targetWaypoint?.mode ?? 'walk',
        activePositioning: targetWaypoint?.positioning ?? 'gps',
        pendingPrompt,
        pendingInstruction,
        isComplete,
        clearInstruction: () => setPendingInstruction(null),
        confirmAdvance,
        cancelPrompt,
        advance: () => handleArrival(currentIndex, waypoints),
    };
}
