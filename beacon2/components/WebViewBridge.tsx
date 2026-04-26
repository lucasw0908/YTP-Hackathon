import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { IBeacon } from '../types/t';

// ⚠️ 注意：開發階段請換成你電腦的 IP 與 Vite 預設 Port (通常是 5173)
// 確保手機跟電腦在同一個 WiFi 下
// const WEB_URL = 'http://192.168.0.156:5173/map';
const WEB_URL = '192.168.0.156/nav';
// const WEB_URL = '192.168.0.156/login';

export interface WebViewBridgeRef {
  sendBeacons: (beacons: IBeacon[]) => void;
  sendGps: (gps: { lat: number; lng: number }) => void;
  reload: () => void;
}

interface Props {
  onReady?: () => void;
}


const WebViewBridge = forwardRef<WebViewBridgeRef, Props>(({ onReady }, ref) => {
  const webviewRef = useRef<WebView>(null);
  // ref 而非 state：避免 useImperativeHandle 的 stale closure 問題
  const isWebReadyRef = useRef(false);
  const pendingBeaconsRef = useRef<IBeacon[] | null>(null);
  const pendingGpsRef = useRef<{ lat: number; lng: number } | null>(null);

  function sendMessageToWeb(type: string, payload: any) {
    const message = JSON.stringify({ type, payload });
    const script = `
      window.dispatchEvent(new CustomEvent('AppToWeb', { detail: ${message} }));
      true;
    `;
    webviewRef.current?.injectJavaScript(script);
  }

  useImperativeHandle(ref, () => ({
    sendBeacons(beacons: IBeacon[]) {
      if (!isWebReadyRef.current || !webviewRef.current) {
        pendingBeaconsRef.current = beacons;
        return;
      }
      sendMessageToWeb('BEACON_UPDATE', beacons);
    },
    sendGps(gps: { lat: number; lng: number }) {
      if (!isWebReadyRef.current || !webviewRef.current) {
        pendingGpsRef.current = gps; // 暫存，等 WEB_READY 補發
        return;
      }
      sendMessageToWeb('GPS_UPDATE', gps);
    },
    reload: () => {
      // 呼叫實際 WebView 的重整方法
      webviewRef.current?.reload();
    }
  }));

  function handleMessage(e: WebViewMessageEvent) {
    try {
      const data = JSON.parse(e.nativeEvent.data);

      switch (data.type) {
        case 'WEB_READY':
          isWebReadyRef.current = true;
          onReady?.();

          // 補發暫存的 Beacon
          if (pendingBeaconsRef.current) {
            sendMessageToWeb('BEACON_UPDATE', pendingBeaconsRef.current);
            pendingBeaconsRef.current = null;
          }

          // 補發暫存的 GPS
          if (pendingGpsRef.current) {
            sendMessageToWeb('GPS_UPDATE', pendingGpsRef.current);
            pendingGpsRef.current = null;
          }

          break;

        case 'CONSOLE': {
          const level: string = data.payload?.level ?? 'log';
          const args: any[] = data.payload?.args ?? [];
          const fn = (console as any)[level] ?? console.log;
          fn('[WebView]', ...args);
          break;
        }

        case 'TEST_ACTION':
          console.log('網頁要求 App 執行測試動作:', data.payload);
          break;
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
        injectedJavaScript={`
          (function() {
            var rn = window.ReactNativeWebView;
            if (!rn) return;
            ['log','warn','error','info'].forEach(function(m) {
              console[m] = function() {
                try {
                  var args = Array.prototype.slice.call(arguments).map(function(a) {
                    try { return JSON.parse(JSON.stringify(a)); }
                    catch(e) { return typeof a + ': ' + String(a); }
                  });
                  rn.postMessage(JSON.stringify({ type: 'CONSOLE', payload: { level: m, args: args } }));
                } catch(e) {}
              };
            });
          })();
          true;
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