// src/contexts/LocationContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { useAppBridge, type WebBeacon } from '../hooks/useAppBridge';
import { SmileIcon } from 'lucide-react';

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
    const [gps, setGps] = useState<{ lat: number; lng: number } | null>(readStoredGps);

    // Simulation state
    const [isSimulationMode, setSimulationMode] = useState(false);
    const [simulatedGps, setSimulatedGps] = useState<{ lat: number; lng: number } | null>(null);
    const [simulatedStation, setSimulatedStation] = useState<string | null>(null);


    const handleAppMessage = useCallback((type: string, payload: any) => {
        if (type === 'BEACON_UPDATE') {
            setBeacons(payload);
        }
        if (type === 'GPS_UPDATE') {
            setGps({ ...payload });
            try { sessionStorage.setItem(GPS_STORAGE_KEY, JSON.stringify(payload)); } catch {}
        }
    }, []);

    useAppBridge(handleAppMessage);

    const realStationCode = useMemo(() => {
        if (beacons.length === 0) return "BR08";
        const sortedBeacons = [...beacons].sort((a, b) => b.rssi - a.rssi);
        const closestStation = sortedBeacons.find(b => b.stationCode);
        return closestStation ? closestStation.stationCode : null;
    }, [beacons]);

    const currentStationCode = isSimulationMode ? simulatedStation : (realStationCode ?? null);
    const effectiveGps = isSimulationMode ? simulatedGps : gps;
    console.log(currentStationCode,effectiveGps,simulatedGps,isSimulationMode)

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
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};
