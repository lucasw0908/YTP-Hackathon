// src/App.tsx
import { useState } from 'react';
import BasicSetup from './components/BasicSetup';
import HotelSetup from './components/HotelSetup';
import PreferenceQuiz from './components/PreferenceQuiz';
import { submitTravelPlan } from './api/mockBackend';
import { AppStage, TravelPlanPayload, BasicTravelData, AccommodationData, PreferenceAnswers } from './types';


// 流程狀態列舉
const STAGES = {
  BASIC: 'BASIC',
  HOTEL: 'HOTEL',
  QUIZ: 'QUIZ',
  SUMMARY: 'SUMMARY'
};

function App() {
  // 使用 AppStage Enum
  const [currentStage, setCurrentStage] = useState<AppStage>(AppStage.BASIC);
  // 使用 TravelPlanPayload
  const [globalTravelData, setGlobalTravelData] = useState<TravelPlanPayload>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 參數加上型別
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
    await submitTravelPlan(globalTravelData);
    setIsSubmitting(false);
    alert("送出成功！LLM 正在產生您的客製化行程！");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex flex-col justify-center">
      <header className="max-w-xl mx-auto w-full text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">AI 客製化旅遊規劃</h1>
        <p className="text-gray-500 mt-2">告訴我們你的偏好，幫你安排最完美的捷運輕旅行</p>
      </header>

      {/* 狀態機切換模組 */}
      <main className="w-full">
        {currentStage === STAGES.BASIC && <BasicSetup onNext={handleBasicComplete} />}
        {currentStage === STAGES.HOTEL && <HotelSetup onNext={handleHotelComplete} />}
        {currentStage === STAGES.QUIZ && <PreferenceQuiz onComplete={handleQuizComplete} />}

        {/* 最終 Summary 模組 (可獨立抽離，此處直接撰寫) */}
        {currentStage === STAGES.SUMMARY && (
          <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-green-600 flex items-center">
              🎉 偏好收集完成！
            </h2>
            <p className="mb-4 text-gray-600">以下是即將發送給 LLM 進行運算的 JSON 資料結構：</p>

            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm shadow-inner max-h-96">
              {JSON.stringify(globalTravelData, null, 2)}
            </pre>

            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-bold disabled:bg-blue-300"
            >
              {isSubmitting ? 'LLM 運算中...' : '確認送出給 LLM'}
            </button>
            <button
              onClick={() => setCurrentStage(AppStage.BASIC)}
              className="w-full mt-2 text-gray-500 py-2 hover:bg-gray-100 rounded-lg transition"
            >
              重新測試填寫
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;