// src/api/mockBackend.ts
import { HotelRecommendation, TravelPlanPayload } from '../types';

// 模擬取得飯店列表 API
export const fetchRecommendedHotels = async (area: string): Promise<HotelRecommendation[]> => {
    console.log(`[API] 正在取得 [${area}] 的推薦飯店...`);
    // 模擬網路延遲
    await new Promise((resolve) => setTimeout(resolve, 800));

    return [
        { id: 1, name: `${area} 豪華大飯店`, priceLevel: "$$$" },
        { id: 2, name: `${area} 文青設計旅店`, priceLevel: "$$" },
        { id: 3, name: `${area} 捷運共構商旅`, priceLevel: "$$" },
        { id: 4, name: `${area} 小資青年旅館`, priceLevel: "$" },
    ];
};

// 模擬送出最終資料給 LLM API
export const submitTravelPlan = async (payload: TravelPlanPayload): Promise<{ success: boolean; message: string }> => {
    console.log("[API] 準備發送給 LLM 的資料 payload:", payload);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { success: true, message: "行程規劃中..." };
};