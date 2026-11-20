from database import pool
from fastapi import APIRouter

router=APIRouter()

def save_thread_name(thread_id, thread_name):

    with pool.connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute("""
                INSERT INTO thread_names
                (thread_id, thread_name, updated_at)

                VALUES (%s, %s, CURRENT_TIMESTAMP)

                ON CONFLICT (thread_id)

                DO UPDATE SET
                    thread_name = EXCLUDED.thread_name,
                    updated_at = CURRENT_TIMESTAMP

            """, (thread_id, thread_name))

        conn.commit()

@router.post("/save_thread_name")
def save_thread(
    thread_id: str,
    thread_name: str
):

    save_thread_name(thread_id, thread_name)

    return {
        "message": "Thread name saved successfully",
        "thread_id": thread_id,
        "thread_name": thread_name
    }