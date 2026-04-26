// src/config/questionnaire.ts
import { QuestionConfig } from '../types';

export const questionsConfig: QuestionConfig[] = [
    {
        id: "q1",
        title: "這次旅行的主要旅伴是誰？",
        desc: "這將幫助我們為您安排合適的行程體力負荷與設施",
        type: "single",
        options: ["獨旅", "情侶/夫妻", "朋友群體", "親子(帶小孩)", "帶長輩"]
    },
    {
        id: "q2",
        title: "您對於這次旅行的預算等級偏好？",
        desc: "決定餐飲、購物商圈與付費展演的推薦",
        type: "single",
        options: ["小資窮遊(高CP值)", "中等預算(舒適)", "奢華享受(無預算上限)"]
    },
    {
        id: "q3",
        title: "是否有任何飲食限制？",
        desc: "確保為您推薦的夜市或餐廳不會踩雷",
        type: "single",
        hasOther: true, // 開放填空標記
        options: ["無限制", "素食/鍋邊素", "不吃牛", "海鮮過敏", "其他"]
    },
    {
        id: "q4",
        title: "您偏好的一天行程緊湊度？",
        desc: "決定一天要安排幾個景點",
        type: "single",
        options: ["漫遊放鬆(1-2個)", "充實適中(3-4個)", "行軍打卡(5個以上)"]
    },
    {
        id: "q5",
        title: "您喜歡的室內外行程比例？",
        desc: "依據天氣或個人喜好決定場域屬性",
        type: "single",
        options: ["全室內(吹冷氣/避雨)", "室內外平均交錯", "全室外(擁抱自然/街景)"]
    },
    {
        id: "q6",
        title: "您偏好的景點時代氛圍？",
        desc: "決定景點的文化調性",
        type: "single",
        options: ["懷舊復古(老街/古蹟)", "新創現代(摩登/潮流)", "兩者皆可(對比體驗)"]
    },
    {
        id: "q7",
        title: "白天的主要活動，您最想體驗什麼？",
        desc: "請選擇 1-2 項白天的核心行程",
        type: "multiple",
        maxSelect: 2,
        options: ["商圈購物", "市集展演", "文青散策(咖啡廳/巷弄)", "親子體驗(手作/樂園)", "秘境探索(捷運可達之隱藏景點)"]
    },
    {
        id: "q8",
        title: "夜間生活，您有什麼特別的安排？",
        desc: "請選擇 1-2 項晚上的行程亮點",
        type: "multiple",
        maxSelect: 2,
        options: ["夜間美食(夜市/街邊小吃)", "演唱會/展演活動", "微醺夜生活(酒吧/餐酒館)", "夜景散步"]
    },
    {
        id: "q9",
        title: "這次旅行，您最不能妥協的 1 個絕對亮點是？",
        desc: "當行程衝突時，我們將以此作為最高指導原則",
        type: "single",
        options: ["吃爆在地美食", "買到手軟", "拍出完美美照", "深度文化體驗", "徹底放鬆身心"]
    }
];