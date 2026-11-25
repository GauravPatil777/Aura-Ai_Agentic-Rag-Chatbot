from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
from database import pool
from auth.routes import router as auth_router
from controllers.generate_context import router as generate_context
from controllers.get_thread_history import router as get_thread_history
from controllers.retrieve_all_threads import router as retrieve_all_threads
from controllers.generate_response import router as generate_response
from controllers.delete_thread import router as delete_thread_by_id
from controllers.save_thread import router as save_thread
from controllers.get_thread_names import router as get_thread_names

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):

    with pool.connection() as conn:
        with conn.cursor() as cursor:

            # 1. Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    google_id VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255),
                    profile_picture TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 2. Guest sessions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS guest_sessions (
                    id UUID PRIMARY KEY,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL
                )
            """)

            # 3. Thread names table with user_id
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS thread_names (
                    thread_id TEXT PRIMARY KEY,
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    thread_name TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 4. Migration for existing databases
            cursor.execute("""
                ALTER TABLE thread_names
                ADD COLUMN IF NOT EXISTS user_id UUID
                REFERENCES users(id) ON DELETE CASCADE
            """)

            # 5. Index for faster user-specific thread retrieval
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_thread_names_user_id
                ON thread_names(user_id)
            """)

        conn.commit()

    print("Database tables initialized successfully!")

    yield

    print("FastAPI application shutting down...")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    SessionMiddleware,

    secret_key=os.getenv("SECRET_KEY"),

    session_cookie="aura_session",

    max_age=60 * 60 * 24 * 7,

    same_site="lax",

    https_only=os.getenv("ENVIRONMENT") == "production"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # "http://localhost:3000",#docker 
        "https://aura-ai-agentic-rag-chatbot-1.onrender.com"  #render url
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


  
@app.get("/")
def home():
    return {"message":"Agentic Ai chatbot is Running"}


app.include_router(generate_context)
app.include_router(get_thread_history)
app.include_router(retrieve_all_threads)
app.include_router(generate_response)
app.include_router(delete_thread_by_id)
app.include_router(save_thread)
app.include_router(get_thread_names)
app.include_router(auth_router)