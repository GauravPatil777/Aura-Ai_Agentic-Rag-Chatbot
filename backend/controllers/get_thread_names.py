from fastapi import APIRouter
from database import pool
router=APIRouter()

def retrieve_thread_name():

    with pool.connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute("""
                SELECT thread_id, thread_name, updated_at
                FROM thread_names
                ORDER BY updated_at DESC
            """)

            result = cursor.fetchall()

    return [
        {
            "thread_id": row[0],
            "thread_name": row[1],
            "updated_at": row[2].isoformat() if row[2] else None
        }
        for row in result
    ]
    
@router.get("/retrieve_thread_names")
def get_thread_names():

    return retrieve_thread_name()