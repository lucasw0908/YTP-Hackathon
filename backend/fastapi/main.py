import uvicorn

from app import create_app
from app.config import get_settings


settings = get_settings()
app = create_app()
    

if __name__ == "__main__":
    print(settings.database.url)
    uvicorn.run(app, host=settings.server.host, port=settings.server.port)