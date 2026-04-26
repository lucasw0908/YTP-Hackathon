import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Clock, ChevronRight, X, Train } from 'lucide-react';
import { fetchTasks, Task, TaskType, TYPE_COLORS, TYPE_EMOJI } from '../api/tasksApi';
import { useLocation as useGPS } from '../contexts/LocationContext';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function makeTaskMarker(type: TaskType, selected: boolean) {
    const color = TYPE_COLORS[type] || TYPE_COLORS['景點'];
    const emoji = TYPE_EMOJI[type] || TYPE_EMOJI['景點'];
    const size = selected ? 42 : 32;
    const borderColor = selected ? "#ffeb10" : "white";
    return L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:3px solid ${borderColor};box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:${selected ? 20 : 15}px;transition:all .15s;">${emoji}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}

const userDot = L.divIcon({
    className: '',
    html: `<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(59,130,246,0.6);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
    useMapEvents({ click: onMapClick });
    return null;
}

export default function MapPage() {
    const navigate = useNavigate();
    const { gps } = useGPS();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selected, setSelected] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);

    const center: [number, number] = gps ? [gps.lat, gps.lng] : [25.0478, 121.517];

    useEffect(() => {
        fetchTasks(center[0], center[1])
            .then((data) => setTasks(data))
            .catch((err) => console.error("加載任務失敗", err))
            .finally(() => setLoading(false));
    }, []);

    const handleMarkerClick = (task: Task) => {
        setSelected(prev => prev?.task_id === task.task_id ? null : task);
    };

    return (
        <div className="h-screen w-full relative">
            {/* Loading 遮罩 */}
            {loading && (
                <div className="absolute inset-0 z-[2000] bg-white/90 flex flex-col items-center justify-center gap-3">
                    <div className="text-4xl animate-bounce">🗺️</div>
                    <p className="text-gray-600 font-medium">正在根據您的偏好生成任務...</p>
                </div>
            )}

            {/* Leaflet 地圖 */}
            <MapContainer
                center={center}
                zoom={14}
                style={{ height: '100%', width: '100%', zIndex: 10 }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <MapClickHandler onMapClick={() => setSelected(null)} />

                {tasks.map(task => (
                    <Marker
                        key={task.task_id}
                        position={[task.location.lat, task.location.lng]}
                        icon={makeTaskMarker(task.type, selected?.task_id === task.task_id)}
                        eventHandlers={{
                            click: e => {
                                e.originalEvent.stopPropagation();
                                handleMarkerClick(task);
                            },
                        }}
                    />
                ))}

                {gps && (
                    <Marker position={[gps.lat, gps.lng]} icon={userDot} zIndexOffset={1000} />
                )}
            </MapContainer>

            {/* 底部面板 */}
            <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-2xl pb-10 transition-transform duration-300">
                {selected ? (
                    <TaskDetailPanel
                        task={selected}
                        onClose={() => setSelected(null)}
                        onGo={() => navigate(`/task/${selected.task_id}`, { state: selected })}
                    />
                ) : (
                    <TaskListPanel tasks={tasks} onSelect={setSelected} />
                )}
            </div>
        </div>
    );
}

// ─── 任務列表面板 ────────────────────────────────────────────

function TaskListPanel({ tasks, onSelect }: { tasks: Task[]; onSelect: (t: Task) => void }) {
    if (tasks.length === 0) {
        return <div className="p-6 text-center text-gray-500 font-medium">目前沒有可用任務，請稍後再試。</div>;
    }

    return (
        <div className="px-4 pt-3 pb-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800">
                    今日任務 <span className="text-gray-400 font-normal text-sm">({tasks.length})</span>
                </h2>
                <div className="flex gap-3 text-xs text-gray-500">
                    {(['景點', '美食', '購物'] as TaskType[]).map(type => (
                        <span key={type} className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: TYPE_COLORS[type] }} />
                            {type}
                        </span>
                    ))}
                </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
                {tasks.map(task => (
                    <button
                        key={task.task_id}
                        className="shrink-0 w-44 bg-gray-50 rounded-xl p-3 text-left border border-gray-100 active:scale-95 transition-transform"
                        onClick={() => onSelect(task)}
                    >
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-lg">{TYPE_EMOJI[task.type]}</span>
                            <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold"
                                style={{ background: TYPE_COLORS[task.type] }}
                            >
                                {task.type}
                            </span>
                        </div>
                        <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug h-8">
                            {task.location_name}
                        </p>
                        <div className="text-[10px] text-gray-500 mt-2 flex flex-col gap-1">
                            <span className="flex items-center gap-1">
                                <Clock size={10} className="text-blue-400" /> {task.estimated_duration_mins} 分鐘
                            </span>
                            <span className="flex items-center gap-1">
                                <Train size={10} className="text-purple-500" /> 捷運 {task.nearest_station} 站
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── 任務詳情面板 ────────────────────────────────────────────

function TaskDetailPanel({
    task, onClose, onGo,
}: {
    task: Task;
    onClose: () => void;
    onGo: () => void;
}) {
    return (
        <div className="px-4 pt-3 pb-5">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{TYPE_EMOJI[task.type]}</span>
                        <span
                            className="text-xs px-2 py-0.5 rounded-full text-white font-bold shadow-sm"
                            style={{ background: TYPE_COLORS[task.type] }}
                        >
                            {task.type}
                        </span>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 flex items-center gap-1">
                            <Train size={12} /> {task.nearest_station} 站
                        </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{task.location_name}</h3>
                </div>
                <button onClick={onClose} className="p-1.5 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                    <X size={16} />
                </button>
            </div>

            <p className="text-xs text-gray-500 line-clamp-3 mb-3 leading-relaxed">
                {task.description}
            </p>

            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4 shadow-sm">
                <p className="text-[11px] font-bold text-amber-600 mb-1 flex items-center gap-1">
                    <span>📌</span> 任務目標
                </p>
                <p className="text-xs font-medium text-amber-900 leading-relaxed">{task.task_name}</p>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                    <Clock size={14} /> 預計停留 {task.estimated_duration_mins} 分鐘
                </span>
                <button
                    className="bg-blue-600 active:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-1.5 text-sm shadow-lg shadow-blue-200 transition-all"
                    onClick={onGo}
                >
                    前往任務 <ChevronRight size={16} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}