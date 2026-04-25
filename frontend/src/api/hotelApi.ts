import { HotelRecommendation } from '../types';

// 模擬的本地飯店資料庫 (Hackathon 專用)
const MOCK_HOTEL_DB = [
    '台北晶華酒店', '台北 W 飯店', '君悅酒店', '西門町意舍酒店', 
    '九份海論民宿', '九份山城逸境', '北投麗禧溫泉酒店', '日勝生加賀屋',
    '板橋凱撒大飯店', '新板希爾頓酒店'
];

/**
 * 模擬：關鍵字模糊搜尋飯店 (Autocomplete)
 */
export const searchHotelsByKeyword = async (keyword: string): Promise<string[]> => {
    console.log(`[API] 正在搜尋包含 [${keyword}] 的住宿...`);
    
    // 模擬網路延遲，讓 UX 感覺更真實
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!keyword.trim()) return [];

    return MOCK_HOTEL_DB.filter(name => 
        name.toLowerCase().includes(keyword.toLowerCase())
    );
};

/**
 * 模擬：取得區域推薦飯店列表
 */
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