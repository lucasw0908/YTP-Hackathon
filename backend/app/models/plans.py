import logging
from typing import Optional

from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from . import Base
from .mixin import TimeStampMixin


log = logging.getLogger(__name__)

class TravelPlan(Base, TimeStampMixin):
    __tablename__ = "travel_plans"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # The actual data from the frontend (TravelPlanPayload)
    # Stores basic, accommodation, preferences as JSON
    data: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    def __init__(self, data: dict, user_id: Optional[int] = None):
        self.data = data
        self.user_id = user_id

    def __repr__(self):
        return f"<TravelPlan (id={self.id}, user_id={self.user_id})>"
