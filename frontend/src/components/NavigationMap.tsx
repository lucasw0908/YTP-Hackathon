import React, { useEffect, useMemo } from 'react';
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

const makeRoleIcon = (emoji: string, color: string) =>
    L.divIcon({
        className: '',
        html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;">${emoji}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });

const ROLE_ICONS = {
    transition: makeRoleIcon('🔄', '#f97316'),
    transfer:   makeRoleIcon('🚇', '#8b5cf6'),
    destination: makeRoleIcon('🎯', '#ef4444'),
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
}

interface NavigationMapProps {
    route: Route;
    /** 目前進行到第幾個 waypoint，只顯示剩餘路段 */
    currentIndex?: number;
}

export default function NavigationMap({ route, currentIndex = 0 }: NavigationMapProps) {
    const { gps } = useLocation();
    const centerPos: [number, number] = gps ? [gps.lat, gps.lng] : [25.0478, 121.5170];

    // 只顯示從 currentIndex 開始的剩餘路段
    const remainingWaypoints = useMemo(
        () => route.waypoints.slice(currentIndex),
        [route, currentIndex],
    );

    const segments = useMemo<Segment[]>(() => {
        if (!remainingWaypoints.length) return [];
        const result: Segment[] = [];
        let cur: Segment | null = null;
        for (const wp of remainingWaypoints) {
            const ll: [number, number] = [wp.coord[1], wp.coord[0]];
            if (!cur || cur.mode !== wp.mode) {
                cur = { mode: wp.mode, coords: [ll] };
                result.push(cur);
            } else {
                cur.coords.push(ll);
            }
        }
        return result;
    }, [remainingWaypoints]);

    // 只顯示「下一個」關鍵節點（第一個 role !== 'waypoint' 的點）
    const nextKeyPoint = useMemo(
        () => remainingWaypoints.find(wp => wp.role !== 'waypoint') ?? null,
        [remainingWaypoints],
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

                {segments.map((seg, i) => (
                    <Polyline
                        key={i}
                        positions={seg.coords}
                        color={MODE_COLORS[seg.mode]}
                        weight={seg.mode === 'metro' ? 5 : 6}
                        opacity={0.85}
                        dashArray={seg.mode === 'metro' ? '10, 8' : undefined}
                    />
                ))}

                {/* 只顯示下一個關鍵節點 */}
                {nextKeyPoint && (() => {
                    const pos: [number, number] = [nextKeyPoint.coord[1], nextKeyPoint.coord[0]];
                    const icon = nextKeyPoint.role === 'destination'
                        ? ROLE_ICONS.destination
                        : nextKeyPoint.role === 'transfer'
                            ? ROLE_ICONS.transfer
                            : ROLE_ICONS.transition;
                    return (
                        <Marker position={pos} icon={icon}>
                            {(nextKeyPoint as any).instruction && (
                                <Popup>
                                    <span className="text-sm font-medium">{(nextKeyPoint as any).instruction}</span>
                                </Popup>
                            )}
                        </Marker>
                    );
                })()}

                {gps && (
                    <Marker position={[gps.lat, gps.lng]} icon={userIcon} zIndexOffset={1000} />
                )}
            </MapContainer>
        </div>
    );
}
