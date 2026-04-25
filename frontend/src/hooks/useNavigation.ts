import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from '../contexts/LocationContext';
import type { Route, Waypoint, TransportMode, PositioningMode } from '../types/wayPoint';

const GPS_ARRIVAL_RADIUS_M = 30;

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

export interface NavStatus {
    currentIndex: number;
    targetWaypoint: Waypoint | null;
    activeMode: TransportMode;
    activePositioning: PositioningMode;
    pendingInstruction: string | null;
    isComplete: boolean;
    clearInstruction: () => void;
    /** 手動推進（測試用）*/
    advance: () => void;
}

export function useNavigation(route: Route | null): NavStatus {
    const { gps, currentStationCode } = useLocation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [pendingInstruction, setPendingInstruction] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const triggeredRef = useRef(new Set<number>());

    const waypoints = route?.waypoints ?? [];
    const targetWaypoint = isComplete ? null : (waypoints[currentIndex] ?? null);

    // route 切換時重置
    useEffect(() => {
        setCurrentIndex(0);
        setPendingInstruction(null);
        setIsComplete(false);
        triggeredRef.current.clear();
    }, [route?.id]);

    const doAdvance = useCallback((index: number, wps: Waypoint[]) => {
        if (triggeredRef.current.has(index)) return;
        triggeredRef.current.add(index);
        const wp = wps[index];
        if (!wp) return;
        if (wp.instruction) setPendingInstruction(wp.instruction);
        if (wp.role === 'destination') {
            setIsComplete(true);
        } else {
            setCurrentIndex(index + 1);
        }
    }, []);

    useEffect(() => {
        alert("!!")
    }, [gps])

    // GPS 距離檢測
    useEffect(() => {
        console.log(gps, targetWaypoint)
        if (!gps || !targetWaypoint || isComplete) return;
        if (targetWaypoint.positioning !== 'gps') return;

        const [lng, lat] = targetWaypoint.coord;
        const dist = haversineDistance(gps.lat, gps.lng, lat, lng);
        console.log("999", targetWaypoint.coord, dist, GPS_ARRIVAL_RADIUS_M)
        if (dist < GPS_ARRIVAL_RADIUS_M) {
            doAdvance(currentIndex, waypoints);
        }
    }, [gps, targetWaypoint, isComplete, currentIndex, doAdvance, waypoints]);

    // Beacon 站碼比對
    useEffect(() => {
        if (!currentStationCode || !targetWaypoint || isComplete) return;
        if (targetWaypoint.positioning !== 'beacon') return;
        const wp = targetWaypoint as { stationCode?: string };
        if (wp.stationCode && wp.stationCode === currentStationCode) {
            doAdvance(currentIndex, waypoints);
        }
    }, [currentStationCode, targetWaypoint, isComplete, currentIndex, doAdvance, waypoints]);

    return {
        currentIndex,
        targetWaypoint,
        activeMode: targetWaypoint?.mode ?? 'walk',
        activePositioning: targetWaypoint?.positioning ?? 'gps',
        pendingInstruction,
        isComplete,
        clearInstruction: () => setPendingInstruction(null),
        advance: () => doAdvance(currentIndex, waypoints),
    };
}
