import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Calendar, Clock, MapPin, Hotel, ListChecks } from 'lucide-react';
import BasicSetup from '../components/BasicSetup';
import HotelSetup from '../components/HotelSetup';
import PreferenceQuiz from '../components/PreferenceQuiz';
import { submitTravelPlan } from '../api/planApi';
import { AppStage, TravelPlanPayload, BasicTravelData, AccommodationData, PreferenceAnswers } from '../types';
import IconMapper from '../components/IconMapper';

// 流程狀態列舉
const STAGES = {
    BASIC: 'BASIC',
    HOTEL: 'HOTEL',
    QUIZ: 'QUIZ',
    SUMMARY: 'SUMMARY'
};

function Landing() {
    const navigate = useNavigate();
    const [currentStage, setCurrentStage] = useState<AppStage>(AppStage.BASIC);
    const [globalTravelData, setGlobalTravelData] = useState<TravelPlanPayload>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showJson, setShowJson] = useState<boolean>(false);

    const handleBasicComplete = (data: BasicTravelData) => {
        setGlobalTravelData(prev => ({ ...prev, basic: data }));
        setCurrentStage(AppStage.HOTEL);
    };

    const handleHotelComplete = (data: AccommodationData) => {
        setGlobalTravelData(prev => ({ ...prev, accommodation: data }));
        setCurrentStage(AppStage.QUIZ);
    };

    const handleQuizComplete = (data: PreferenceAnswers) => {
        const finalData: TravelPlanPayload = { ...globalTravelData, preferences: data };
        setGlobalTravelData(finalData);
        setCurrentStage(AppStage.SUMMARY);
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        const result = await submitTravelPlan(globalTravelData);
        setIsSubmitting(false);
        
        if (result.success) {
            // alert("送出成功！即將前往導航頁面。");
            navigate('/map');
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 flex flex-col justify-center">
            <header className="max-w-xl mx-auto w-full text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">遊戲行前調查</h1>
                <p className="text-gray-500 mt-2">告訴我們你的偏好，幫你安排專屬的闖關任務</p>
            </header>

            <main className="w-full">
                {currentStage === STAGES.BASIC && <BasicSetup onNext={handleBasicComplete} />}
                {currentStage === STAGES.HOTEL && <HotelSetup onNext={handleHotelComplete} />}
                {currentStage === STAGES.QUIZ && <PreferenceQuiz onComplete={handleQuizComplete} />}

                {currentStage === STAGES.SUMMARY && (
                    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="bg-green-500 p-6 text-center text-white">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-3">
                                <IconMapper emoji="🎉" size={32} />
                            </div>
                            <h2 className="text-2xl font-black">行程偏好已就緒！</h2>
                            <p className="opacity-90 text-sm mt-1">我們已準備好為您打造專屬旅程</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Human Readable Summary */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">旅行時間</p>
                                        <p className="text-gray-800 font-bold">
                                            {globalTravelData.basic?.startDate} ({globalTravelData.basic?.durationDays} 天)
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                                        <Hotel size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">住宿地點</p>
                                        <p className="text-gray-800 font-bold">
                                            {globalTravelData.accommodation?.hasHotel 
                                                ? globalTravelData.accommodation.hotelName 
                                                : '由 AI 推薦適合住宿'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                                        <ListChecks size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">主要偏好</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {Object.entries(globalTravelData.preferences || {}).slice(0, 3).map(([key, val]) => (
                                                <span key={key} className="bg-white px-2 py-1 rounded-md text-xs border border-gray-200 text-gray-600 shadow-sm">
                                                    {String(val)}
                                                </span>
                                            ))}
                                            {(Object.keys(globalTravelData.preferences || {}).length > 3) && (
                                                <span className="text-xs text-gray-400 self-center">+ 更多</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Collapsible JSON */}
                            <div className="border-t border-gray-100 pt-4">
                                <button 
                                    onClick={() => setShowJson(!showJson)}
                                    className="flex items-center justify-between w-full text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium"
                                >
                                    <span>查看原始資料 (JSON)</span>
                                    {showJson ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                
                                {showJson && (
                                    <pre className="mt-3 bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-[11px] shadow-inner max-h-60 custom-scrollbar font-mono">
                                        {JSON.stringify(globalTravelData, null, 2)}
                                    </pre>
                                )}
                            </div>

                            <div className="pt-4 space-y-3">
                                <button
                                    onClick={handleFinalSubmit}
                                    disabled={isSubmitting}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl hover:bg-blue-700 transition-all font-black text-lg shadow-lg shadow-blue-100 disabled:bg-blue-300 active:scale-[0.98]"
                                >
                                    {isSubmitting ? '正在計算完美行程...' : '開始安排旅程'}
                                </button>
                                <button
                                    onClick={() => setCurrentStage(AppStage.BASIC as any)}
                                    className="w-full text-gray-400 py-2 hover:text-gray-600 transition-colors text-sm font-bold"
                                >
                                    返回修改
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Landing;