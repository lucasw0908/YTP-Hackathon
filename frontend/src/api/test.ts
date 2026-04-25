// test.ts
import { getStationNameById, getDepartureTimes } from './metroApi';

async function runTests() {
    console.log("=== 測試開始 ===");

    // 測試 1: 測試代號轉站名
    console.log("\n--- 測試 1: getStationNameById ---");
    const testId = "BL11";
    const stationName = getStationNameById(testId);
    console.log(`代號 ${testId} 轉換結果:`, stationName); // 預期會印出: 頂埔

    const invalidId = "ZZ99";
    const invalidName = getStationNameById(invalidId);
    console.log(`代號 ${invalidId} 轉換結果:`, invalidName); // 預期會印出: null

    // 測試 2: 測試爬取 API
    console.log("\n--- 測試 2: getDepartureTimes ---");
    if (stationName) {
        console.log(`準備爬取 [${stationName}] 的到站時間...`);
        const departureInfo = await getDepartureTimes(stationName);
        console.log("API 回傳結果:", departureInfo);
    } else {
        console.log("因為找不到站名，跳過 API 測試。");
    }

    console.log("\n=== 測試結束 ===");
}

runTests();