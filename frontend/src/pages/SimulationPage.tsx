import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { MapPin, Radio, ToggleLeft, ToggleRight, Search, X } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import stationsRaw from '../assets/stations.json';
import lineInfoRaw from '../assets/line_info.json';
import mapImg from '../assets/metro.png';

// ─── Types ────────────────────────────────────────────────────

interface Station {
    id: string;
    name: string;
    x: number;
    y: number;
}

interface LineStation {
    StationID: string;
    StationName: { Zh_tw: string; En: string };
    Sequence: number;
}

interface LineInfo {
    LineNo: string;
    LineID: string;
    Stations: LineStation[];
}

const stationsData = stationsRaw as Station[];
const lineInfo = lineInfoRaw as LineInfo[];

const LINE_COLORS: Record<string, string> = {
    BL: '#0070bd',
    BR: '#c48a00',
    G:  '#008659',
    O:  '#e87722',
    R:  '#e3002c',
    Y:  '#f5d800',
};

const LINE_NAMES: Record<string, string> = {
    BL: '板南線',
    BR: '文湖線',
    G:  '松山新店線',
    O:  '中和新蘆線',
    R:  '淡水信義線',
    Y:  '環狀線',
};

// ─── Leaflet helpers ──────────────────────────────────────────

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const simGpsIcon = L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;background:#ef4444;border-radius:50% 50% 50% 0;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
});

function GpsClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click: (e) => onMapClick(e.latlng.lat, e.latlng.lng),
    });
    return null;
}

// ─── Main Page ────────────────────────────────────────────────

export default function SimulationPage() {
    const { isSimulationMode, setSimulationMode, setSimulatedGps, setSimulatedStation, gps } = useLocation();
    const [tab, setTab] = useState<'gps' | 'station'>('gps');

    // Local state (mirrors what's committed to context)
    const [localGps, setLocalGps] = useState<{ lat: number; lng: number } | null>(null);
    const [localStationId, setLocalStationId] = useState<string | null>(null);
    const [stationSearch, setStationSearch] = useState('');

    const handleToggle = () => setSimulationMode(!isSimulationMode);

    const handleGpsClick = (lat: number, lng: number) => {
        const pos = { lat, lng };
        setLocalGps(pos);
        setSimulatedGps(pos);
    };

    const handleStationSelect = (id: string) => {
        setLocalStationId(id);
        setSimulatedStation(id);
        setStationSearch('');
    };

    const handleClearGps = () => {
        setLocalGps(null);
        setSimulatedGps(null);
    };

    const handleClearStation = () => {
        setLocalStationId(null);
        setSimulatedStation(null);
    };

    const activeStation = stationsData.find(s => s.id === localStationId) ?? null;
    const mapCenter: [number, number] = localGps
        ? [localGps.lat, localGps.lng]
        : gps
        ? [gps.lat, gps.lng]
        : [25.0478, 121.517];

    // Flat list of all stations for search
    const allStations = useMemo(() => {
        const seen = new Set<string>();
        const result: { id: string; name: string; line: string }[] = [];
        lineInfo.forEach(line => {
            line.Stations.forEach(s => {
                if (!seen.has(s.StationID)) {
                    seen.add(s.StationID);
                    result.push({ id: s.StationID, name: s.StationName.Zh_tw, line: line.LineID });
                }
            });
        });
        return result;
    }, []);

    const filteredStations = useMemo(() => {
        if (!stationSearch.trim()) return [];
        const q = stationSearch.toLowerCase();
        return allStations.filter(s =>
            s.name.includes(stationSearch) ||
            s.id.toLowerCase().includes(q)
        ).slice(0, 10);
    }, [stationSearch, allStations]);

    return (
        <div className="h-screen w-full flex flex-col bg-gray-50">
            {/* ── Header ── */}
            <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Radio size={20} className="text-purple-500" />
                        <h1 className="font-bold text-gray-800 text-base">位置模擬器</h1>
                    </div>
                    <button
                        onClick={handleToggle}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
                            isSimulationMode
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        {isSimulationMode
                            ? <><ToggleRight size={16} /> 模擬中</>
                            : <><ToggleLeft size={16} /> 已停用</>
                        }
                    </button>
                </div>

                {/* Status pills */}
                <div className="flex gap-2 flex-wrap">
                    <StatusPill
                        icon={<MapPin size={11} />}
                        label="GPS"
                        value={localGps ? `${localGps.lat.toFixed(4)}, ${localGps.lng.toFixed(4)}` : '未設定'}
                        active={isSimulationMode && !!localGps}
                        color="blue"
                    />
                    <StatusPill
                        icon={<Radio size={11} />}
                        label="捷運站"
                        value={localStationId
                            ? `${allStations.find(s => s.id === localStationId)?.name ?? ''} (${localStationId})`
                            : '未設定'}
                        active={isSimulationMode && !!localStationId}
                        color="purple"
                    />
                </div>

                {!isSimulationMode && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 mt-2">
                        啟用模擬後，設定的位置才會覆蓋真實定位
                    </p>
                )}
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
                <TabBtn active={tab === 'gps'} onClick={() => setTab('gps')}>
                    <MapPin size={14} /> GPS 位置
                </TabBtn>
                <TabBtn active={tab === 'station'} onClick={() => setTab('station')}>
                    <Radio size={14} /> 捷運站 iBeacon
                </TabBtn>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-hidden relative">
                {tab === 'gps' && (
                    <GpsTab
                        mapCenter={mapCenter}
                        localGps={localGps}
                        onGpsClick={handleGpsClick}
                        onClear={handleClearGps}
                    />
                )}
                {tab === 'station' && (
                    <StationTab
                        stationSearch={stationSearch}
                        setStationSearch={setStationSearch}
                        filteredStations={filteredStations}
                        localStationId={localStationId}
                        onSelectStation={handleStationSelect}
                        onClear={handleClearStation}
                        activeStation={activeStation}
                        allStations={allStations}
                    />
                )}
            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                active
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
            {children}
        </button>
    );
}

function StatusPill({ icon, label, value, active, color }: {
    icon: React.ReactNode; label: string; value: string; active: boolean; color: 'blue' | 'purple';
}) {
    const colors = {
        blue: active ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500',
        purple: active ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-500',
    };
    return (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-medium ${colors[color]}`}>
            {icon}
            <span className="font-bold">{label}:</span>
            <span className="max-w-[140px] truncate">{value}</span>
        </div>
    );
}

// ─── GPS Tab ──────────────────────────────────────────────────

function GpsTab({ mapCenter, localGps, onGpsClick, onClear }: {
    mapCenter: [number, number];
    localGps: { lat: number; lng: number } | null;
    onGpsClick: (lat: number, lng: number) => void;
    onClear: () => void;
}) {
    return (
        <div className="h-full flex flex-col">
            <div className="px-3 py-2 bg-blue-50 border-b border-blue-100 flex-shrink-0 flex items-center justify-between">
                <p className="text-xs text-blue-700 font-medium">
                    點擊地圖任意位置來設定模擬 GPS 座標
                </p>
                {localGps && (
                    <button
                        onClick={onClear}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                        <X size={12} /> 清除
                    </button>
                )}
            </div>
            <div className="flex-1">
                <MapContainer
                    center={mapCenter}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />
                    <GpsClickHandler onMapClick={onGpsClick} />
                    {localGps && (
                        <Marker
                            position={[localGps.lat, localGps.lng]}
                            icon={simGpsIcon}
                        />
                    )}
                </MapContainer>
            </div>
            {localGps && (
                <div className="px-4 py-2 bg-white border-t border-gray-100 flex-shrink-0 text-xs text-gray-600">
                    <span className="font-bold">模擬座標：</span>
                    {localGps.lat.toFixed(6)}, {localGps.lng.toFixed(6)}
                </div>
            )}
        </div>
    );
}

// ─── Station Tab ──────────────────────────────────────────────

function StationTab({
    stationSearch, setStationSearch, filteredStations, localStationId,
    onSelectStation, onClear, activeStation, allStations,
}: {
    stationSearch: string;
    setStationSearch: (v: string) => void;
    filteredStations: { id: string; name: string; line: string }[];
    localStationId: string | null;
    onSelectStation: (id: string) => void;
    onClear: () => void;
    activeStation: Station | null;
    allStations: { id: string; name: string; line: string }[];
}) {
    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Search bar */}
            <div className="px-3 py-2 bg-white border-b border-gray-200 flex-shrink-0">
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="搜尋捷運站名稱或代碼..."
                        value={stationSearch}
                        onChange={e => setStationSearch(e.target.value)}
                        className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    {stationSearch && (
                        <button
                            onClick={() => setStationSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Search results dropdown */}
                {filteredStations.length > 0 && (
                    <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                        {filteredStations.map(s => (
                            <button
                                key={s.id}
                                onClick={() => onSelectStation(s.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-left"
                            >
                                <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ background: LINE_COLORS[s.line] ?? '#999' }}
                                />
                                <span className="font-medium">{s.name}</span>
                                <span className="text-xs text-gray-400">{s.id}</span>
                                <span className="text-xs text-gray-400 ml-auto">{LINE_NAMES[s.line] ?? s.line}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Currently selected */}
            {localStationId && (
                <div className="flex-shrink-0 mx-3 mt-2 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ background: LINE_COLORS[localStationId.replace(/\d+$/, '')] ?? '#999' }}
                        />
                        <div>
                            <p className="font-bold text-purple-800 text-sm">
                                {allStations.find(s => s.id === localStationId)?.name ?? localStationId}
                            </p>
                            <p className="text-xs text-purple-500">{localStationId}</p>
                        </div>
                    </div>
                    <button onClick={onClear} className="text-purple-400 hover:text-purple-600 p-1">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* MRT map hint */}
            <p className="flex-shrink-0 text-[11px] text-gray-400 text-center py-1">
                或直接點擊下方捷運地圖選擇站點
            </p>

            {/* MRT Map */}
            <div className="flex-1 overflow-hidden relative">
                <TransformWrapper
                    initialScale={1.2}
                    minScale={0.5}
                    maxScale={5}
                    centerOnInit={true}
                    wheel={{ step: 0.001 }}
                    doubleClick={{ disabled: true }}
                    pinch={{ step: 5 }}
                    limitToBounds={true}
                    panning={{ velocityDisabled: false }}
                >
                    <TransformComponent
                        wrapperStyle={{ width: '100%', height: '100%' }}
                        contentStyle={{ position: 'relative' }}
                    >
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img src={mapImg} alt="Taipei MRT Map" style={{ display: 'block', userSelect: 'none' }} />

                            {stationsData.map((station) => {
                                const isSelected = station.id === localStationId;
                                return (
                                    <button
                                        key={station.id}
                                        style={{
                                            position: 'absolute',
                                            left: station.x,
                                            top: station.y,
                                            width: 24,
                                            height: 24,
                                            marginLeft: -5,
                                            marginTop: -5,
                                            borderRadius: '50%',
                                            border: isSelected ? '3px solid #7c3aed' : '2px solid transparent',
                                            background: isSelected ? 'rgba(124,58,237,0.25)' : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                            zIndex: isSelected ? 20 : 10,
                                        }}
                                        onClick={() => onSelectStation(station.id)}
                                        title={`${station.name} (${station.id})`}
                                    />
                                );
                            })}

                            {/* Selected station pin */}
                            {activeStation && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: activeStation.x,
                                        top: activeStation.y,
                                        transform: 'translate(-37%, -90%)',
                                        pointerEvents: 'none',
                                        zIndex: 30,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div style={{
                                        background: '#7c3aed',
                                        color: 'white',
                                        fontSize: 10,
                                        fontWeight: 'bold',
                                        padding: '2px 6px',
                                        borderRadius: 6,
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                        marginBottom: 2,
                                    }}>
                                        {activeStation.name}
                                    </div>
                                    <div style={{
                                        width: 0,
                                        height: 0,
                                        borderLeft: '5px solid transparent',
                                        borderRight: '5px solid transparent',
                                        borderTop: '6px solid #7c3aed',
                                    }} />
                                </div>
                            )}
                        </div>
                    </TransformComponent>
                </TransformWrapper>
            </div>
        </div>
    );
}
