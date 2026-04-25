// src/components/BasicSetup.tsx
import { useState, ChangeEvent } from 'react';
import { BasicTravelData } from '../types';

interface BasicSetupProps {
    onNext: (data: BasicTravelData) => void;
}

export default function BasicSetup({ onNext }: BasicSetupProps) {
    const [formData, setFormData] = useState<BasicTravelData>({
        region: '', // 初始為空，強迫使用者選擇
        startDate: '',
        startTime: '早上',
        durationDays: 1,
        endTime: '晚上'
    });

    // 控制漸進式顯示的狀態 (1: 地區, 2: 日期與抵達時間, 3: 天數與離開時間)
    const [revealStep, setRevealStep] = useState(1);

    const handleRegionSelect = (region: string) => {
        setFormData({ ...formData, region });
        setRevealStep(2); // 自動展開下一步
    };

    const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, startDate: e.target.value });
        setRevealStep(3); // 自動展開下一步
    };

    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 處理天數的快捷按鈕
    const handleDurationClick = (day: number) => {
        setFormData({ ...formData, durationDays: day });
    };

    // 處理天數的自由輸入框
    const handleDurationInput = (e: ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        setFormData({ ...formData, durationDays: isNaN(val) ? 0 : val });
    };

    const handleNext = () => {
        if (!formData.region) return alert("請選擇旅行地區");
        if (!formData.startDate) return alert("請選擇抵達日期");
        if (formData.durationDays < 1) return alert("停留天數至少需為 1 天");
        console.log("[Debug] BasicSetup 收集完成:", formData);
        onNext(formData);
    };

    // 判斷目前的天數是否為自訂（非 1, 2, 3, 4）
    const isCustomDuration = ![1, 2, 3, 4].includes(formData.durationDays) && formData.durationDays > 0;

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">行程基本設定</h2>
            
            <div className="space-y-6">
                {/* Step 1: 地區選擇 (二選一) */}
                <div className="animate-fadeIn transition-all duration-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">想去哪裡旅行呢？</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleRegionSelect('雙北')}
                            className={`py-3 rounded-lg border-2 font-medium transition-all ${
                                formData.region === '雙北' 
                                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                                : 'border-gray-200 hover:border-blue-300 text-gray-700'
                            }`}
                        >
                            雙北 (台北/新北)
                        </button>
                        <button
                            disabled
                            className="py-3 rounded-lg border-2 border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                        >
                            其他地區 (敬請期待)
                        </button>
                    </div>
                </div>

                {/* Step 2: 選擇日期 與 抵達時間 */}
                {revealStep >= 2 && (
                    <div className="animate-fadeIn transition-all duration-500">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">預計哪一天出發？</label>
                                <input 
                                    type="date" 
                                    name="startDate" 
                                    value={formData.startDate}
                                    onChange={handleDateChange} 
                                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">抵達時間</label>
                                <select 
                                    name="startTime" 
                                    value={formData.startTime} 
                                    onChange={handleChange} 
                                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500"
                                >
                                    <option value="早上">早上</option>
                                    <option value="中午">中午</option>
                                    <option value="晚上">晚上</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: 複合式天數設定 與 離開時間 */}
                {revealStep >= 3 && (
                    <div className="animate-fadeIn space-y-6 transition-all duration-500">
                        {/* 停留天數 (按鈕 + 自由輸入框) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">預計停留幾天？</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map(day => (
                                    <button
                                        key={day}
                                        onClick={() => handleDurationClick(day)}
                                        className={`flex-1 py-2.5 rounded-lg border-2 font-medium transition-all ${
                                            formData.durationDays === day 
                                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                            : 'border-gray-200 hover:border-blue-300 text-gray-700'
                                        }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                                <input 
                                    type="number" 
                                    min="1" 
                                    placeholder="自訂"
                                    value={isCustomDuration ? formData.durationDays : ''} 
                                    onChange={handleDurationInput} 
                                    className={`w-20 border-2 rounded-lg p-2.5 text-center outline-none transition-all ${
                                        isCustomDuration
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 focus:ring-2 focus:ring-blue-100'
                                        : 'border-gray-200 focus:border-blue-300 text-gray-700'
                                    }`} 
                                />
                            </div>
                        </div>

                        {/* 離開時間 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">最後一天離開時間</label>
                            <select 
                                name="endTime" 
                                value={formData.endTime} 
                                onChange={handleChange} 
                                className="w-full border-2 border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500"
                            >
                                <option value="早上">早上</option>
                                <option value="中午">中午</option>
                                <option value="晚上">晚上</option>
                            </select>
                        </div>

                        <button onClick={handleNext} className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 shadow-md transition-all">
                            下一步，設定住宿
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}