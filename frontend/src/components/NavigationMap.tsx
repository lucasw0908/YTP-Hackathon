import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLocation } from '../contexts/LocationContext';
import type { Route, TransportMode } from '../types/wayPoint';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MODE_COLORS: Record<TransportMode, string> = {
    walk: '#22c55e',
    bike: '#f97316',
    metro: '#8b5cf6',
};

const userIcon = L.divIcon({
    className: '',
    html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

const ICON_SVG = {
    transition:  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 8 4 4-4 4"/><path d="M2 12h20"/><path d="m6 16-4-4 4-4"/></svg>`,
    transfer:    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 15h20"/><path d="M7 15l3-3 1-1"/><path d="M11 11l1-1 3-3"/><path d="M3 15v-2a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>`, 
    destination: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    check:       `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
};

const makeRoleIcon = (svg: string, color: string, size = 28) =>
    L.divIcon({
        className: '',
        html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;padding:${size * 0.15}px;">${svg}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });

type RoleKey = 'transition' | 'transfer' | 'destination';

const ROLE_ICONS_FUTURE: Record<RoleKey, L.DivIcon> = {
    transition:  makeRoleIcon(ICON_SVG.transition, '#f97316'),
    transfer:    makeRoleIcon(ICON_SVG.transfer, '#8b5cf6'),
    destination: makeRoleIcon(ICON_SVG.destination, '#ef4444'),
};

const ROLE_ICONS_ACTIVE: Record<RoleKey, L.DivIcon> = {
    transition:  makeRoleIcon(ICON_SVG.transition, '#3b82f6', 34),
    transfer:    makeRoleIcon(ICON_SVG.transfer, '#3b82f6', 34),
    destination: makeRoleIcon(ICON_SVG.destination, '#ef4444', 34),
};

const ROLE_ICONS_PAST: Record<RoleKey, L.DivIcon> = {
    transition:  makeRoleIcon(ICON_SVG.check, '#9ca3af', 20),
    transfer:    makeRoleIcon(ICON_SVG.check, '#9ca3af', 20),
    destination: makeRoleIcon(ICON_SVG.check, '#6b7280', 20),
};

function MapAutoCenter({ gps }: { gps: { lat: number; lng: number } | null }) {
    const map = useMap();
    useEffect(() => {
        if (gps) map.flyTo([gps.lat, gps.lng], map.getZoom());
    }, [gps, map]);
    return null;
}

interface Segment {
    mode: TransportMode;
    coords: [number, number][];
    past: boolean;
}

interface NavigationMapProps {
    route: Route;
    currentIndex?: number;
}

export default function NavigationMap({ route, currentIndex = 0 }: NavigationMapProps) {
    const { gps } = useLocation();
    const centerPos: [number, number] = gps ? [gps.lat, gps.lng] : [25.0478, 121.5170];

    // Segments split by mode AND past/future — color stays, only opacity changes
    const segments = useMemo<Segment[]>(() => {
        if (!route.waypoints.length) return [];
        const result: Segment[] = [];
        let cur: Segment | null = null;
        route.waypoints.forEach((wp, idx) => {
            const ll: [number, number] = [wp.coord[1], wp.coord[0]];
            const past = idx < currentIndex;
            if (!cur || cur.mode !== wp.mode || cur.past !== past) {
                cur = { mode: wp.mode, coords: [ll], past };
                result.push(cur);
            } else {
                cur.coords.push(ll);
            }
        });
        return result;
    }, [route, currentIndex]);

    // All key waypoints — static list, currentIndex only affects icon state
    const keyWaypoints = useMemo(() =>
        route.waypoints
            .map((wp, idx) => ({ wp, idx }))
            .filter(({ wp }) => wp.role !== 'waypoint'),
        [route],
    );

    return (
        <div className="w-full h-full relative">
            {!gps && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-1000 bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-sm font-bold shadow">
                    正在獲取 GPS 定位...
                </div>
            )}

            {/* 圖例 */}
            <div className="absolute bottom-20 left-3 z-1000 bg-white/90 rounded-lg shadow px-3 py-2 text-xs space-y-1">
                {(Object.entries(MODE_COLORS) as [TransportMode, string][]).map(([mode, color]) => (
                    <div key={mode} className="flex items-center gap-1.5">
                        <div className="w-4 h-1.5 rounded-full" style={{ background: color }} />
                        <span>{{ walk: '步行', bike: '騎車', metro: '捷運' }[mode]}</span>
                    </div>
                ))}
            </div>

            <MapContainer
                center={centerPos}
                zoom={16}
                style={{ height: '100%', width: '100%', zIndex: 10 }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <MapAutoCenter gps={gps} />

                {/* 完整路線：已過路段保持原色但降低透明度 */}
                {segments.map((seg, i) => (
                    <Polyline
                        key={i}
                        positions={seg.coords}
                        color={MODE_COLORS[seg.mode]}
                        weight={seg.mode === 'metro' ? 5 : 6}
                        opacity={seg.past ? 0.3 : 0.85}
                        dashArray={seg.mode === 'metro' ? '10, 8' : undefined}
                    />
                ))}

                {/* 所有關鍵節點：已過/當前/未來 三種圖示狀態 */}
                {keyWaypoints.map(({ wp, idx }) => {
                    const pos: [number, number] = [wp.coord[1], wp.coord[0]];
                    const roleKey: RoleKey =
                        wp.role === 'destination' ? 'destination' :
                        wp.role === 'transfer'    ? 'transfer'    : 'transition';
                    const isPast   = idx < currentIndex;
                    const isActive = idx === currentIndex;
                    const icon = isPast   ? ROLE_ICONS_PAST[roleKey]
                               : isActive ? ROLE_ICONS_ACTIVE[roleKey]
                               :            ROLE_ICONS_FUTURE[roleKey];
                    return (
                        <Marker key={idx} position={pos} icon={icon}>
                            {(wp as any).instruction && (
                                <Popup>
                                    <span className="text-sm font-medium">{(wp as any).instruction}</span>
                                </Popup>
                            )}
                        </Marker>
                    );
                })}

                {gps && (
                    <Marker position={[gps.lat, gps.lng]} icon={userIcon} zIndexOffset={1000} />
                )}
            </MapContainer>
        </div>
    );
}
