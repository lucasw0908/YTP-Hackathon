import logging
import logging.handlers
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import get_api_router
from .config import get_settings
from .models import sessionmanager


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
