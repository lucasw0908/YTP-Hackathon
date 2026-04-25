import { useState } from 'react';
import MrtMap, { type Station } from '../components/MrtMap';
import { MapPin, ChevronRight } from 'lucide-react';

export default function MapPage() {
    // 🌟 MapPage 掌管了「現在選中哪一站」的狀態
    const [targetStation, setTargetStation] = useState<Station | null>(null);

    // 🌟 當 MrtMap 裡面的點點被點擊時，會觸發這個 Callback
    const handleStationSelected = (station: Station) => {
        console.log("使用者點擊了車站:", station.name);
        setTargetStation(station);

        // 這裡未來可以呼叫後端 API
        // fetchTaskForStation(station.id);
    };

    return (
        <div className="relative h-screen w-full flex flex-col">
            {/* 
        將狀態與 Callback 傳入 MrtMap。
        MrtMap 內部不再擁有 targetStation 的 state，它完全聽命於 MapPage！
      */}
            <div className='h-full '>
                <MrtMap
                    selectedStation={targetStation}
                    onStationSelect={handleStationSelected}
                />
            </div>
            <div className=' w-full h-56 /bg-red-700 grow-0 shrink-0'></div>

            {/* 🌟 額外 UI：當有選擇目標時，從底部彈出任務面板 */}
            {targetStation && (
                <div className="absolute bottom-20 left-1 right-1 bg-white rounded-xl shadow-2xl p-4 border-2 border-red-100 z-50 transition-all text-base">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                            <MapPin size={22} className="animate-bounce" />
                            <span>目標：{targetStation.name}站</span>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">{targetStation.id}</span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                        前往此站點查看任務資訊，是否確認出發？
                    </p>

                    <button
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center gap-2 shadow-md"
                        onClick={() => alert(`前往 ${targetStation.name} 的任務頁面！`)}
                    >
                        查看任務詳情 <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}