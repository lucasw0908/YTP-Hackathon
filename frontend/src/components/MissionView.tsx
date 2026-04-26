import { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import IconMapper from './IconMapper';
import type { Task } from '../api/tasksApi';

interface MissionViewProps {
    task: Task;
    onComplete?: () => void;
}

export default function MissionView({ task, onComplete }: MissionViewProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;
        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // backend expects mission_description as query param according to its signature
            const url = new URL('/api/judge', window.location.origin);
            url.searchParams.append('mission_description', task.description);

            const res = await fetch(url.toString(), {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                throw new Error('Upload failed');
            }

            const data = await res.json();
            // Assuming the backend returns something like { success: boolean, detail: string } or similar
            // judge_mission returns something, let's assume it has success or pass
            const passed = data.is_success === true;
            
            setResult({
                success: passed,
                message: passed 
                    ? `驗證成功！任務已完成！`
                    : `驗證失敗：${data.reason || '照片不符合任務要求，請重試。'}`
            });

            if (passed && onComplete) {
                setTimeout(onComplete, 2000);
            }
        } catch (error) {
            console.error(error);
            setResult({
                success: false,
                message: '上傳或驗證過程中發生錯誤，請稍後再試。'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full w-full bg-gray-50 flex flex-col items-center justify-start pt-16 pb-20 px-4 overflow-y-auto">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                
                {/* 任務資訊 */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <IconMapper emoji="🎯" size={24} className="text-amber-500" />
                        <h2 className="text-xl font-black text-gray-800">{task.task_name}</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{task.location_name}</p>
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm leading-relaxed border border-blue-100">
                        {task.description}
                    </div>
                </div>

                {/* 上傳區塊 */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <IconMapper emoji="📸" /> 繳交完成證明
                    </h3>
                    
                    <input 
                        type="file" 
                        accept="image/jpeg, image/png" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />

                    {!preview ? (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer"
                        >
                            <Upload size={32} className="mb-2" />
                            <span className="font-medium">點擊上傳照片</span>
                            <span className="text-xs mt-1 text-gray-400">支援 JPG, PNG</span>
                        </button>
                    ) : (
                        <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                            <img src={preview} alt="Preview" className="w-full h-auto object-cover max-h-64" />
                            <button 
                                onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                                className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 backdrop-blur-sm"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {/* 結果顯示 */}
                {result && (
                    <div className={`p-4 rounded-xl flex items-start gap-3 ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {result.success ? <CheckCircle className="shrink-0 mt-0.5" size={18} /> : <XCircle className="shrink-0 mt-0.5" size={18} />}
                        <p className="text-sm font-bold">{result.message}</p>
                    </div>
                )}

                {/* 提交按鈕 */}
                <button
                    onClick={handleSubmit}
                    disabled={!file || loading || result?.success}
                    className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm
                        ${!file || result?.success
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                        }`}
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            驗證中...
                        </>
                    ) : (
                        '送出驗證'
                    )}
                </button>

            </div>
        </div>
    );
}
