// src/types/questionnaire.ts
// 定義題型：單選或多選
export type QuestionType = 'single' | 'multiple';

// 單一題目的介面定義
export interface QuestionConfig {
  /** 題目唯一識別碼 (例: 'q1') */
  id: string;
  /** 題目主標題 */
  title: string;
  /** 題目副標題/說明 */
  desc: string;
  /** 題型 */
  type: QuestionType;
  /** 可供選擇的選項陣列 */
  options: string[];
  /** 若為多選題，最多可選幾項 (單選題不需要此屬性) */
  maxSelect?: number;
  /** 是否包含「其他(開放填空)」選項 */
  hasOther?: boolean;
}