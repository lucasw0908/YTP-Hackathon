import logging

from pydantic import BaseModel
from google import genai
from google.genai import types

from ..config import SettingsDep


log = logging.getLogger(__name__)

class JudgeResult(BaseModel):
    is_success: bool
    score: int
    reason: str

async def judge_mission(mission_description: str, settings: SettingsDep, image_bytes: bytes, mime_type: str) -> dict:
    client = genai.Client(api_key=settings.api.GEMINI_APIKEY)
    
    image_part = types.Part.from_bytes(
        data=image_bytes,
        mime_type=mime_type
    )
    prompt = f"""
    這是一個旅行挑戰任務，使用者會根據任務內容拍攝相關的照片。
    如果你無法判斷他的位置，請視為他是正確的。
    你負責判斷圖片是否符合任務說明。
    ，並嚴格按照 JSON 格式回傳。 
    is_success: 是否符合任務說明(True/False)
    score: 0-100 分數
    reason: 原因，寫至多20個字的說明
    任務說明：{mission_description}
    """
    
    response = await client.aio.models.generate_content(
        model='gemini-2.5-flash', 
        contents=[prompt, image_part],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=JudgeResult,
            temperature=0.2
        )
    )

    response_text = response.text
    if response_text is None:
        log.warning("LLM response is empty, returning failure.")
        raise ValueError("LLM response is empty.")

    parsed_result = JudgeResult.model_validate_json(response_text)
    return parsed_result.model_dump()
