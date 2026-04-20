import os

from app.config import EnvManager, get_settings


settings = get_settings()

if __name__ == "__main__":
    with open(os.path.join(settings.basedir, ".env.example"), "w", encoding="utf-8") as f:
        f.write(EnvManager.generate_env_example())