import { TravelPlanPayload } from '../types';

/**
 * 模擬：送出最終資料給 LLM API
 */
export const submitTravelPlan = async (payload: TravelPlanPayload): Promise<{ success: boolean; message: string }> => {
    console.log("[API] 準備發送給 LLM 的資料 payload:", payload);
    
    // 模擬 LLM 思考延遲
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    return { success: true, message: "行程規劃中..." };
};