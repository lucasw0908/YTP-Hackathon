# # requirements:
# # pip install requests
# # pip install bs4

# import requests
# from bs4 import BeautifulSoup
# # from bs4.element import Tag
# # import urllib.parse
# # import time
# # import random

# def get_hotels_info(district):
#     base_url = "https://stest.taiwanstay.net.tw/TSA/web_page/"
#     target_url = base_url + "TSA020100.jsp"

#     session = requests.Session()
#     headers = {
#         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
#         "Referer": base_url + "TSA010100.jsp"
#     }

#     payload = {
#         "Method": "true",
#         "sendurl": "TSA020100",
#         "hoci_city1": "臺北市",
#         "hoci_area1": district,
#     }

#     response = session.post(target_url, data=payload, headers=headers)
#     output = []

#     if response.status_code == 200:
#         soup = BeautifulSoup(response.text, 'html.parser')
#         hotels = soup.find_all('a', class_='searchtitle')

#         for hotel in hotels:
#             name = hotel.get_text(strip=True)
#             hotel_href = hotel.get('href')
#             if isinstance(hotel_href, str):
#                 official_link = base_url + hotel_href
#             else:
#                 official_link = base_url # 或給個預設值            
#             # 去 Tripadvisor 找訂房連結
#             # print(f"正在比價: {name}...")
#             # booking_link = tripadvisor_search(name)
#             # print(f"tripadvisor_output: {booking_link} \n")
            
#             # output += f"飯店名稱: {name}\n"
#             # output += f"官方詳細介紹: {official_link}\n"

#             output.append({
#                 "name": name,
#                 "official_link": official_link,
#             })

#             # if booking_link:
#             #     output += f"Tripadvisor 訂房連結: {booking_link}\n"
#             # else:
#             #     output += "Tripadvisor 訂房連結: 未找到匹配結果\n"
#             # output += "-" * 30 + "\n\n"
            
#             # time.sleep(0.5) 
#     else:
#         return None

#     return output



# # for debug
# # if __name__ == "__main__":
# #     # 測試萬華區
# #     print(get_hotels_info("萬華區"))


import requests
from bs4 import BeautifulSoup
import time # 用於設定延遲，避免頻繁請求被鎖 IP
import re   # 引入正則表達式模組，用來提取字串中的數字

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
    def parse_page(page_soup):
        page_output = []
        hotel_cards = page_soup.find_all('div', class_='card mb-3 px-0')
        
        for card in hotel_cards:
            # 1 & 2. 旅店名稱與 URL
            title_tag = card.find('a', class_='searchtitle')
            if title_tag:
                name = title_tag.get_text(strip=True)
                raw_href = title_tag.get('href')
                name_url = (base_url + raw_href) if raw_href else None
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
    print(f"正在搜尋 [{district}] 的旅館資訊...")
    response = session.post(target_url, data=payload, headers=headers)
    
    if response.status_code != 200:
        print("請求失敗！")
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
            print(f"網頁顯示總共有：{expected_total_items} 筆資料。")

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
            
    print(f"共分為 {max_page} 頁。")
    print(f"已完成爬取第 1 / {max_page} 頁...")

    # 處理並儲存第 1 頁的資料
    output.extend(parse_page(soup))


    # --- 第 2 步：透過迴圈抓取第 2 頁到最後一頁 ---
    for page in range(2, max_page + 1):
        print(f"正在爬取第 {page} / {max_page} 頁...")
        
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
            print(f"資料筆數核對無誤！(共 {len(output)} 筆)")
        else:
            print(f"⚠️ 警告：爬取的筆數 ({len(output)}) 與網頁顯示的總筆數 ({expected_total_items}) 不符！")

    return output

def get_all_hotels():
    return get_hotels_info("")

# for debug
if __name__ == "__main__":
    # 測試士林區
    # results = get_hotels_info("士林區")
    
    results = get_all_hotels()

    if results:
        print(f"\n爬取完成！總共抓到 {len(results)} 筆旅館資料。\n")
        # 印出最後一筆資料確認是否成功爬到最後一頁
        print("最後一筆資料範例：")
        print(results[-1])