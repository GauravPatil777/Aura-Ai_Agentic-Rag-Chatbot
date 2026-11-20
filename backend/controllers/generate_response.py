import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
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
def generate_response(request: ChatRequest):
    user_inp = request.user_inp
    thread_id = request.thread_id
     
    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }
    save_thread_name(thread_id,user_inp)
    set_current_thread(thread_id)
    
    response=workflow.invoke(     {
                    "messages": [
                        HumanMessage(content=user_inp)
                    ]
                },
                    config)
    
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

