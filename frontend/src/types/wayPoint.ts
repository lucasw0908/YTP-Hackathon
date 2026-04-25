// ─── 基礎枚舉 ───────────────────────────────────────────────

export type TransportMode = 'walk' | 'bike' | 'metro';

/** 此點「之後」用哪種定位方式 */
export type PositioningMode = 'gps' | 'beacon';

/** 這個節點在路程中扮演的角色 */
export type WaypointRole =
    | 'waypoint'    // 普通轉折點，沿路走就好
    | 'transition'  // 交通工具切換點 → 觸發 UI 提示
    | 'transfer'    // 捷運換乘點（仍在站內，仍用 beacon）
    | 'destination'; // 終點 or 任務打卡點

// ─── 共用基底 ────────────────────────────────────────────────

export interface WaypointBase {
    /** [lng, lat]，GeoJSON 慣例，轉 Leaflet 時記得反轉 */
    coord: [number, number];
    /** 此點「之後」的交通模式 */
    mode: TransportMode;
    role: WaypointRole;
    /** 此點「之後」的定位方式 */
    positioning: PositioningMode;
    /** UI 顯示給使用者的提示文字（transition / transfer / destination 必填） */
    instruction?: string;
}

// ─── 各 Role 的型別 ──────────────────────────────────────────

/** 步行 / 騎車路徑上的普通點或終點 */
export interface SurfaceWaypoint extends WaypointBase {
    mode: 'walk' | 'bike';
    role: 'waypoint' | 'destination';
    positioning: 'gps';
}

/**
 * 交通工具切換點
 * 放在「站口」或「Ubike 取車點」等實際切換發生的位置
 * mode / positioning 描述切換「之後」的狀態
 */
export interface TransitionWaypoint extends WaypointBase {
    role: 'transition';
    // mode      → 切換後的交通方式
    // positioning → 切換後的定位方式
    instruction: string;      // transition 必須有提示文字
    station?: string;         // 若進/出捷運，填入站名
    stationCode?: string;     // 例如 "BR08"，用於 beacon 比對閥值
}

/** 捷運系統內的普通站點 */
export interface MetroWaypoint extends WaypointBase {
    mode: 'metro';
    role: 'waypoint' | 'destination';
    positioning: 'beacon';
    station: string;          // 顯示站名，例如 "港墘"
    stationCode?: string;     // beacon 比對用，例如 "BR08"
    line?: string;            // 線路代碼，例如 "BR"
}

/**
 * 捷運換乘點
 * 仍在站內 → beacon 定位
 * 邏輯上是一個 MetroWaypoint，但多了換乘資訊
 */
export interface MetroTransferWaypoint extends WaypointBase {
    mode: 'metro';
    role: 'transfer';
    positioning: 'beacon';
    instruction: string;      // 例如 "請前往板南線月台"
    station: string;
    stationCode?: string;
    fromLine: string;         // 例如 "BR"
    toLine: string;           // 例如 "BL"
}

// ─── 聯合型別 ────────────────────────────────────────────────

export type Waypoint =
    | SurfaceWaypoint
    | TransitionWaypoint
    | MetroWaypoint
    | MetroTransferWaypoint;

export interface Route {
    id: string;
    waypoints: Waypoint[];
    totalDistanceMeters?: number;
    estimatedDurationSeconds?: number;
}
