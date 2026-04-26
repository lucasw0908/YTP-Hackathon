import logging
from typing import Optional

from sqlalchemy import String, ForeignKey, Integer, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from . import Base
from .mixin import TimeStampMixin


log = logging.getLogger(__name__)

class Mission(Base, TimeStampMixin):
    __tablename__ = "missions"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    task_name: Mapped[str] = mapped_column(String(256), nullable=False)
    location_name: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str] = mapped_column(String(1024), nullable=False)
    mission_type: Mapped[str] = mapped_column(String(64), nullable=False)
    estimated_duration_mins: Mapped[int] = mapped_column(Integer, nullable=False)
    
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    nearest_station_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    nearest_station_name: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    def __repr__(self):
        return f"<Mission (id={self.id}, name={self.task_name})>"
