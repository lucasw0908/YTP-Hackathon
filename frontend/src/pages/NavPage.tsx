import { useEffect, useState } from 'react';
import NavController from '../components/NavController';
import { fetchRoute, getCachedRoute } from '../api/directionsApi';
import { fetchCurrentTask } from '../api/tasksApi';
import { useLocation as useGPS } from '../contexts/LocationContext';
import type { Route } from '../types/wayPoint';

function NavPage() {
    const { gps } = useGPS();
    const [route, setRoute] = useState<Route | null>(() => getCachedRoute());

    useEffect(() => {
        if (route) return;
        fetchCurrentTask().then(task => {
            const lat = gps?.lat ?? 25.0478;
            const lng = gps?.lng ?? 121.517;
            return fetchRoute(lat, lng, task.location.lat, task.location.lng);
        }).then(setRoute);
    }, []);

    if (!route) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-100 gap-3">
                <div className="text-4xl animate-pulse">🗺️</div>
                <p className="text-sm text-gray-500">正在規劃路線...</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-full">
            <NavController route={route} />
        </div>
    );
}

export default NavPage;
