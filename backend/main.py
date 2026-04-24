import uvicorn

from app import create_app
from app.config import get_settings


settings = get_settings()
app = create_app()
    

if __name__ == "__main__":
    uvicorn.run(app, host=settings.server.HOST, port=settings.server.PORT)