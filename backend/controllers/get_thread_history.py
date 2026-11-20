import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
load_dotenv()

from fastapi import HTTPException
from graphs.chat_graph import workflow

router=APIRouter()

@router.get("/get_thread_history/{thread_id}")
def get_thread_history(thread_id: str):

    try:
        config = {
            "configurable": {
                "thread_id": thread_id
            }
        }

        state =workflow.get_state(config)

        if not state or not state.values:
            return {"thread_id": thread_id, "messages": []}

        messages = state.values.get("messages", [])

        history = []

        for message in messages:
            if message.type == "human":
                    history.append({
                        "role": "user",
                        "content": message.text
                    })
            
            elif message.type == "ai":
                    # Only display actual AI responses
                    if message.content:
                        history.append({
                            "role": "assistant",
                            "content": message.text
                        })

        return {
            "thread_id": thread_id,
            "messages": history
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    