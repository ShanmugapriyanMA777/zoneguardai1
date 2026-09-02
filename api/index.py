import sys
import os
from pathlib import Path

# Add backend directory to sys.path so app modules can be loaded
current_dir = Path(__file__).parent.resolve()
backend_dir = (current_dir.parent / "backend").resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Change directory so SQLite database can be accessed
try:
    os.chdir(str(backend_dir))
except Exception:
    pass

from app.main import app

# Export FastAPI app for Vercel Serverless Functions
handler = app
