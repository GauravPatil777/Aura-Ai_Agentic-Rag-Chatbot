import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException,Request
load_dotenv()
from langchain_core.messages import HumanMessage
from pydantic import BaseModel
from graphs.chat_graph import workflow,set_current_thread,get_retrieval_context
from controllers.save_thread import save_thread_name

class ChatRequest(BaseModel):
    user_inp: str
    thread_id: str
    
router=APIRouter()

@router.post("/generate_response")
def generate_response(chat_request: ChatRequest, request:Request):
    user_inp =chat_request.user_inp
    thread_id = chat_request.thread_id
     
    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }
    auth_type = request.session.get("auth_type")

    # Save thread name only for Google users
    if auth_type == "google":

        user_id = request.session.get("user_id")

        if not user_id:
            raise HTTPException(401, "User not authenticated")

        save_thread_name(thread_id,  user_id,user_inp)

    elif auth_type != "guest":
        raise HTTPException(401, "Not authenticated")

    set_current_thread(thread_id)

    response = workflow.invoke(
        {
            "messages": [
                HumanMessage(content=user_inp)
            ]
        },
        config
    )

    ai_response = response["messages"][-1].text
    retrieval_context=get_retrieval_context(thread_id)
    # save_evaluation_interaction(
    #     user_inp,
    #     ai_response,
    #     retrieval_context
    # )
    return {
        "user_input": user_inp,
        "ai_response": ai_response,
        "retrieval_context": retrieval_context
    }

