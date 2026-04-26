import { TravelPlanPayload } from '../types';

/**
 * 送出最終資料給後端 API 並儲存
 */
export const submitTravelPlan = async (payload: TravelPlanPayload): Promise<{ success: boolean; message: string }> => {
    console.log("[API] 準備發送給後端儲存的資料 payload:", payload);
    
    try {
        const response = await fetch('/api/plan/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error('儲存行程失敗');
        }

        const data = await response.json();
        return { success: true, message: "行程已成功儲存！" };
    } catch (error) {
        console.error('submitTravelPlan error:', error);
        return { success: false, message: "儲存失敗，請稍後再試" };
    }
};