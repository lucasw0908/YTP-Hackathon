// src/components/HotelSetup.tsx
import { useState, ChangeEvent } from 'react';
// 改為從模組化的 API 引入
import { fetchRecommendedHotels, searchHotelsByKeyword } from '../api/hotelApi';
import { AccommodationData, HotelRecommendation } from '../types';
import { Search, MapPin } from 'lucide-react';

interface HotelSetupProps {
    onNext: (data: AccommodationData) => void;
}

export default function HotelSetup({ onNext }: HotelSetupProps) {
    const [hasHotel, setHasHotel] = useState<boolean | null>(null);
    
    // 已決定住宿的搜尋狀態
    const [hotelInput, setHotelInput] = useState('');
    const [autoCompleteResults, setAutoCompleteResults] = useState<string[]>([]);

    // 推薦系統的狀態
    const [searchArea, setSearchArea] = useState('');
    const [recommendations, setRecommendations] = useState<HotelRecommendation[]>([]);
    const [loading, setLoading] = useState(false);

    // 用來記錄最後一次搜尋到的合法名稱列表，避免選完清空後驗證失敗
    const [lastFoundNames, setLastFoundNames] = useState<string[]>([]);
    
    // 處理已決定住宿的關鍵字輸入與過濾 (改為非同步呼叫 API)
    const handleHotelInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const keyword = e.target.value;
        setHotelInput(keyword);

        if (keyword.trim().length > 0) {
            // 呼叫模組化的 API 取得建議名單
            const results = await searchHotelsByKeyword(keyword);
            setAutoCompleteResults(results);
            setLastFoundNames(results); // 同步更新合法名單
        } else {
            setAutoCompleteResults([]);
        }
    };

    // 直接點選搜尋建議
    const handleSelectSuggestion = (name: string) => {
        setHotelInput(name);
        setAutoCompleteResults([]); // 選完收起選單
    };

    // 送出已決定的飯店
    const submitManualHotel = () => {
        if (!hotelInput.trim()) return alert("請輸入或選擇住宿名稱");
        
        // 檢查是否在「最近一次搜尋結果」或「目前列表」中
        const isFound = lastFoundNames.includes(hotelInput) || autoCompleteResults.includes(hotelInput);
        
        if (!isFound) {
            const confirmIllegal = window.confirm(
                "⚠️ 系統找不到這間住宿的登記資料。\n\n這可能是未經核准的非法旅宿，安全與權益可能不受保障。您確定要繼續使用此名稱嗎？"
            );
            if (!confirmIllegal) return;
        }

        console.log("[Debug] 確定住宿:", hotelInput);
        onNext({ hasHotel: true, hotelName: hotelInput });
    };

    // 處理需要推薦飯店的邏輯
    const handleSearchHotels = async () => {
        if (!searchArea) return alert("請輸入想住的區域");
        setLoading(true);
        const results = await fetchRecommendedHotels(searchArea);
        
        // 去重：如果名稱完全一樣就不重複顯示
        const uniqueResults = results.filter((hotel, index, self) =>
            index === self.findIndex((t) => t.name === hotel.name)
        );
        
        setRecommendations(uniqueResults);
        setLoading(false);
    };

    const handleSelectRecommendedHotel = (hotelName: string) => {
        console.log("[Debug] 選擇了推薦飯店:", hotelName);
        onNext({ hasHotel: false, hotelName: hotelName });
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md h-[600px] flex flex-col overflow-hidden">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 shrink-0">住宿設定</h2>

            {/* 初始二選一 */}
            {hasHotel === null && (
                <div className="space-y-4 animate-fadeIn">
                    <p className="text-gray-600 mb-4">請問您已經有偏好的飯店或住宿地點了嗎？</p>
                    <button 
                        onClick={() => setHasHotel(true)} 
                        className="w-full border-2 border-blue-500 text-blue-600 py-4 rounded-lg font-medium hover:bg-blue-50 transition-all"
                    >
                        是，我已經決定了
                    </button>
                    <button 
                        onClick={() => setHasHotel(false)} 
                        className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-all"
                    >
                        否，請推薦給我
                    </button>
                </div>
            )}

            {/* 情境 A：已決定住宿 */}
            {hasHotel === true && (
                <div className="flex flex-col flex-1 animate-fadeIn">
                    <label className="block text-sm font-medium text-gray-700 mb-2">請搜尋您的飯店或民宿名稱</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            value={hotelInput} 
                            onChange={handleHotelInputChange} 
                            placeholder="例如：台北晶華酒店、九份海論..." 
                            className="w-full border-2 border-gray-200 rounded-lg pl-10 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                            autoFocus
                        />
                        
                        {/* 搜尋建議選單 */}
                        {autoCompleteResults.length > 0 && (
                            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                                {autoCompleteResults.map((name, idx) => (
                                    <li 
                                        key={idx} 
                                        onClick={() => handleSelectSuggestion(name)}
                                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center text-gray-700 transition-colors"
                                    >
                                        <MapPin size={16} className="text-blue-500 mr-2 shrink-0" />
                                        {name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-2">
                        *若清單中沒有您的住宿，可直接手動輸入完整名稱後送出。
                    </p>

                    <div className="mt-auto pt-6 flex gap-3">
                        <button onClick={() => { setHasHotel(null); setHotelInput(''); setAutoCompleteResults([]); }} className="w-1/3 bg-gray-100 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">返回</button>
                        <button onClick={submitManualHotel} className="w-2/3 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 shadow-md transition-all">確認送出</button>
                    </div>
                </div>
            )}

            {/* 情境 B：需要推薦飯店 */}
            {hasHotel === false && (
                <div className="flex flex-col flex-1 animate-fadeIn min-h-0">
                    <label className="block text-sm font-medium text-gray-700 mb-2">您想住在哪個區域？(產生推薦清單)</label>
                    <div className="flex gap-2 mb-4 shrink-0">
                        <input 
                            type="text" 
                            value={searchArea} 
                            onChange={(e) => setSearchArea(e.target.value)} 
                            placeholder="例如：信義區、西門町" 
                            className="w-full border-2 border-gray-200 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                        />
                        <button 
                            onClick={handleSearchHotels} 
                            disabled={loading || !searchArea} 
                            className="bg-blue-600 text-white px-6 rounded-lg font-medium whitespace-nowrap disabled:opacity-50 hover:bg-blue-700 transition-colors"
                        >
                            {loading ? '搜尋中...' : '搜尋'}
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                        {recommendations.length > 0 ? (
                            <>
                                <p className="text-sm text-gray-500 mb-2 shrink-0">為您推薦以下住宿，請點擊選擇：</p>
                                <div className="space-y-2 overflow-y-auto pr-2 pb-2 custom-scrollbar flex-1 min-h-0">
                                    {recommendations.map((hotel) => (
                                        <div 
                                            key={hotel.id} 
                                            className="p-4 border-2 border-gray-100 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group relative"
                                            onClick={() => handleSelectRecommendedHotel(hotel.name)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                                                    {hotel.name}
                                                </h3>
                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                                    {hotel.priceLevel}
                                                </span>
                                            </div>

                                            {hotel.address && (
                                                <p className="text-xs text-gray-500 flex items-center mb-2">
                                                    <MapPin size={12} className="mr-1 shrink-0" />
                                                    {hotel.address}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {hotel.tags?.slice(0, 3).map((tag, i) => (
                                                    <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {hotel.officialWebsite && (
                                                <a 
                                                    href={hotel.officialWebsite} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()} // 防止點擊連結觸發選擇飯店
                                                    className="text-xs text-blue-600 hover:underline flex items-center mt-2 inline-flex"
                                                >
                                                    前往官方網站
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">
                                {loading ? '正在為您尋找最棒的住宿...' : '請輸入區域以獲取推薦'}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 shrink-0">
                        <button onClick={() => { setHasHotel(null); setRecommendations([]); setSearchArea(''); }} className="w-full bg-gray-100 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">返回</button>
                    </div>
                </div>
            )}
        </div>
    );
}