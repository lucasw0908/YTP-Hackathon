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
        task_name: '走訪剝皮寮歷史街區，與紅磚瓦牆或舊式窗花拍一張懷舊風照片。',
        location_name: '剝皮寮歷史街區',
        description: '剝皮寮保留了清代、日治時期的建築風格，充滿歷史感。在紅磚瓦牆間穿梭，感受老台北的獨特韻味，即使下雨也有部分遮蔽。',
        type: '景點',
        estimated_duration_mins: 60,
        location: { lat: 25.036, lng: 121.5002 },
    },
    {
        task_id: 5,
        task_name: '在龍山寺正殿前，拍攝一張展現寺廟宏偉建築與香火鼎盛的照片。',
        location_name: '龍山寺',
        description: '龍山寺是台北最古老、香火最鼎盛的寺廟之一，精緻的雕刻與建築藝術令人讚嘆。在雨中欣賞其莊嚴與寧靜，感受信仰的力量。',
        type: '景點',
        estimated_duration_mins: 45,
        location: { lat: 25.0365, lng: 121.4999 },
    },
    {
        task_id: 6,
        task_name: '進入西門紅樓八角樓，與內部文創市集的特色商品合照。',
        location_name: '西門紅樓',
        description: '西門紅樓是台灣第一座官方興建的公營市場，現在轉型為文創基地。室內有許多獨特的文創商品，是雨天逛街的好選擇。',
        type: '購物',
        estimated_duration_mins: 60,
        location: { lat: 25.0445, lng: 121.507 },
    },
    {
        task_id: 7,
        task_name: '在迪化街尋找一間老字號中藥行或布行，拍下其充滿歷史感的店面招牌。',
        location_name: '迪化街',
        description: '迪化街是台北最古老的街區之一，充滿年貨、中藥和布料的傳統氣息，近年也多了許多文創店家。在騎樓下穿梭，感受新舊融合的魅力。',
        type: '景點',
        estimated_duration_mins: 60,
        location: { lat: 25.056, lng: 121.5098 },
    },
    {
        task_id: 8,
        task_name: '前往臺北當代藝術館，與你最喜歡的一件當代藝術作品合影留念。',
        location_name: '臺北當代藝術館',
        description: '臺北當代藝術館由歷史建築改建而成，展出各種前衛的當代藝術作品。室內展覽是雨天享受藝術薰陶的絕佳選擇。',
        type: '景點',
        estimated_duration_mins: 90,
        location: { lat: 25.0505, lng: 121.5186 },
    },
    {
        task_id: 9,
        task_name: '在誠品生活南西的書店區，找一個舒適的角落，拍一張閱讀的氛圍照。',
        location_name: '誠品生活南西',
        description: '誠品生活南西不僅是百貨公司，更融合了書店、選物店與咖啡廳，充滿文青氣息。在雨天來此，享受購物的樂趣與閱讀的寧靜。',
        type: '購物',
        estimated_duration_mins: 75,
        location: { lat: 25.0526, lng: 121.5208 },
    },
    {
        task_id: 10,
        task_name: '在台北車站大廳的裝置藝術「鳥人」前，與其合照展現旅程的起點與終點。',
        location_name: '台北車站大廳',
        description: '台北車站不僅是交通樞紐，其大廳的公共藝術「鳥人」也成為一個獨特的打卡點。在旅程中，以此作為一個有趣的紀念。',
        type: '景點',
        estimated_duration_mins: 30,
        location: { lat: 25.0477, lng: 121.517 },
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
