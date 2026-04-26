import { HotelRecommendation } from '../types';

// 模擬的本地飯店資料庫 (Hackathon 專用)
const MOCK_HOTEL_DB = [
    '台北晶華酒店', '台北 W 飯店', '君悅酒店', '西門町意舍酒店', 
    '九份海論民宿', '九份山城逸境', '北投麗禧溫泉酒店', '日勝生加賀屋',
    '板橋凱撒大飯店', '新板希爾頓酒店'
];

/**
 * 關鍵字模糊搜尋飯店 (Autocomplete - 串接後端 API)
 */
export const searchHotelsByKeyword = async (keyword: string): Promise<string[]> => {
    console.log(`[API] 正在串接後端搜尋包含 [${keyword}] 的住宿...`);
    
    if (!keyword.trim()) return [];

    try {
        const response = await fetch(`/api/hotel?keyword=${encodeURIComponent(keyword)}`);
        if (!response.ok) {
            throw new Error('Failed to search hotels');
        }
        
        const data = await response.json();
        
        // 後端返回的是物件陣列，我們只需要名稱字串陣列
        if (Array.isArray(data)) {
            return data.map((hotel: any) => hotel.name).filter(Boolean);
        }
        
        return [];
    } catch (error) {
        console.error('searchHotelsByKeyword error:', error);
        return [];
    }
};

/**
 * 取得區域推薦飯店列表 (串接後端 API)
 */
export const fetchRecommendedHotels = async (area: string): Promise<HotelRecommendation[]> => {
    console.log(`[API] 正在串接後端取得 [${area}] 的推薦飯店...`);
    
    try {
        const response = await fetch(`/api/hotel?keyword=${encodeURIComponent(area)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch hotels');
        }
        
        const data = await response.json();
        
        // 將後端資料格式 (name, address, tags...) 轉換成前端格式 (id, name, priceLevel)
        if (Array.isArray(data)) {
            return data.map((hotel: any, index: number) => ({
                id: index, 
                name: hotel.name || '未知名飯店',
                address: hotel.address,
                officialWebsite: hotel.official_website,
                tags: hotel.tags,
                priceLevel: hotel.tags?.some((t: string) => t.includes('豪華')) ? '$$$' : '$$'
            }));
        }
        
        return [];
    } catch (error) {
        console.error('fetchRecommendedHotels error:', error);
        return [];
    }
};