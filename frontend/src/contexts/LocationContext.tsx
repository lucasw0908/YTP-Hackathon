// src/contexts/LocationContext.tsx
import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { useAppBridge, type WebBeacon } from '../hooks/useAppBridge';

interface LocationState {
    beacons: WebBeacon[];
    currentStationCode: string | null;
    gps: { lat: number; lng: number } | null;
    isSimulationMode: boolean;
    setSimulationMode: (enabled: boolean) => void;
    setSimulatedGps: (pos: { lat: number; lng: number } | null) => void;
    setSimulatedStation: (code: string | null) => void;
}

const LocationContext = createContext<LocationState | undefined>(undefined);

const GPS_KEY = 'lastKnownGps';
const SIM_MODE_KEY = 'sim_mode';
const SIM_GPS_KEY = 'sim_gps';
const SIM_STATION_KEY = 'sim_station';

function readStoredGps(): { lat: number; lng: number } | null {
    try {
        const raw = sessionStorage.getItem(GPS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function lsGet<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function lsSet(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function lsDel(key: string) {
    try { localStorage.removeItem(key); } catch {}
}

export function LocationProvider({ children }: { children: ReactNode }) {
    const [beacons, setBeacons] = useState<WebBeacon[]>([]);
    const [gps, setGps] = useState<{ lat: number; lng: number } | null>(readStoredGps);

    // Simulation state — initialise from localStorage so it persists across pages/reloads
    const [isSimulationMode, _setSimulationMode] = useState<boolean>(() => lsGet<boolean>(SIM_MODE_KEY) ?? false);
    const [simulatedGps, _setSimulatedGps] = useState<{ lat: number; lng: number } | null>(() => lsGet(SIM_GPS_KEY));
    const [simulatedStation, _setSimulatedStation] = useState<string | null>(() => lsGet(SIM_STATION_KEY));

    const setSimulationMode = useCallback((enabled: boolean) => {
        _setSimulationMode(enabled);
        lsSet(SIM_MODE_KEY, enabled);
    }, []);

    const setSimulatedGps = useCallback((pos: { lat: number; lng: number } | null) => {
        _setSimulatedGps(pos);
        pos ? lsSet(SIM_GPS_KEY, pos) : lsDel(SIM_GPS_KEY);
    }, []);

    const setSimulatedStation = useCallback((code: string | null) => {
        _setSimulatedStation(code);
        code ? lsSet(SIM_STATION_KEY, code) : lsDel(SIM_STATION_KEY);
    }, []);

    const handleAppMessage = useCallback((type: string, payload: any) => {
        if (type === 'BEACON_UPDATE') setBeacons(payload);
        if (type === 'GPS_UPDATE') {
            setGps({ ...payload });
            try { sessionStorage.setItem(GPS_KEY, JSON.stringify(payload)); } catch {}
        }
    }, []);

    useAppBridge(handleAppMessage);

    // 監聽其他 tab/頁面對 localStorage 的修改，主動同步模擬狀態
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === SIM_MODE_KEY)
                _setSimulationMode(e.newValue ? JSON.parse(e.newValue) : false);
            if (e.key === SIM_GPS_KEY)
                _setSimulatedGps(e.newValue ? JSON.parse(e.newValue) : null);
            if (e.key === SIM_STATION_KEY)
                _setSimulatedStation(e.newValue ? JSON.parse(e.newValue) : null);
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    const realStationCode = useMemo(() => {
        if (beacons.length === 0) return "BR08";
        const sorted = [...beacons].sort((a, b) => b.rssi - a.rssi);
        const closest = sorted.find(b => b.stationCode);
        return closest ? closest.stationCode : null;
    }, [beacons]);

    const currentStationCode = isSimulationMode ? simulatedStation : (realStationCode ?? null);
    const effectiveGps = isSimulationMode ? simulatedGps : gps;

    return (
        <LocationContext.Provider value={{
            beacons,
            currentStationCode,
            gps: effectiveGps,
            isSimulationMode,
            setSimulationMode,
            setSimulatedGps,
            setSimulatedStation,
        }}>
            {children}
        </LocationContext.Provider>
    );
}

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) throw new Error('useLocation must be used within a LocationProvider');
    return context;
};
