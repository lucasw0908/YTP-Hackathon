// ─── Beacon ──────────────────────────────────────────────────────────────────

export interface IBeacon {
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  accuracy?: number; // 估算距離（公尺）
  id?: string;       // BLE peripheral MAC / id（來自 ble-manager）

  bid?: number;
  stationCode?: string;   // 站點代號，例如 "BL01"
  stationId?: string;     // 系統編號，例如 "019"
}

// ─── BLE Scanner ─────────────────────────────────────────────────────────────

export type ScanStatus =
  | '準備中...'
  | '掃描中...'
  | '模擬模式：已隨機生成資料'
  | string; // 允許自訂錯誤訊息