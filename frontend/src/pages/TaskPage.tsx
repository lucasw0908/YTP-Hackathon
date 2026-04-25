import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, ChevronUp, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import NavController from '../components/NavController';
import { fetchRoute } from '../api/directionsApi';
import { getTaskById, Task, TYPE_COLORS, TYPE_EMOJI } from '../api/tasksApi';
import { useLocation as useGPS } from '../contexts/LocationContext';
import type { Route } from '../types/wayPoint';

export default function TaskPage() {
    const { taskId } = useParams<{ taskId: string }>();
    const routerState = useLocation().state as Task | null;
    const navigate = useNavigate();
    const { gps } = useGPS();

    const task: Task | undefined = routerState ?? getTaskById(Number(taskId));

    const [route, setRoute] = useState<Route | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [showComplete, setShowComplete] = useState(false);

    useEffect(() => {
        if (!task) return;
        const lat = gps?.lat ?? 25.0478;
        const lng = gps?.lng ?? 121.517;
        fetchRoute(lat, lng, task.location.lat, task.location.lng).then(setRoute);
    }, [task?.task_id]);

    if (!task) {
        return (
            <div className="h-screen flex items-center justify-center text-gray-500">
                找不到任務
            </div>
        );
    }

    return (
        <div className="h-screen w-full relative overflow-hidden">
            {/* 頂部返回列 */}
            <div className="absolute top-0 left-0 right-0 z-[1001] flex items-center px-2 py-2 bg-white/90 backdrop-blur shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 text-gray-600">
                    <ChevronLeft size={22} />
                </button>
                <span className="flex-1 text-sm font-bold text-gray-900 truncate mx-1">
                    {task.location_name}
                </span>
                <span
                    className="text-xs px-2 py-0.5 rounded-full text-white font-bold shrink-0 mr-2"
                    style={{ background: TYPE_COLORS[task.type] }}
                >
                    {task.type}
                </span>
            </div>

            <div className=' flex flex-col h-full'>

                {/* 導航地圖（全螢幕） */}
                {route ? (
                    <div className=' w-full h-full grow'>
                        <NavController route={route} />
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-gray-100 gap-3">
                        <div className="text-4xl animate-pulse">🗺️</div>
                        <p className="text-sm text-gray-500">正在規劃路線...</p>
                    </div>
                )}

                {/* 底部任務資訊抽屜 */}
                <div className=" z-[1001] bg-white rounded-t-2xl shadow-2xl pb-10">
                    {/* 把手列 */}
                    <button
                        className="w-full flex items-center justify-between px-4 py-3"
                        onClick={() => setSheetOpen(o => !o)}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg shrink-0">{TYPE_EMOJI[task.type]}</span>
                            <span className="text-sm font-bold text-gray-800 truncate">{task.location_name}</span>
                        </div>
                        {sheetOpen
                            ? <ChevronDown size={18} className="text-gray-400 shrink-0" />
                            : <ChevronUp size={18} className="text-gray-400 shrink-0" />}
                    </button>

                    {sheetOpen && (
                        <div className="px-4 pb-5 space-y-3 border-t border-gray-100">
                            <p className="text-xs text-gray-600 leading-relaxed pt-2">
                                {task.description}
                            </p>
                            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                <p className="text-[11px] font-bold text-amber-700 mb-0.5">任務目標</p>
                                <p className="text-xs text-amber-800">{task.task_name}</p>
                            </div>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={12} /> 預計 {task.estimated_duration_mins} 分鐘
                            </p>
                            <div className="flex gap-3 pt-1">
                                <button
                                    className="flex-1 bg-green-500 active:bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-green-200"
                                    onClick={() => setShowComplete(true)}
                                >
                                    <CheckCircle size={16} /> 完成任務
                                </button>
                                <button
                                    className="flex-1 bg-gray-100 active:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
                                    onClick={() => navigate('/map')}
                                >
                                    <XCircle size={16} /> 放棄
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 完成任務 Modal */}
            {showComplete && (
                <div className="absolute inset-0 z-[2000] bg-black/50 flex items-end">
                    <div className="w-full bg-white rounded-t-2xl p-6 space-y-4">
                        <div className="text-center">
                            <div className="text-5xl mb-2">🎉</div>
                            <h2 className="text-xl font-bold text-gray-900">任務完成！</h2>
                            <p className="text-sm text-gray-500 mt-1">{task.location_name}</p>
                        </div>
                        <p className="text-xs text-gray-400 text-center">
                            拍一張照片作為任務完成的證明
                        </p>
                        <button className="w-full bg-blue-500 text-white font-bold py-3.5 rounded-xl text-sm">
                            📷 上傳照片驗證
                        </button>
                        <button
                            className="w-full text-gray-400 py-2 text-sm"
                            onClick={() => navigate('/map')}
                        >
                            跳過，返回地圖
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
