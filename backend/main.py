from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controllers.generate_context import router as generate_context
from controllers.get_thread_history import router as get_thread_history
from controllers.retrieve_all_threads import router as retrieve_all_threads
from controllers.generate_response import router as generate_response
from controllers.delete_thread import router as delete_thread_by_id
from controllers.save_thread import router as save_thread
from controllers.get_thread_names import router as get_thread_names
from database import pool
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):

    # Application startup
    with pool.connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS thread_names (
                    thread_id TEXT PRIMARY KEY,
                    thread_name TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

        conn.commit()

    print("Thread names table initialized successfully!")

    yield

    # Application shutdown
    print("FastAPI application shutting down...")


app = FastAPI(lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # "http://localhost:3000",#docker 
        "https://aura-ai-agentic-rag-chatbot-1.onrender.com/"  #render url
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
