// src/api/mockNavigation.ts

export interface RoutePoint {
    lat: number;
    lng: number;
}

export interface NavigationTask {
    taskId: string;
    destinationName: string;
    routeCoords: RoutePoint[];
}

// 模擬的路線資料庫 (可以依照站點 ID 給不同路線，若找不到就給預設)
const MOCK_ROUTES: Record<string, RoutePoint[]> = {
    // 台北車站附近的模擬路線
    'default': [
        { lat: 25.0478, lng: 121.5170 }, 
        { lat: 25.0485, lng: 121.5180 },
        { lat: 25.0490, lng: 121.5195 }  
    ],
    // 頂埔站 (BL01) 附近的模擬路線
    'BL01': [
        { lat: 24.9595, lng: 121.4200 },
        { lat: 24.9598, lng: 121.4190 },
        { lat: 24.9600, lng: 121.4185 }
    ]
};

/**
 * 模擬：向後端請求前往指定捷運站的任務與導航路徑
 * @param stationId 捷運站代碼 (例如 "BL01")
 * @param stationName 捷運站名稱
 */
export const fetchTaskRouteForStation = async (stationId: string, stationName: string): Promise<NavigationTask> => {
    console.log(`[API] 正在呼叫 LLM 規劃前往 [${stationName}] 的專屬任務與路線...`);
    
    // 模擬網路傳輸與 LLM 生成的運算延遲 (稍微久一點，感覺像在思考)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 取得路線，若沒有專屬路線則拿預設的
    const coords = MOCK_ROUTES[stationId] || MOCK_ROUTES['default'];

    return {
        taskId: `TASK_${Date.now()}`,
        destinationName: `${stationName} - 隱藏打卡點`,
        routeCoords: coords
    };
};