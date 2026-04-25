import logging

from pydantic import BaseModel

log = logging.getLogger(__name__)


class Station(BaseModel):
    name: str