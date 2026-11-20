from fastapi import APIRouter, HTTPException
from graphs.chat_graph import checkpointer, pool, thread_documents, vector_stores

router = APIRouter()

@router.delete("/delete_thread/{thread_id}")
def delete_thread_by_id(thread_id: str):

    try:
        # 1. Delete LangGraph checkpoint history
        checkpointer.delete_thread(thread_id)

        # 2. Delete thread name from PostgreSQL
        with pool.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM thread_names WHERE thread_id = %s",
                    (thread_id,)
                )

        # 3. Remove PDF mapping
        document_id = thread_documents.pop(thread_id, None)

        # 4. Remove vector store mapping
        if document_id:
            vector_stores.pop(document_id, None)

        return {
            "status": "success",
            "message": "Thread deleted successfully",
            "thread_id": thread_id
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete thread: {str(e)}"
        )