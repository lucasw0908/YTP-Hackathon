// src/types/travel.ts
// ==========================================
// 基礎型別定義
// ==========================================
export type TimeOfDay = '早上' | '中午' | '晚上';

// 定義系統的各個階段 (State Machine)
export enum AppStage {
  BASIC = 'BASIC',
  HOTEL = 'HOTEL',
  QUIZ = 'QUIZ',
  SUMMARY = 'SUMMARY'
}

// ==========================================
// 模組收集的資料介面
// ==========================================

// 1. 模組 A：基本行程設定
export interface BasicTravelData {
  /** 旅遊區域 (例: '雙北') */
  region: string;
  /** 抵達日期 (格式: YYYY-MM-DD) */
  startDate: string;
  /** 抵達時間 */
  startTime: TimeOfDay;
  /** 預計停留天數 */
  durationDays: number;
  /** 離開時間 */
  endTime: TimeOfDay;
}

// 2. 模組 B：住宿設定
export interface AccommodationData {
  /** 是否已經有確定/選擇的飯店 (true: 有, false: 需要 LLM 推薦) */
  hasHotel: boolean;
  /** 飯店名稱 (如果 hasHotel 為 true 才會有值) */
  hotelName: string;
}

// 飯店推薦 API 回傳的資料結構
export interface HotelRecommendation {
  id: number | string;
  name: string;
  /** 預算等級 (例: '$', '$$', '$$$') */
  priceLevel: string;
}

// 3. 模組 C：偏好問卷作答結果
/** 
 * 紀錄問卷的答案
 * Key 為 QuestionConfig 的 id (如 'q1')
 * Value 可以是單一字串 (單選) 或字串陣列 (多選)
 */
export type PreferenceAnswers = Record<string, string | string[]>;

// ==========================================
// 最終發送給 API / LLM 的總 Payload
// ==========================================
export interface TravelPlanPayload {
  basic?: BasicTravelData;
  accommodation?: AccommodationData;
  preferences?: PreferenceAnswers;
}