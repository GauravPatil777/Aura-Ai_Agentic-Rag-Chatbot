from fastapi import APIRouter, Request, HTTPException
from database import pool

router = APIRouter()


def retrieve_thread_name(user_id):

    with pool.connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute("""
                SELECT thread_id, thread_name, updated_at
                FROM thread_names
                WHERE user_id = %s
                ORDER BY updated_at DESC
            """, (user_id,))

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
def get_thread_names(request: Request):

    user_id = request.session.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="User not authenticated"
        )

    return retrieve_thread_name(user_id)
