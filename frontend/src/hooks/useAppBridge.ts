import { useEffect, useCallback } from 'react';

declare global {
    interface Window {
        ReactNativeWebView?: {
            postMessage: (message: string) => void;
        };
    }
}

// 定義一下你在 App 端設定的型別 (為了方便開發，建議兩邊欄位對齊)
export interface WebBeacon {
    uuid: string;
    major: number;
    minor: number;
    rssi: number;
    bid?: number;
    stationCode?: string;
    stationId?: string;
}

export function useAppBridge(onMessage: (type: string, payload: any) => void) {

    // 傳送訊息給 App
    const sendMessageToApp = useCallback((type: string, payload: any = {}) => {
        // 檢查是否在 React Native WebView 環境中
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
        } else {
            console.warn('[Web 警告] 找不到 App 環境，模擬傳送:', type, payload);
        }
    }, []);

    useEffect(() => {
        // 監聽來自 App 的訊息
        const handleNativeMessage = (event: Event) => {
            // 轉型為 CustomEvent 以取得 detail
            const customEvent = event as CustomEvent;
            if (customEvent.detail) {
                const { type, payload } = customEvent.detail;
                onMessage(type, payload);
            }
        };

        window.addEventListener('AppToWeb', handleNativeMessage);

        // 🌟 關鍵：當這個 Hook 掛載完成，主動告訴 App「Web準備好了」
        sendMessageToApp('WEB_READY');

        return () => {
            window.removeEventListener('AppToWeb', handleNativeMessage);
        };
    }, [onMessage, sendMessageToApp]);

    return { sendMessageToApp };
}