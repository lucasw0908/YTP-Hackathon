import { useEffect, useState } from 'react';
import NavController from '../components/NavController';
import { fetchRoute, getCachedRoute } from '../api/directionsApi';
import { fetchCurrentTask, getCachedTask } from '../api/tasksApi';
import { useLocation as useGPS } from '../contexts/LocationContext';
import type { Route } from '../types/wayPoint';

import IconMapper from '../components/IconMapper';

function NavPage() {
    const { gps } = useGPS();
    const [route, setRoute] = useState<Route | null>(() => getCachedRoute());
    const [task, setTask] = useState<any>(() => getCachedTask());

    useEffect(() => {
        if (route) return;
        fetchCurrentTask().then(t => {
            setTask(t);
            const lat = gps?.lat ?? 25.0478;
            const lng = gps?.lng ?? 121.517;
            return fetchRoute(lat, lng, t.location.lat, t.location.lng);
        }).then(setRoute);
    }, []);

    if (!route) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-100 gap-3">
                <IconMapper emoji="🗺️" size={48} className="animate-pulse text-gray-400" />
                <p className="text-sm text-gray-500">正在規劃路線...</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-full">
            <NavController route={route} task={task} />
        </div>
    );
}

export default NavPage;
