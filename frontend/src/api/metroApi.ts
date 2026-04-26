// metroApi.ts
// can be tested by npm tsx test.ts

// 假設你的環境支援直接 import JSON，如果報錯可以在 tsconfig.json 中開啟 "resolveJsonModule": true
import lineInfoData from '../assets/line_info.json';

// ==========================================
// 1. 定義資料的型別 (Interfaces)
// ==========================================

interface StationName {
    Zh_tw: string;
    En: string;
}

interface Station {
    Sequence: number;
    StationID: string;
    StationName: StationName;
    CumulativeDistance: number;
}

interface LineInfo {
    LineNo: string;
    LineID: string;
    Stations: Station[];
    SrcUpdateTime: string;
    UpdateTime: string;
    VersionID: number;
}

export interface DepartureInfo {
    depart: string;
    destination: string;
    time: string;
}

// 將匯入的 JSON 資料斷言為我們定義的型別
const metroData: LineInfo[] = lineInfoData as LineInfo[];

// ==========================================
// 2. 實作功能 (Functions)
// ==========================================

/**
 * 根據車站代號 (StationID) 取得車站中文名稱
 * @param stationId 捷運站代號 (例如: "BL01")
 * @returns 車站中文名稱 (例如: "頂埔")，若找不到則回傳 null
 */
export function getStationNameById(stationId: string): string | null {
    // 遍歷所有路線
    for (const line of metroData) {
        // 在該路線的車站列表中尋找符合的代號
        const targetStation = line.Stations.find(station => station.StationID === stationId);

        if (targetStation) {
            return targetStation.StationName.Zh_tw;
        }
    }

    // 如果全部找完都沒有符合的，回傳 null
    return null;
}

import * as cheerio from 'cheerio';

/*
[
    {
        "depart": String,
        "destination": String,
        "time": String
    },...
]
*/

export async function getDepartureTimes(stationName: string): Promise<DepartureInfo[]> {
    // const url = `https://www.opendata.vip/en/metro/departure/${encodeURIComponent(stationName)}`;
    const url = `http://127.0.0.1:5000/${encodeURIComponent(stationName)}`
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        console.log(response)
        if (!response.ok) throw new Error(`HTTP ${response.status}`);


        // 因為是 HTML，所以用 .text() 而不是 .json()
        const html = await response.text();

        // 載入 HTML 準備解析
        const $ = cheerio.load(html);
        const departureList: DepartureInfo[] = [];

        // 精準定位：找 metroBlock 裡面的 row，然後迭代每一個 col-md-4
        $('.metroBlock .row .col-md-4').each((_, element) => {
            // 在這個 col 裡面尋找對應的文字
            const depart = $(element).find('.departStation').text().trim();
            const destination = $(element).find('.destinationStation').text().trim();

            // 時間欄位優先抓 label 裡面的字
            let time = $(element).find('.countDown label').text().trim();

            // 【保險機制】如果網頁還沒跑 JS 導致 label 沒字，我們直接抓 data-start 的屬性值
            if (!time) {
                time = $(element).find('.countDown').attr('data-start')?.trim() || '未知時間';
            }

            // 只要有出發站和終點站，就推進陣列裡
            if (depart && destination) {
                departureList.push({
                    depart,
                    destination,
                    time
                });
            }
        });

        return departureList;
    } catch (error) {
        console.error(`取得 ${stationName} 失敗:`, error);
        return [];
    }
}