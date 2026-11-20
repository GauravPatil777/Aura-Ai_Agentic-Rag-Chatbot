import os

from dotenv import load_dotenv
from psycopg_pool import ConnectionPool

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is missing")

pool = ConnectionPool(
    conninfo=DATABASE_URL,
    min_size=1,
    max_size=int(os.getenv("DB_POOL_MAX_SIZE", "5")),
    open=True,
)