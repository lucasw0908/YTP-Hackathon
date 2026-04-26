// BeaconScanner.ts

import { TaipeiMetroUtils } from '../utils/TaipeiMetroUtils';
import { MetroMappingUtils } from '../utils/MetroMappingUtils';

import { PermissionsAndroid, Platform } from 'react-native';
import BleManager, { type Peripheral } from 'react-native-ble-manager';
import * as Location from 'expo-location';
import type { IBeacon } from '../types/t';

// ─── 型別 ─────────────────────────────────────────────────────────────────────
interface TrackedBeacon extends IBeacon {
  lastSeen: number; // 用於判斷設備是否超時未見
}

interface ScannerOptions {
  targetUuid?: string;      // 指定要掃描的 iBeacon UUID
  staleThreshold?: number;  // 超過多久沒看見就移除 (毫秒)，預設 5000 (5秒)
}

// ─── iBeacon 廣播解析 ─────────────────────────────────────────────────────────

/**
 * 從 rawBytes 中尋找 iBeacon 模式 (Apple ID + iBeacon Type + Length)
 * Pattern: 4C 00 02 15 ...
 */
function parseIBeacon(bytes: number[]): { uuid: string; major: number; minor: number } | null {
  if (!bytes || bytes.length < 23) return null;

  // 遍歷搜尋 iBeacon 標頭
  for (let i = 0; i <= bytes.length - 23; i++) {
    if (
      bytes[i] === 0x4C && // Apple Company ID (Low)
      bytes[i + 1] === 0x00 && // Apple Company ID (High)
      bytes[i + 2] === 0x02 && // iBeacon Type
      bytes[i + 3] === 0x15    // iBeacon Length
    ) {
      const uuidBytes = bytes.slice(i + 4, i + 20);
      const uuid = uuidBytes
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

      const major = (bytes[i + 20] << 8) | bytes[i + 21];
      const minor = (bytes[i + 22] << 8) | bytes[i + 23];

      return { uuid, major, minor };
    }
  }
  return null;
}

export function parsePeripheralAsIBeacon(peripheral: Peripheral): any | null {
  const { id, rssi, advertising } = peripheral;

  // 統一從 rawData 或 manufacturerRawData 取得位元組
  const rawBytes: number[] =
    (advertising as any)?.rawData?.bytes ||
    (advertising as any)?.manufacturerRawData?.bytes ||
    [];

  const parsed = parseIBeacon(rawBytes);
  if (!parsed) return null;

  // 距離估算 (TX_POWER 通常在 iBeacon 封包最後一碼，這裡簡化使用固定值)
  const TX_POWER = -59;
  const accuracy = rssi === 0 ? -1 : Math.pow(10, (TX_POWER - rssi) / 20);

  return {
    ...parsed,
    rssi,
    accuracy: parseFloat(accuracy.toFixed(2)),
    id
  };
}

// ─── 權限 ────────────────────────────────────────────────────────────────────

/**
 * 請求 Android BLE 所需的所有權限。
 * Android 12+（API 31+）：BLUETOOTH_SCAN + BLUETOOTH_CONNECT
 * Android 11 以下：ACCESS_FINE_LOCATION
 * 同時也確認 Location Services 是否開啟（Android 掃描 BLE 的隱性需求）。
 *
 * @returns `true` 代表所有必要權限均已取得
 */
export async function requestAndroidPermissions(): Promise<{ granted: boolean; message?: string }> {
  const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);

  if (apiLevel >= 31) {
    // Android 12+
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    const allGranted = Object.values(results).every(
      (r) => r === PermissionsAndroid.RESULTS.GRANTED,
    );
    if (!allGranted) {
      return { granted: false, message: '權限不足：請允許藍牙與定位權限' };
    }
  } else {
    // Android < 12
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { granted: false, message: '權限不足：請允許定位權限以掃描 Beacon' };
    }
  }

  // 確認 GPS/Location Services 是否開啟
  const locationEnabled = await Location.hasServicesEnabledAsync();
  if (!locationEnabled) {
    // 不擋掃描，但給出提示（Android 11 以下若 GPS 關閉將掃描不到）
    return { granted: true, message: '注意：GPS 服務未開啟，掃描可能受影響' };
  }

  return { granted: true };
}

// ─── Scanner 類別 ─────────────────────────────────────────────────────────────

type OnBeaconsCallback = (beacons: IBeacon[]) => void;

export class BeaconScanner {
  private discoverListener?: any;
  private stopListener?: any;
  private patrolTimer?: ReturnType<typeof setInterval>; // 新增：獨立巡邏計時器
  private onBeacons: OnBeaconsCallback;
  private beaconMap: Map<string, TrackedBeacon> = new Map();
  private isRunning = false;

  // 配置設定
  private targetUuid?: string;
  private staleThreshold: number;

  constructor(onBeacons: OnBeaconsCallback, options?: ScannerOptions) {
    this.onBeacons = onBeacons;
    this.targetUuid = options?.targetUuid?.toLowerCase();
    // 預設縮短為 5000 毫秒 (5秒)，符合快速出現與消失的需求
    this.staleThreshold = options?.staleThreshold || 3000;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    await BleManager.start({ showAlert: false });

    // 1. 發現裝置處理 (出現極快，因為持續掃描)
    this.discoverListener = BleManager.onDiscoverPeripheral((peripheral) => {
      const beacon = parsePeripheralAsIBeacon(peripheral);

      if (beacon) {
        // 配置檢查：若有設定 targetUuid 則進行過濾
        if (this.targetUuid && beacon.uuid.toLowerCase() !== this.targetUuid) {
          return;
        }

        const key = `${beacon.uuid}-${beacon.major}-${beacon.minor}`;
        const bid = TaipeiMetroUtils.decryptionID(beacon.major, beacon.minor);


        const stationCode = MetroMappingUtils.taipeiBeacon2StationId(bid);
        const stationId = stationCode ? MetroMappingUtils.taipeiStationCodeMap[stationCode] : undefined;

        this.beaconMap.set(key, {
          ...beacon,
          bid,
          stationCode,
          stationId,
          lastSeen: Date.now(), // 更新最後看見時間
        });

        this.emitBeacons();
      }
    });

    // 2. 啟動獨立巡邏計時器：每 1 秒檢查一次是否有設備過期 (消失極快)
    this.patrolTimer = setInterval(() => {
      this.cleanupStaleBeacons();
    }, 1000);

    // 3. 掃描停止處理 (僅作為意外防護，持續掃描模式下通常不會被呼叫)
    this.stopListener = BleManager.onStopScan(() => {
      if (this.isRunning) {
        this.doScan(); // 重新啟動掃描
      }
    });

    await this.doScan();
  }

  /** 清理超過時間沒更新的 Beacon */
  private cleanupStaleBeacons(): void {
    const now = Date.now();
    let hasChanged = false;

    for (const [key, beacon] of this.beaconMap.entries()) {
      if (now - beacon.lastSeen > this.staleThreshold) {
        this.beaconMap.delete(key);
        hasChanged = true;
      }
    }

    if (hasChanged) {
      this.emitBeacons();
    }
  }

  /** 將 Map 轉換為 Array 推送回 UI */
  private emitBeacons(): void {
    const list = Array.from(this.beaconMap.values()).map(({ lastSeen, ...rest }) => rest);
    this.onBeacons(list);
  }

  private async doScan(): Promise<void> {
    try {
      await BleManager.scan({
        serviceUUIDs: [],
        seconds: 0,            // 修改為 0，代表不限時持續掃描，避開重啟延遲
        allowDuplicates: true,
        scanningMode: 2,
      } as any);
    } catch (e) {
      console.warn('[BeaconScanner] scan error:', e);
    }
  }

  stop(): void {
    this.isRunning = false;

    // 清除計時器與監聽器
    if (this.patrolTimer) clearInterval(this.patrolTimer);

    BleManager.stopScan();
    if (this.discoverListener) this.discoverListener.remove();
    if (this.stopListener) this.stopListener.remove();
    this.beaconMap.clear();
    this.onBeacons([]); // 停止時清空列表
  }
}