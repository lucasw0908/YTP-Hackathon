import os
from pydantic import BaseModel
from google import genai
from google.genai import types
from ..config import SettingsDep



# 2. 定義你期望 Gemini 回傳的 JSON 格式 (使用 Pydantic)
# 這裡以「任務判定結果」為例，你可以根據需求自行增減欄位
class JudgeResult(BaseModel):
    is_success: bool
    score: int
    reason: str

# 3. 處理圖片並呼叫 Gemini (使用 async 非同步)
# , settings: SettingsDep
async def judge_mission(mission_description: str, settings: SettingsDep, image_bytes: bytes, mime_type: str) -> dict:
    # 1. 初始化新版 Client
    # 預設會自動讀取系統環境變數中的 GEMINI_API_KEY
    client = genai.Client(api_key=settings.api.GEMINI_APIKEY)
    
    # 將二進位圖片資料轉換為 Gemini 接受的格式
    image_part = types.Part.from_bytes(
        data=image_bytes,
        mime_type=mime_type
    )
    prompt = f"""
    這是一個旅行挑戰任務，使用者會根據任務內容拍攝相關的照片。
    你負責判斷圖片是否符合任務說明。
    ，並嚴格按照 JSON 格式回傳。 
    is_success: 是否符合任務說明(True/False)
    score: 0-100 分數
    reason: 原因，寫至多20個字的說明
    任務說明：{mission_description}
    """

    # 使用 client.aio.models.generate_content 進行非同步呼叫
    response = await client.aio.models.generate_content(
        model='gemini-2.5-flash', # 建議使用最新的 flash 模型，速度快且支援多模態
        contents=[prompt, image_part],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=JudgeResult, # 強制 Gemini 按照你的 Pydantic 模型輸出 JSON
            temperature=0.2 # 判定類型的任務，降低溫度可以讓結果更穩定客觀
        )
    )

    response_text = response.text
    if response_text is None:
        raise Exception("Gemini 回傳的 JSON 為空")

    # 4. 讀取與解析 JSON
    # response.text 會是一個標準的 JSON 字串
    # 我們使用 Pydantic 直接將其驗證並解析為 Python 物件
    parsed_result = JudgeResult.model_validate_json(response_text)
    print(parsed_result)
    # 將解析後的結果轉回 dictionary 回傳給前端
    return parsed_result.model_dump()

# for debug
# import asyncio
# if __name__ == "__main__":
#     # 建立一個非同步的主程式
#     async def main():
#         # 建議使用 with open 來讀取檔案，這樣讀完後系統會自動安全地關閉檔案
#         # 順便抓個小蟲：你的檔名是 .png，但原本帶入的 MIME type 是 image/jpeg，這裡幫你修正為正確的 image/png
#         file_path = "/Users/idoit_melon/development/YTP-Hackathon/backend/app/utils/b29_superfortress.png"
        
#         with open(file_path, "rb") as f:
#             image_bytes = f.read()
        
#         # 在 async 函式內部，就可以正常使用 await 來呼叫另外一個 async 函式了
#         response = await judge_mission(
#             mission_description="拍一張b29超級堡壘轟炸機", 
#             image_bytes=image_bytes, 
#             mime_type="image/png"
#         )
#         print("最終結果：", response)

#     # 告訴 Python：請幫我建立一個事件迴圈，並把 main() 丟進去執行直到結束
#     asyncio.run(main())