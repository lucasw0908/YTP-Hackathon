import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from '../contexts/LocationContext';
import type { Route, Waypoint, TransportMode, PositioningMode } from '../types/wayPoint';

const GPS_ARRIVAL_RADIUS_M = 400;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 彈出確認視窗的狀態型別
export interface NavPrompt {
    targetIndex: number;
    text: string;
    isMrtEntry: boolean;
}

export interface NavStatus {
    currentIndex: number;
    targetWaypoint: Waypoint | null;
    activeMode: TransportMode;
    activePositioning: PositioningMode;
    pendingPrompt: NavPrompt | null;
    isComplete: boolean;
    confirmAdvance: () => void;
    cancelPrompt: () => void;
    advance: () => void;
}

export function useNavigation(route: Route | null): NavStatus {
    const { gps, currentStationCode } = useLocation();

    // 1. 初始化時從 LocalStorage 讀取進度
    const [currentIndex, setCurrentIndex] = useState(() => {
        if (!route) return 0;
        const saved = localStorage.getItem(`nav_progress_${route.id}`);
        return saved ? parseInt(saved, 10) : 0;
    });

    const [pendingPrompt, setPendingPrompt] = useState<NavPrompt | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    
    // 初始化防抖 Ref，確保當前 index 之前的點都被視為已觸發
    const triggeredRef = useRef<Set<number>>(new Set(
        Array.from({ length: currentIndex }, (_, i) => i)
    ));

    const waypoints = route?.waypoints ?? [];
    const targetWaypoint = isComplete ? null : (waypoints[currentIndex] ?? null);

    // 當 route id 改變時（例如換了一條路線），重新讀取或重置
    useEffect(() => {
        if (!route) return;
        const saved = localStorage.getItem(`nav_progress_${route.id}`);
        const initialIdx = saved ? parseInt(saved, 10) : 0;
        setCurrentIndex(initialIdx);
        setPendingPrompt(null);
        setIsComplete(false);
        triggeredRef.current = new Set(Array.from({ length: initialIdx }, (_, i) => i));
    }, [route?.id]);

    // 儲存進度到 LocalStorage
    useEffect(() => {
        if (route && !isComplete) {
            localStorage.setItem(`nav_progress_${route.id}`, currentIndex.toString());
        }
    }, [currentIndex, route?.id, isComplete]);

    // 處理抵達事件（觸發詢問視窗，不直接跳轉）
    const handleArrival = useCallback((index: number, wps: Waypoint[]) => {
        if (triggeredRef.current.has(index)) return;
        
        const wp = wps[index];
        if (!wp) return;

        // 判斷是否為進入捷運站的關鍵節點
        const isMrtEntry = wp.role === 'transition' && wp.mode === 'metro';
        const text = wp.instruction || (isMrtEntry ? '即將進入捷運站，是否確認入站並切換至捷運圖？' : '請確認已抵達此節點並繼續前進');

        // 鎖定該節點避免重複觸發，並開啟彈窗
        triggeredRef.current.add(index);
        setPendingPrompt({ targetIndex: index, text, isMrtEntry });
    }, []);

    // 使用者點擊「確認」
    const confirmAdvance = useCallback(() => {
        if (!pendingPrompt) return;
        const index = pendingPrompt.targetIndex;
        const wp = waypoints[index];
        
        if (wp?.role === 'destination') {
            setIsComplete(true);
            localStorage.removeItem(`nav_progress_${route?.id}`); // 完成後清空進度
        } else {
            setCurrentIndex(index + 1);
        }
        setPendingPrompt(null);
    }, [pendingPrompt, waypoints, route?.id]);

    // 使用者點擊「取消/稍後再說」
    const cancelPrompt = useCallback(() => {
        if (!pendingPrompt) return;
        // 退回未觸發狀態，讓 GPS/Beacon 稍後可以再次觸發
        triggeredRef.current.delete(pendingPrompt.targetIndex);
        setPendingPrompt(null);
    }, [pendingPrompt]);

    // GPS 距離檢測
    useEffect(() => {
        if (!gps || !targetWaypoint || isComplete || pendingPrompt) return; // 有彈窗時暫停判定
        if (targetWaypoint.positioning !== 'gps') return;

        const [lng, lat] = targetWaypoint.coord;
        const dist = haversineDistance(gps.lat, gps.lng, lat, lng);
        if (dist < GPS_ARRIVAL_RADIUS_M) {
            handleArrival(currentIndex, waypoints);
        }
    }, [gps, targetWaypoint, isComplete, currentIndex, handleArrival, waypoints, pendingPrompt]);

    // Beacon 站碼比對
    useEffect(() => {
        if (!currentStationCode || !targetWaypoint || isComplete || pendingPrompt) return; // 有彈窗時暫停判定
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
        isComplete,
        confirmAdvance,
        cancelPrompt,
        advance: () => handleArrival(currentIndex, waypoints),
    };
}