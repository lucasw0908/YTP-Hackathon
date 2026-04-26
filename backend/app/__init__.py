import logging
import logging.handlers
import os
import json
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import get_api_router
from .config import get_settings
from .models import sessionmanager
from .utils.event_query import EventQueryManager, SearchRequest


log = logging.getLogger(__name__)
settings = get_settings()


def init_logger() -> None:
    formatter = logging.Formatter(settings.logging.FORMAT, datefmt=settings.defaults.DATETIME_FORMAT, style="{")
    
    log.setLevel(settings.logging.LEVEL)
        
    if os.access(settings.BASEDIR, os.W_OK):
        LOGDIR = os.path.join(settings.BASEDIR, "logs")
        
        os.makedirs(LOGDIR, exist_ok=True)
            
        log.debug(f"Log directory: {LOGDIR}")
            
        file_handler = logging.handlers.RotatingFileHandler(
            filename=os.path.join(LOGDIR, settings.logging.FILENAME),
            encoding="utf-8",
            maxBytes=settings.logging.MAX_BYTES, 
            backupCount=settings.logging.BACKUP_COUNT
        )
        
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logging.getLogger().addHandler(file_handler)
    
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(formatter)
    logging.getLogger().addHandler(console_handler)
    
    log.info("Logger initialized")
    

def create_app() -> FastAPI:
    """
    Returns
    -------
    app: :class:`FastAPI`
        A FastAPI app.
    """
    # Initialize the logger
    init_logger()
    
    # Initialize the app
    @asynccontextmanager
    async def lifespan(_: FastAPI):
        try:
            events_file = os.path.join(settings.BASEDIR, "data", "events.json")
            should_fetch = True
            if os.path.exists(events_file):
                file_age = datetime.now().timestamp() - os.path.getmtime(events_file)
                if file_age < 3600:  # 1 hour
                    should_fetch = False
                    log.info(f"Events cache is still fresh ({int(file_age)}s old), skipping prefetch.")

            if should_fetch:
                log.info("Prefetching events...")
                event_manager = EventQueryManager(settings)
                events = await event_manager.get_ai_overview(SearchRequest(query="台北今日活動"), settings)
                
                # Convert SearchEvent objects to dict for JSON serialization
                events_data = [e.model_dump() for e in events]
                with open(events_file, "w", encoding="utf-8") as f:
                    json.dump(events_data, f, ensure_ascii=False, indent=4)
                log.info(f"Successfully prefetched {len(events_data)} events.")
                
        except Exception as e:
            log.error(f"Failed to prefetch events: {e}")

        yield
        
        if sessionmanager._engine is not None:
            await sessionmanager.close()
            
    app = FastAPI(
        title=settings.project.NAME, 
        version=settings.project.VERSION,
        lifespan=lifespan
    )
    
    # Initialize the CSRF protection
    if settings.security.CSRF_PROTECTION:
        origins = [
            "http://localhost:8080"
        ]
        app.add_middleware(
            CORSMiddleware, 
            allow_origins=origins, 
            allow_credentials=True,
            allow_methods=["*"], 
            allow_headers=["*"]
        )
        log.info("CSRF protection is enabled")
    
    # Load the routers
    app.include_router(get_api_router())
    log.info("Routers loaded")
    
    log.info("App initialized")

    return app
