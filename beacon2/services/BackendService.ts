import type { IBeacon } from '../types/t';

const BACKEND_URL = 'https://your-api.com/update-location';
const USER_ID = 'user_123';

/**
 * 將偵測到的 beacon 清單送到後端。
 * 清單為空時直接返回，不發送請求。
 */
export async function sendBeaconsToBackend(beacons: IBeacon[]): Promise<void> {
  if (beacons.length === 0) return;

  try {
    await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: USER_ID,
        beacons: beacons.map(({ major, minor, rssi }) => ({ major, minor, rssi })),
      }),
    });
  } catch (error) {
    // 網路錯誤不中斷主流程，僅 log
    console.warn('[BackendService] 傳送失敗:', error);
  }
}