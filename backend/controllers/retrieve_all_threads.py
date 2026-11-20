from dotenv import load_dotenv
from fastapi import APIRouter
from graphs.chat_graph import checkpointer
load_dotenv()


router=APIRouter()

@router.get("/retrieve_all_threads")
def retrieve_all_threads():
    all_threads=set()
    for checkpoint in checkpointer.list(None):
        all_threads.add(checkpoint.config['configurable']['thread_id'])
    return list(all_threads)
