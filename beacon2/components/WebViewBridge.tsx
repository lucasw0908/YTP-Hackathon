import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { IBeacon } from '../types/t';

// ⚠️ 注意：開發階段請換成你電腦的 IP 與 Vite 預設 Port (通常是 5173)
// 確保手機跟電腦在同一個 WiFi 下
const WEB_URL = 'http://192.168.0.156:5173/map';
// const WEB_URL = 'http://10.1.161.136:5173/nav';

export interface WebViewBridgeRef {
  sendBeacons: (beacons: IBeacon[]) => void;
  sendGps: (gps: { lat: number; lng: number }) => void;
}

interface Props {
  onReady?: () => void;
}

const WebViewBridge = forwardRef<WebViewBridgeRef, Props>(({ onReady }, ref) => {
  const webviewRef = useRef<WebView>(null);
  const [isWebReady, setIsWebReady] = useState(false);
  const pendingRef = useRef<IBeacon[] | null>(null);

  // 封裝「傳送訊息給 Web」的邏輯
  function sendMessageToWeb(type: string, payload: any) {
    const message = JSON.stringify({ type, payload });
    // 透過觸發 CustomEvent，讓 Web 端的 React 可以用 addEventListener 監聽
    const script = `
      window.dispatchEvent(new CustomEvent('AppToWeb', { detail: ${message} }));
      true;
    `;
    webviewRef.current?.injectJavaScript(script);
  }

  useImperativeHandle(ref, () => ({
    sendBeacons(beacons: IBeacon[]) {
      if (!isWebReady || !webviewRef.current) {
        pendingRef.current = beacons; // Web 還沒準備好，先暫存
        return;
      }
      sendMessageToWeb('BEACON_UPDATE', beacons);
    },
    sendGps(gps: { lat: number; lng: number }) {
      if (!isWebReady || !webviewRef.current) return;
      sendMessageToWeb('GPS_UPDATE', gps);
    }
  }));

  // 接收來自 Web 的訊息
  function handleMessage(e: WebViewMessageEvent) {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      console.log('[App 收到 Web 訊息]:', data.type, data.payload);

      switch (data.type) {
        case 'WEB_READY':
          // 網頁端的 React 已經 Mount 完成！
          setIsWebReady(true);
          onReady?.();

          // 補發暫存的 Beacon 資料
          if (pendingRef.current) {
            sendMessageToWeb('BEACON_UPDATE', pendingRef.current);
            pendingRef.current = null;
          }
          break;

        case 'TEST_ACTION':
          // 測試 Web 呼叫 App
          console.log('網頁要求 App 執行測試動作:', data.payload);
          break;

        // 之後可以加入 'OPEN_CAMERA', 'FETCH_GPS' 等等...
      }
    } catch (err) {
      console.warn('解析 WebView 訊息失敗', err);
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: WEB_URL }}
        onMessage={handleMessage} // 監聽 Web 傳來的 postMessage
        style={styles.webview}
        // 允許網頁使用 console.log (除錯用)
        injectedJavaScript={`
          const consoleLog = (type, args) => window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CONSOLE', payload: { type, args } }));
          console.log = (...args) => consoleLog('log', args);
        `}
      />
    </View>
  );
});

export default WebViewBridge;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  webview: { flex: 1 },
});