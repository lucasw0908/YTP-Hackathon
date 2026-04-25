import os
import json
import logging
import re
from typing import Optional

import requests
from bs4 import BeautifulSoup

from ..config import Settings


log = logging.getLogger(__name__)


def get_hotels_info(district):
    base_url = "https://stest.taiwanstay.net.tw/TSA/web_page/"
    target_url = base_url + "TSA020100.jsp"

    session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": base_url + "TSA010100.jsp"
    }

    # 初始 payload，預設 PGA01 為第 1 頁
    payload = {
        "Method": "true",
        "sendurl": "TSA020100",
        "hoci_city1": "臺北市",
        "hoci_area1": district,
        "PGA01": "1" 
    }

    output = []

    # --- 內部函數：用來解析單一頁面中的所有旅館卡片 ---
    def parse_page(page_soup: BeautifulSoup):
        page_output = []
        hotel_cards = page_soup.find_all('div', class_='card mb-3 px-0')
        
        for card in hotel_cards:
            # 1 & 2. 旅店名稱與 URL
            title_tag = card.find('a', class_='searchtitle')
            if title_tag:
                name = title_tag.get_text(strip=True)
                raw_href = title_tag.get('href')
                name_url = (base_url + raw_href) if isinstance(raw_href, str) else None
            else:
                name = None
                name_url = None

            # 3. 地址
            address_tag = card.find('p', class_='searchtext mb-2')
            address = address_tag.get_text(strip=True) if address_tag else None

            # 4. Tags
            tag_elements = card.find_all('a', class_='btnmarker')
            tags_list = [tag.get_text(strip=True) for tag in tag_elements] if tag_elements else None

            # 5. 官網連結
            website_tag = card.find('a', class_='btnreserve')
            official_website = website_tag.get('href') if website_tag else None

            page_output.append({
                "name": name,
                "name_url": name_url,
                "address": address,
                "tags": tags_list,
                "official_website": official_website
            })
        return page_output


    # --- 第 1 步：發送第一次請求，獲取第 1 頁資料與總頁數/總筆數 ---
    log.debug(f"正在搜尋 [{district}] 的旅館資訊...")
    response = session.post(target_url, data=payload, headers=headers)
    
    if response.status_code != 200:
        log.debug("請求失敗！")
        return None

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # 尋找總筆數
    expected_total_items = 0
    span_tag = soup.find('span', class_='input-group-text')
    if span_tag:
        span_text = span_tag.get_text(strip=True)
        # 利用正規表達式抓取 "共XX筆" 中的數字
        match = re.search(r'共(\d+)筆', span_text)
        if match:
            expected_total_items = int(match.group(1))
            log.debug(f"網頁顯示總共有：{expected_total_items} 筆資料。")

    # 尋找總頁數
    max_page = 1
    select_tag = soup.find('select', id='PGA01')
    if select_tag:
        options = select_tag.find_all('option')
        if options:
            # 取得最後一個 option 的 value
            last_value = options[-1].get('value')
            # 確保 last_value 是字串且由數字組成，再轉型為 int
            if isinstance(last_value, str) and last_value.isdigit():
                max_page = int(last_value)
            
    log.debug(f"共分為 {max_page} 頁。")
    log.debug(f"已完成爬取第 1 / {max_page} 頁...")

    # 處理並儲存第 1 頁的資料
    output.extend(parse_page(soup))


    # --- 第 2 步：透過迴圈抓取第 2 頁到最後一頁 ---
    for page in range(2, max_page + 1):
        log.debug(f"正在爬取第 {page} / {max_page} 頁...")
        
        # 更新 Payload 中的頁碼
        payload["PGA01"] = str(page)
        
        res = session.post(target_url, data=payload, headers=headers)
        if res.status_code == 200:
            page_soup = BeautifulSoup(res.text, 'html.parser')
            output.extend(parse_page(page_soup))
            
        # 禮貌性延遲，避免對目標伺服器造成過大壓力而被阻擋
        # time.sleep(1) 

    # 最終驗證比對
    if expected_total_items > 0:
        if len(output) > expected_total_items:
            log.debug(f"資料筆數核對無誤！(共 {len(output)} 筆)")
        else:
            log.debug(f"⚠️ 警告：爬取的筆數 ({len(output)}) 與網頁顯示的總筆數 ({expected_total_items}) 不符！")

    return output

def get_all_hotels():
    return get_hotels_info("")

def save_hotels_to_json(hotels, settings: Settings):
    with open(os.path.join(settings.BASEDIR, "data", "hotel.json"), 'w', encoding='utf-8') as file:
        json.dump(hotels, file, ensure_ascii=False, indent=4)

def load_hotels_from_json(settings: Settings):
    try:
        with open(os.path.join(settings.BASEDIR, "data", "hotel.json"), 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        return None


def find_hotel(keyword: str, settings: Settings):
    # 嘗試載入旅館資料，如果檔案不存在則給予提示
    
    hotels: Optional[list[dict]] = load_hotels_from_json(settings)
    if hotels is None:
        hotels = get_all_hotels()
        save_hotels_to_json(hotels, settings)
        log.debug("找不到 data/hotels.json，已經先執行爬蟲並儲存資料！")

    if hotels is None:
        return None

    matched_hotels = []
    
    # 確保 keyword 存在且是字串
    if not keyword or not isinstance(keyword, str):
        return matched_hotels

    for hotel in hotels:
        # 取得 name 和 address。如果原本是 None，就把它轉換成空字串 "" 方便比對
        name = hotel.get("name") or ""
        address = hotel.get("address") or ""
        
        # 條件 1：檢查 Name (A contain B or B contain A)
        # 注意：必須加上 name != "" 的判斷，否則空的 name 會被判定為包含在 keyword 裡面 ( "" in keyword 永遠為 True)
        match_name = (keyword in name) or (name != "" and name in keyword)
        
        # 條件 2：檢查 Address (A contain B or B contain A)
        match_address = (keyword in address) or (address != "" and address in keyword)
        
        # 只要名稱或地址有任何一個符合條件，就加入結果清單
        if match_name or match_address:
            matched_hotels.append(hotel)
            
    return matched_hotels 

# for debug
# if __name__ == "__main__":
    # 測試士林區
    # results = get_hotels_info("士林區")
    
    # results = get_all_hotels()

    # if results:
    #     log.debug(f"\n爬取完成！總共抓到 {len(results)} 筆旅館資料。\n")
    #     # 印出最後一筆資料確認是否成功爬到最後一頁
    #     log.debug("最後一筆資料範例：")
    #     log.debug(results[-1])

    # save_hotels_to_json(results, "data", "hotels.json")
    # finded_hotels = find_hotel("士林區")
    # if finded_hotels is None:
    #     log.debug("找不到符合關鍵字的旅館資料！")
    # if isinstance(finded_hotels, list):
    #     log.debug(f"找到 {len(finded_hotels)} 筆符合關鍵字的旅館資料！")
    #     log.debug(finded_hotels)
    # else:
    #     log.debug(f"找到符合關鍵字的旅館資料！")
    #     log.debug(finded_hotels)