import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  Platform,
  TouchableOpacity,
} from 'react-native';

import type { IBeacon, ScanStatus } from './types/t';
import {
  BeaconScanner,
  requestAndroidPermissions,
} from './services/BeaconScanner';

// import { sendBeaconsToBackend } from './services/BackendService';
import WebViewBridge, { type WebViewBridgeRef } from './components/WebViewBridge';

// ─── 模擬資料產生器（無硬體時的測試模式） ───────────────────────────────────────
const BEACON_UUID = '123e4567-e89b-12d3-a456-426614174000';

function generateMockBeacons(): IBeacon[] {
  const count = Math.floor(Math.random() * 3) + 1;
  return Array.from({ length: count }, (_, i) => ({
    uuid: BEACON_UUID,
    major: Math.floor(Math.random() * 10) + 1,
    minor: Math.floor(Math.random() * 100) + 1,
    rssi: -1 * (Math.floor(Math.random() * 40) + 50),
    accuracy: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
  }));
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [beacons, setBeacons] = useState<IBeacon[]>([]);
  const [status, setStatus] = useState<ScanStatus>('準備中...');
  const [isMockMode, setIsMockMode] = useState(false);

  const [gpsDeBug, setGpsDeBug] = useState("");

  const webBridgeRef = useRef<WebViewBridgeRef>(null);
  const scannerRef = useRef<BeaconScanner | null>(null);

  // ── 統一的資料分發：更新 state、推送 WebView、送後端 ──
  const dispatchBeacons = useCallback((data: IBeacon[]) => {
    setBeacons(data);
    webBridgeRef.current?.sendBeacons(data);
    // sendBeaconsToBackend(data);
  }, []);

  // ── 模擬模式：手動產生一筆隨機資料 ──
  const runMockScan = useCallback(() => {
    setStatus('模擬模式：已隨機生成資料');
    dispatchBeacons(generateMockBeacons());
  }, [dispatchBeacons]);

  // ── 啟動真實掃描 ──
  const startRealScanner = useCallback(() => {
    // 若已有舊的 scanner，先停掉
    scannerRef.current?.stop();

    const scanner = new BeaconScanner((detected) => {
      dispatchBeacons(detected);
    });
    scannerRef.current = scanner;
    scanner.start().catch((e) => {
      setStatus('啟動失敗: ' + (e as Error).message);
    });
    setStatus('掃描中...');
  }, [dispatchBeacons]);

  // ── 初始化：請求權限 → 決定模式 ──
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (Platform.OS === 'android') {
        const { granted, message } = await requestAndroidPermissions();

        if (cancelled) return;

        if (!granted) {
          setStatus(message ?? '權限不足');
          setIsMockMode(true);
          return;
        }
        if (message) {
          // 取得權限但有警告（如 GPS 未開啟）
          setStatus(message);
        }
      }

      // 嘗試初始化 BleManager，若模組不存在（Expo Go 等環境）則退回模擬模式
      try {
        startRealScanner();
      } catch {
        if (!cancelled) {
          setIsMockMode(true);
          setStatus('模擬模式：BLE 模組不可用');
        }
      }
    })();

    return () => {
      cancelled = true;
      scannerRef.current?.stop();
    };
  }, []); // 只在 mount 時執行一次

  // ── 手動刷新按鈕 ──
  const handleRefresh = useCallback(() => {
    if (isMockMode) {
      runMockScan();
    } else {
      // 重新啟動掃描器（會先 stop 再 start）
      startRealScanner();
    }
  }, [isMockMode, runMockScan, startRealScanner]);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      // 1. 請求前景定位權限
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStatus('GPS 權限被拒絕');
        return;
      }

      // 2. 先立刻取一次目前位置（不依賴移動才觸發）
      try {
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const initCoords = {
          lat: initial.coords.latitude,
          lng: initial.coords.longitude,
        };
        webBridgeRef.current?.sendGps(initCoords);
        setGpsDeBug(`${initCoords.lat}-${initCoords.lng}`);
      } catch (_) { /* 初始取得失敗不影響後續 watch */ }

      // 3. 持續監聽位置變化
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 2,
        },
        (location) => {
          const coords = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };
          webBridgeRef.current?.sendGps(coords);
          setGpsDeBug(`${coords.lat}-${coords.lng}`);
        }
      );
    })();

    // 清除監聽器
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // ── 強制重整 WebView ──
  const handleReloadWebView = useCallback(() => {
    // 呼叫 WebViewBridge 暴露出來的 reload 方法
    webBridgeRef.current?.reload?.();
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* 上半部：原生監控區 */}
      <View style={styles.nativeArea}>
        <Text style={styles.header}>
          系統狀態：<Text style={styles.statusText}>{status}</Text>
          {"\n"}
          GPS：<Text style={styles.statusText}>{gpsDeBug}</Text>
        </Text>

        <View style={styles.listContainer}>
          <FlatList
            data={beacons}
            keyExtractor={(item) => `${item.major}-${item.minor}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.item}>
                {/* 顯示車站代碼與系統 ID */}
                <Text style={styles.itemTitle}>
                  {item.stationCode ? `🚉 ${item.stationCode}` : '❓ 未知站點'}
                  {item.stationId ? ` (${item.stationId})` : ''}
                </Text>
                {/* 顯示解密出的 BID */}
                {/* 
                <Text style={styles.itemSubtitle}>
                  BID: {item.bid !== undefined && item.bid >= 0 ? item.bid : '無效'}
                </Text>

                <Text style={styles.itemSubtitle}>
                  M: {item.major} | m: {item.minor}
                </Text>
                <Text style={styles.itemSubtitle}>
                  信號: {item.rssi} dBm
                </Text> 
                */}
              </View>
            )}

            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {isMockMode ? '點擊下方刷新以產生模擬資料' : '掃描中，等待附近 Beacon...'}
              </Text>
            }
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleRefresh} activeOpacity={0.75}>
            <Text style={styles.buttonText}>
              {isMockMode ? '🎲 模擬資料' : '🔄 重新掃描'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleReloadWebView} activeOpacity={0.75}>
            <Text style={styles.buttonText}>
              🌐 重整網頁
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 下半部：WebView */}
      <WebViewBridge ref={webBridgeRef} />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },

  // ── 原生區塊 ──
  nativeArea: {
    height: 120,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  statusText: { color: '#007AFF', fontWeight: 'normal' },

  listContainer: { flex: 1, marginVertical: 8 },
  item: {
    padding: 0,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    borderRadius: 8,
    minWidth: 110,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  itemTitle: { fontSize: 13, fontWeight: 'bold', color: '#212529' },
  itemSubtitle: { fontSize: 11, color: '#6c757d', marginTop: 2 },
  emptyText: { color: '#adb5bd', fontSize: 13, alignSelf: 'center', marginTop: 10 },

  // ── 按鈕 ──
  button: {
    marginTop: 'auto',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 0,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 'auto',
    justifyContent: 'space-between',
    gap: 10, // 如果你的 RN 版本較舊不支援 gap，可以在按鈕加上 marginHorizontal
  },
  primaryButton: {
    backgroundColor: '#007AFF', // 原本的藍色
  },
  secondaryButton: {
    backgroundColor: '#34C759', // 綠色 (用來區分重整網頁)
  },
});