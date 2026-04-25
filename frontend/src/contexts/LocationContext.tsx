// src/contexts/LocationContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { useAppBridge, type WebBeacon } from '../hooks/useAppBridge';

interface LocationState {
    beacons: WebBeacon[];
    currentStationCode: string | null; // 當前最強訊號的捷運站代碼 (例如 "BL01")
    gps: { lat: number; lng: number } | null; // 預留給未來的 GPS
}

const LocationContext = createContext<LocationState | undefined>(undefined);

const GPS_STORAGE_KEY = 'lastKnownGps';

function readStoredGps(): { lat: number; lng: number } | null {
    try {
        const raw = sessionStorage.getItem(GPS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function LocationProvider({ children }: { children: ReactNode }) {
    const [beacons, setBeacons] = useState<WebBeacon[]>([]);
    // 初始值從 sessionStorage 還原，避免 WebView reload 後瞬間變 null
    const [gps, setGps] = useState<{ lat: number; lng: number } | null>(readStoredGps);

    // 接收來自 App 的所有訊息
    const handleAppMessage = useCallback((type: string, payload: any) => {
        if (type === 'BEACON_UPDATE') {
            setBeacons(payload);
        }
        if (type === 'GPS_UPDATE') {
            setGps({...payload});
            console.log("?????")
            // 同步寫入 sessionStorage，重載後可立即還原
            try { sessionStorage.setItem(GPS_STORAGE_KEY, JSON.stringify(payload)); } catch {}
        }
    }, []);

    useAppBridge(handleAppMessage);

    // 🧠 核心邏輯：從多個 Beacon 中找出「距離最近（信號最強）」的捷運站
    const currentStationCode = useMemo(() => {
        if (beacons.length === 0) return "BR08";
        if (beacons.length === 0) return null;

        // 將 Beacon 依照 RSSI (信號強度) 由大到小排序 (RSSI 是負數，越大代表越近，如 -40 > -80)
        const sortedBeacons = [...beacons].sort((a, b) => b.rssi - a.rssi);

        // 取出最近且有對應到捷運站的 Beacon
        const closestStation = sortedBeacons.find(b => b.stationCode);
        return closestStation ? closestStation.stationCode : null;

    }, [beacons]);

    return (
        <LocationContext.Provider value={{ beacons, currentStationCode: (currentStationCode ? currentStationCode : null), gps }}>
            {children}
        </LocationContext.Provider>
    );
}

// 提供一個自訂 Hook 讓其他組件方便取用
export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};