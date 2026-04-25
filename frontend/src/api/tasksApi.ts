export type TaskType = '景點' | '美食' | '購物';

export interface Task {
    task_id: number;          // 從 API 的 'id' 映射過來
    task_name: string;
    location_name: string;
    description: string;
    nearest_station: string;  // API 新增欄位
    type: TaskType;           // 程式自動推斷預設
    estimated_duration_mins: number; // 預設 60
    location: { lat: number; lng: number };
}

export const TYPE_COLORS: Record<TaskType, string> = {
    '景點': '#3b82f6',
    '美食': '#ef4444',
    '購物': '#f59e0b',
};

export const TYPE_EMOJI: Record<TaskType, string> = {
    '景點': '🏛',
    '美食': '🍜',
    '購物': '🛍',
};

// 用來暫存抓取到的任務，供 getTaskById 查詢
let cachedTasks: Task[] = [];

export async function fetchTasks(userLat: number, userLng: number): Promise<Task[]> {
    try {
        // 調用正式 API (若有需要傳送經緯度，以 Query 方式帶入)
        const response = await fetch(`/api/mission/newmission?lat=${userLat}&lng=${userLng}`);
        
        if (!response.ok) {
            throw new Error(`API 請求失敗: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.missions) {
            console.error("API 回傳格式錯誤或失敗:", data);
            return [];
        }

        // 資料 Mapping：將 API 格式轉換為前端 UI 所需格式
        const mappedTasks: Task[] = data.missions.map((mission: any) => {
            
            // 透過描述簡單推斷類型 (補足 API 缺少的 type 欄位以維持 UI 豐富度)
            let inferredType: TaskType = '景點';
            const desc = mission.description || '';
            const name = mission.task_name || '';
            if (desc.includes('吃') || desc.includes('美食') || desc.includes('餐廳') || name.includes('吃')) {
                inferredType = '美食';
            } else if (desc.includes('買') || desc.includes('市集') || desc.includes('購物') || desc.includes('商圈')) {
                inferredType = '購物';
            }

            return {
                task_id: mission.id,
                task_name: mission.task_name,
                location_name: mission.location_name,
                description: mission.description,
                nearest_station: mission.nearest_station || '未知',
                type: inferredType,
                estimated_duration_mins: 60, // 預設給予 60 分鐘
                location: {
                    lat: mission.location.lat,
                    lng: mission.location.lng
                }
            };
        });

        cachedTasks = mappedTasks;
        return mappedTasks;

    } catch (error) {
        console.error("抓取任務失敗，請確認 API 狀態:", error);
        return [];
    }
}

// 供其他頁面透過 ID 查詢已抓取的任務
export function getTaskById(id: number): Task | undefined {
    return cachedTasks.find(t => t.task_id === id);
}