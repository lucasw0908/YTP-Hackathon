export type TaskType = '景點' | '美食' | '購物' | '活動';

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
    '活動': '#609052',
};

export const TYPE_EMOJI: Record<TaskType, string> = {
    '景點': '🏛',
    '美食': '🍜',
    '購物': '🛍',
    '活動': '❤️',
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

export const HOMEWARD_TASKS: Task[] = [
    {
        task_id: 1,
        task_name: '內湖737巷的神秘暗號',
        location_name: '內湖737商圈',
        description: '作為旅途的起點，你們需要充足的體力。前往737巷商圈，尋找一家招牌上有「豬」圖案的美食攤位，拍下四人與招牌的合照，並買一份小吃作為破冰道具！',
        nearest_station: '港墘',
        type: '景點',
        estimated_duration_mins: 30,
        location: { lat: 25.079738, lng: 121.5786619 }, // 內湖737巷美食街
    },
    {
        task_id: 2,
        task_name: '尋找失落的摩天輪軸心',
        location_name: '美麗華百樂園 1樓廣場',
        description: '抵達大直商圈！請在美麗華1樓戶外廣場尋找一個特定的「最佳拍照點」（地面通常會有標示）。四人需在這個點位上，利用錯位攝影，拍下一張「有人用手捏住摩天輪」的創意照片。',
        nearest_station: '劍南路',
        type: '景點',
        estimated_duration_mins: 25,
        location: { lat: 25.0834232, lng: 121.5574584 }, // 美麗華百樂園
    },
    {
        task_id: 3,
        task_name: '觀景台上的航空情報員',
        location_name: '松山機場觀景台 (3F)',
        description: '潛入松山機場！搭乘電梯直達3樓觀景台。你們的任務是觀察停機坪，紀錄下當時停靠的其中兩家「不同航空公司」的尾翼標誌顏色，並在觀景台的飛機模型前完成指定動作打卡。',
        nearest_station: '松山機場',
        type: '景點',
        estimated_duration_mins: 35,
        location: { lat: 25.0642713, lng: 121.5506989 }, // 松山機場觀景台
    },
    {
        task_id: 4,
        task_name: '榮星花園的螢火蟲傳說',
        location_name: '榮星花園',
        description: '在繁華的台北市區隱藏著生態復育區。請漫步至榮星花園，找到「生態水池」區域，尋找立牌上的生態解說，回答出這座公園主要復育的特有種昆蟲名稱，並在水池邊完成一段大自然ASMR錄音。',
        nearest_station: '中山國中',
        type: '景點',
        estimated_duration_mins: 30,
        location: { lat: 25.0634668, lng: 121.5391412 }, // 榮星花園公園
    },
    {
        task_id: 5,
        task_name: '遼寧夜市的最終乾杯',
        location_name: '遼寧街夜市',
        description: '天下沒有不散的筵席，這裡即將是小隊分頭回家的換乘點。前往附近的遼寧夜市，找到一家販售「圓形甜品」（如湯圓、車輪餅、地瓜球）的攤販，象徵任務圓滿結束。四人一起舉杯/舉食物乾杯，慶祝今晚的實境大冒險！',
        nearest_station: '南京復興',
        type: '景點',
        estimated_duration_mins: 40,
        location: { lat: 25.0488683, lng: 121.5421769 }, // 遼寧街夜市
    }
];

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
    return HOMEWARD_TASKS
    try {
        // 調用正式 API (若有需要傳送經緯度，以 Query 方式帶入)
        const response = await fetch(`/api/mission/newmission?lat=${userLat}&lng=${userLng}`);
        // const response = await fetch(`/api/mission/newmission?`);

        if (!response.ok) {
            throw new Error(`API 請求失敗: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.missions) {
            console.error("API 回傳格式錯誤或失敗:", data);
            throw new Error(`API 請求失敗: ${response.status}`);
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
                estimated_duration_mins: Math.floor(Math.random() * 30 + 60), // 預設給予 60 分鐘
                location: {
                    lat: mission.location.lat,
                    lng: mission.location.lng
                }
            };
        });

        cachedTasks = mappedTasks;
        console.log(mappedTasks)
        // return mappedTasks;
        const st: Task = {
            "task_id": 11,
            "task_name": "YTP Hackathon",
            "location_name": "精誠資訊集團 SYSTEX 總部",
            "description": "在 SYSTEX 門口，跟門口Logo比讚合照，拍出完美美照！",
            "nearest_station": "港墘",
            "estimated_duration_mins": Math.floor(Math.random() * 30 + 60),
            "type": "活動",
            "location": {
                "lat": 25.076910,
                "lng": 121.573714
            }
        }
        return [st, ...mappedTasks];

    } catch (error) {
        console.error("抓取任務失敗，請確認 API 狀態:", error);
        return [];
    }
}

// 供其他頁面透過 ID 查詢已抓取的任務
export function getTaskById(id: number): Task | undefined {
    return HOMEWARD_TASKS.find(t => t.task_id === id);
    return cachedTasks.find(t => t.task_id === id);
}

export async function markMissionComplete(taskId: number): Promise<void> {
    try {
        await fetch(`/api/mission/${taskId}/complete`, { method: 'PATCH' });
    } catch (e) {
        console.warn('markMissionComplete failed:', e);
    }
}