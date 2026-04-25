export type TaskType = '景點' | '美食' | '購物';

export interface Task {
    task_id: number;
    task_name: string;
    location_name: string;
    description: string;
    type: TaskType;
    estimated_duration_mins: number;
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

const MOCK_TASKS: Task[] = [
    {
        task_id: 1,
        task_name: '前往華山1914文化創意產業園區，找一處最能代表文青氛圍的角落拍一張文藝照。',
        location_name: '華山1914文化創意產業園區',
        description: '華山是台北最具代表性的文創園區之一，雨天也能在室內逛展覽、咖啡廳。找一個充滿藝術氣息的角落，捕捉你的文青時刻。',
        type: '景點',
        estimated_duration_mins: 60,
        location: { lat: 25.044, lng: 121.5298 },
    },
    {
        task_id: 2,
        task_name: '在松山文創園區的閱樂書店，選一本你感興趣的書，與書和咖啡合照。',
        location_name: '閱樂書店 (松山文創園區內)',
        description: '閱樂書店座落於松山文創園區內，氛圍寧靜雅緻，是雨天閱讀放鬆的好去處。享受一杯咖啡與書本的時光。',
        type: '景點',
        estimated_duration_mins: 75,
        location: { lat: 25.0437, lng: 121.5606 },
    },
    {
        task_id: 3,
        task_name: '漫步永康街，購買一份蔥抓餅或小籠包，與美食合照。',
        location_name: '永康街',
        description: '永康街匯聚了各式特色小吃與文創小店，是體驗台北在地美食與文青風格的好地方。品嚐一份經典小吃，感受街區魅力。',
        type: '美食',
        estimated_duration_mins: 45,
        location: { lat: 25.0334, lng: 121.529 },
    },
    {
        task_id: 4,
        task_name: '在龍山寺正殿前，拍攝一張展現寺廟宏偉建築與香火鼎盛的照片。',
        location_name: '龍山寺',
        description: '龍山寺是台北最古老、香火最鼎盛的寺廟之一，精緻的雕刻與建築藝術令人讚嘆。在雨中欣賞其莊嚴與寧靜，感受信仰的力量。',
        type: '景點',
        estimated_duration_mins: 45,
        location: { lat: 25.0365, lng: 121.4999 },
    },
    {
        task_id: 5,
        task_name: '進入西門紅樓八角樓，與內部文創市集的特色商品合照。',
        location_name: '西門紅樓',
        description: '西門紅樓是台灣第一座官方興建的公營市場，現在轉型為文創基地。室內有許多獨特的文創商品，是雨天逛街的好選擇。',
        type: '購物',
        estimated_duration_mins: 60,
        location: { lat: 25.0445, lng: 121.507 },
    },

    {
        task_id: 6,
        task_name: '在誠品生活南西的書店區，找一個舒適的角落，拍一張閱讀的氛圍照。',
        location_name: '誠品生活南西',
        description: '誠品生活南西不僅是百貨公司，更融合了書店、選物店與咖啡廳，充滿文青氣息。在雨天來此，享受購物的樂趣與閱讀的寧靜。',
        type: '購物',
        estimated_duration_mins: 75,
        location: { lat: 25.0526, lng: 121.5208 },
    },

];

export async function fetchTasks(_userLat: number, _userLng: number): Promise<Task[]> {
    // TODO: GET /api/tasks?lat=&lng=
    await new Promise(r => setTimeout(r, 800));
    return MOCK_TASKS;
}

export function getTaskById(id: number): Task | undefined {
    return MOCK_TASKS.find(t => t.task_id === id);
}
