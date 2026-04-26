import logging
from typing import Optional, Any

from pydantic import BaseModel
from fastapi import APIRouter

from ..models import SessionDep, TravelPlan


log = logging.getLogger(__name__)
router = APIRouter(prefix="/plan")

class PlanPayload(BaseModel):
    basic: Optional[dict[str, Any]] = None
    accommodation: Optional[dict[str, Any]] = None
    preferences: Optional[dict[str, Any]] = None

@router.post("/save")
async def save_plan(payload: PlanPayload, session: SessionDep):
    """
    Save the travel plan data to the database.
    """
    log.info(f"Saving travel plan: {payload}")
    
    # In a real app, we'd get the user_id from the session/token
    # For now, we'll just save it without a user_id if not logged in
    new_plan = TravelPlan(data=payload.model_dump())
    session.add(new_plan)
    await session.commit()
    await session.refresh(new_plan)
    
    return {"success": True, "plan_id": new_plan.id}
