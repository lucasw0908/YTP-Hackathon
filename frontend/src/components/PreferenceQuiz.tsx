// src/components/PreferenceQuiz.tsx
import { useState } from 'react';
import { questionsConfig } from '../config/questionnaire';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { PreferenceAnswers } from '../types';

interface PreferenceQuizProps {
    onComplete: (data: PreferenceAnswers) => void;
}

export default function PreferenceQuiz({ onComplete }: PreferenceQuizProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<PreferenceAnswers>({});
    const [otherText, setOtherText] = useState('');

    const question = questionsConfig[currentStep];
    const isMultiple = question.type === 'multiple';
    const currentAnswer = answers[question.id] || (isMultiple ? [] : '');

    const handleSelect = (option: string) => {

        if (isMultiple) {
            const isSelected = currentAnswer.includes(option);
            const currentArray = currentAnswer as string[];
            let newAnswers;
            if (isSelected) {
                newAnswers = currentArray.filter((item) => item !== option);
            } else {
                if (question.maxSelect && currentArray.length >= question.maxSelect) return;
                newAnswers = [...currentArray, option];
            }
            setAnswers({ ...answers, [question.id]: newAnswers });
        } else {
            setAnswers({ ...answers, [question.id]: option });
            if (option !== '其他') setOtherText(''); // 清空其他輸入
        }
    };

    const handleNext = () => {
        // 簡單防呆檢查
        if (!currentAnswer || (isMultiple && currentAnswer.length === 0)) return alert("請至少選擇一項");
        if (currentAnswer === '其他' && !otherText) return alert("請填寫詳細內容");

        // 處理「其他」選項的值
        let finalValue = currentAnswer;
        if (currentAnswer === '其他' && otherText) {
            finalValue = `其他: ${otherText}`;
            setAnswers({ ...answers, [question.id]: finalValue });
        }

        console.log(`[Debug] 題目 ${question.id} 答案:`, finalValue);

        if (currentStep < questionsConfig.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            console.log("[Debug] 測驗結束，總結答案:", answers);
            onComplete(answers);
        }
    };
    return (
        // 1. 給定一個固定的最大高度（例如 max-h-[80vh] 或固定 600px）避免外層被撐破
        <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-md h-[600px] flex flex-col">

            {/* 進度條 (保持原樣) */}
            <div className="mb-6 flex items-center justify-between shrink-0">
                <span className="text-sm font-medium text-gray-500">
                    進度 {currentStep + 1} / {questionsConfig.length}
                </span>
                <div className="flex-1 ml-4 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / questionsConfig.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* 2. 標題與選項區塊：使用 flex-1 與 overflow-hidden 管理高度 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 shrink-0">{question.title}</h2>
                <p className="text-gray-500 mb-6 shrink-0">{question.desc}</p>

                {/* 3. 將滾動條限制在這裡：overflow-y-auto */}
                <div className="space-y-3 overflow-y-auto pr-2 pb-2 custom-scrollbar">
                    {question.options.map((option) => {
                        const isSelected = isMultiple ? currentAnswer.includes(option) : currentAnswer === option;
                        return (
                            <div key={option} className="flex flex-col">
                                <button
                                    onClick={() => handleSelect(option)}
                                    className={`w-full text-left p-4 rounded-lg border-2 flex items-center justify-between transition-all ${isSelected
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <span>{option}</span>
                                    {isSelected && <Check size={20} className="text-blue-500" />}
                                </button>

                                {/* 處理「其他」開放填空 */}
                                {question.hasOther && option === '其他' && isSelected && (
                                    <input
                                        type="text"
                                        value={otherText}
                                        onChange={(e) => setOtherText(e.target.value)}
                                        placeholder="請簡述您的需求..."
                                        className="mt-2 w-full border border-blue-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 animate-fadeIn"
                                        autoFocus
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 底部按鈕區 (保持原樣，加上 shrink-0 避免被擠壓) */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between shrink-0">
                <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    disabled={currentStep === 0}
                    className="flex items-center text-gray-500 disabled:opacity-30 hover:text-gray-800"
                >
                    <ArrowLeft size={20} className="mr-1" /> 上一步
                </button>
                <button
                    onClick={handleNext}
                    className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                    {currentStep === questionsConfig.length - 1 ? '完成測驗' : '下一題'} <ArrowRight size={20} className="ml-1" />
                </button>
            </div>
        </div>
    );
};