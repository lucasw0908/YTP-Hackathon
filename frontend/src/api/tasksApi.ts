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

export const MOCK_TASK: Task = {
    task_id: 1,
    task_name: '探索台師大周邊特色店家',
    location_name: '台師大商圈',
    description: '前往國立台灣師範大學附近的特色商圈，探索在地美食與文化，感受台北學區生活魅力。',
    nearest_station: '古亭',
    type: '景點',
    estimated_duration_mins: 45,
    location: { lat: 25.025042, lng: 121.516418 },
};

const TASK_CACHE_KEY = 'active_task_cache';

export function getCachedTask(): Task | null {
    try {
        const raw = localStorage.getItem(TASK_CACHE_KEY);
        return raw ? (JSON.parse(raw) as Task) : null;
    } catch { return null; }
}

export function setCachedTask(task: Task): void {
    try { localStorage.setItem(TASK_CACHE_KEY, JSON.stringify(task)); } catch { }
}

export function clearCachedTask(): void {
    localStorage.removeItem(TASK_CACHE_KEY);
}

export async function fetchCurrentTask(): Promise<Task> {
    try {
        const response = await fetch('/api/mission/active');
        if (!response.ok) throw new Error(`API ${response.status}`);
        const data = await response.json();
        if (!data.success || !data.mission) throw new Error('bad response');

        const desc: string = data.mission.description ?? '';
        const name: string = data.mission.task_name ?? '';
        let inferredType: TaskType = '景點';
        if (desc.includes('吃') || desc.includes('美食') || desc.includes('餐廳') || name.includes('吃')) inferredType = '美食';
        else if (desc.includes('買') || desc.includes('購物') || desc.includes('商圈')) inferredType = '購物';

        const task: Task = {
            task_id: data.mission.id,
            task_name: data.mission.task_name,
            location_name: data.mission.location_name,
            description: data.mission.description,
            nearest_station: data.mission.nearest_station ?? '未知',
            type: inferredType,
            estimated_duration_mins: 60,
            location: { lat: data.mission.location.lat, lng: data.mission.location.lng },
        };
        setCachedTask(task);
        return task;
    } catch {
        console.warn('使用假任務資料 (MOCK_TASK)');
        setCachedTask(MOCK_TASK);
        return MOCK_TASK;
    }
}

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
        console.log(mappedTasks)
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