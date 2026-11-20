import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi import APIRouter

load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import START,StateGraph,END
from langsmith import traceable
from typing import TypedDict,Annotated
from langchain_core.messages import BaseMessage,SystemMessage,AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel
from langgraph.prebuilt import ToolNode,tools_condition
from langgraph.graph.message import add_messages
import requests
from langgraph.store.memory import InMemoryStore  
from psycopg import Connection
from langgraph.checkpoint.postgres import PostgresSaver
from database import pool
from mcp_client import call_tavily_search
from pathlib import Path
from nemoguardrails import RailsConfig, LLMRails
from fastapi import FastAPI
# from nemoguardrails.rails.llm.options import RailType,RailStatus

router=APIRouter()
model=ChatGoogleGenerativeAI(
     model="gemini-3.1-flash-lite"
)



# BASE_DIR = Path(__file__).resolve().parent.parent.parent
# CONFIG_PATH = BASE_DIR / "config"

# config = RailsConfig.from_path(str(CONFIG_PATH))

# rails = LLMRails(config)

vector_stores={}
thread_documents = {}

current_thread_id = None

store=InMemoryStore()

import json
retrieval_contexts = {}
 
app=FastAPI()

def save_evaluation_interaction(
    user_inp,
    ai_response,
    retrieval_context
):
    with pool.connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute("""
                INSERT INTO evaluation_interactions
                (user_input, ai_response, retrieval_context)
                VALUES (%s, %s, %s)
            """, (
                user_inp,
                ai_response,
                json.dumps(retrieval_context)
            ))

        conn.commit()

    print("Evaluation interaction saved successfully!")
    
def get_retrieval_context(thread_id):
    return retrieval_contexts.get(thread_id, [])
        
def clear_retrieval_context(thread_id):
    return retrieval_contexts.clear()
def set_current_thread(thread_id):
    global current_thread_id
    current_thread_id = thread_id
      
class chatbotState(TypedDict):
    messages:Annotated[list[BaseMessage],add_messages]
    guardrail_status: str

    
# tools
from langchain_core.tools import tool
# @tool
@tool
@traceable()
def web_search(query: str,max_results: int = 1) -> str:
    """
    Search the web for current, recent, or time-sensitive information.
    Use this tool for news, today's information, recent events, live updates,
    current prices, current weather, and other information that may have changed.
    Do not use it for basic general-knowledge questions.
    """
    try:
        # search_tool=DuckDuckGoSearchRun()
        # result = search_tool.invoke(query)
        return call_tavily_search(
            query=query,
            max_results=max_results,
        )

    except Exception as e:
        return (
            "WEB_SEARCH_FAILED: The web search service is currently unavailable. "
            "Do not call web_search again for this question. "
            "Answer using your existing knowledge if possible."
        )

@tool
def calculator(a: int, b: int,operation:str) -> int:
    """perform arithmetic operations on two numbers.
    supported operations: add, subtract, multiply, divide."""
    try:
        if operation == "add":
                            return a + b 
        if operation == "subtract":
                                return a - b  
        if operation == "multiply":
                                return a * b
        if operation == "divide":
                                return a / b                             
    except ZeroDivisionError:
        return "Error: Division by zero is not allowed."

@tool
def weather_data(location:str)->str:
    """Get weather data for a location."""
    url=f"https://api.openweathermap.org/data/2.5/weather?q={location}&appid={os.getenv('OPENWEATHER_API_KEY')}"
    result=requests.get(url)
    return result.json()

@tool 
def rag_tool(query: str) -> str:
    """
    Search the PDF associated with the current conversation.
    """
    global current_thread_id
    if current_thread_id is None:
        return "No conversation is currently selected."

    document_id = thread_documents.get(current_thread_id)

    if document_id is None:
        return "No PDF is associated with this conversation."

    vector_store = vector_stores.get(document_id)

    if vector_store is None:
        return "The PDF vector store could not be found."
    # perform similarity search

    retrieved_docs = vector_store.similarity_search(query, k=3)

    context = [doc.page_content for doc in retrieved_docs]

    retrieval_contexts[current_thread_id] = context

    # print(context)
    prompt=PromptTemplate(
        input_variables=["context","question"],
        template="Answer the question based on the context below.\n\nContext: {context}\n\nQuestion: {question}\n\nAnswer:"
    )
    chain=prompt | model |StrOutputParser()
    result=chain.invoke({"context":context,"question":query})
    # print("result",result)
    return result
   
from langchain_core.messages import AIMessage

class GuardrailRequest(BaseModel):
    user_input: str
    
# def input_guardrail(state):

#     user_input = state["messages"][-1].content

#     result =rails.check(
#         [{"role": "user", "content": user_input}],
#         rail_types=[RailType.INPUT]
#     )

#     if result.status==RailStatus.BLOCKED:
    
#         return {
#             "guardrail_status": "blocked",
#             "messages": [
#                 AIMessage(content="Your request was blocked by security guardrails.")
#             ]
#         }

#     return {
#         "guardrail_status": "passed"
#     }
    
def input_guardrail(state):

    user_input = state["messages"][-1].content

    prompt = f"""
    You are an AI input security classifier.

    Classify the following user input.

    Return TRUE if:
    - The request is safe and appropriate.
    - It asks for legitimate educational information.
    - It involves normal programming, coding, or debugging.
    - It involves legitimate cybersecurity learning.
    - It does not request harmful wrongdoing.

    Return FALSE if:
    - It requests credential theft or password stealing.
    - It requests malware creation or deployment.
    - It facilitates malicious exploitation.
    - It requests unauthorized access to systems.
    - It attempts to bypass security policies.
    - It requests instructions for harmful wrongdoing.

    USER INPUT:
    {user_input}

    Return ONLY TRUE or FALSE.
    """

    result = model.invoke(prompt)

    content = result.content

    if isinstance(content, list):
        classification = "".join(
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        ).strip().upper()
    else:
        classification = str(content).strip().upper()

    if classification != "TRUE":

        return {
            "guardrail_status": "blocked",
            "messages": [
                AIMessage(
                    content="Your request was blocked by security guardrails."
                )
            ]
        }

    return {
        "guardrail_status": "passed"
    }
    
def route_guardrail(state):

    if state["guardrail_status"] == "blocked":
        return "end"

    return "chat_node"  


def output_guardrail(state):

    ai_response = state["messages"][-1].content

    prompt = f"""
    You are an AI output security classifier.

    Classify the following AI-generated response.

    Return TRUE if:
    - The response is safe and appropriate.
    - It provides legitimate educational information.
    - It does not facilitate harmful wrongdoing.

    Return FALSE if:
    - It provides instructions for credential theft.
    - It facilitates malicious exploitation.
    - It provides instructions for harmful wrongdoing.

    AI RESPONSE:
    {ai_response}

    Return ONLY TRUE or FALSE.
    """

    result = model.invoke(prompt)

    content = result.content

    if isinstance(content, list):
        classification = "".join(
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        ).strip().upper()
    else:
        classification = str(content).strip().upper()


    if classification != "TRUE":
        return {
            "guardrail_status": "blocked",
            "messages": [
                AIMessage(
                    content="The generated response was blocked by security guardrails."
                )
            ]
        }

    return {
        "guardrail_status": "passed"
    }
         
tools=[web_search,calculator,weather_data,rag_tool]


model_with_tools=model.bind_tools(tools)
SYSTEM_PROMPT = """
You are an intelligent Agentic RAG assistant.

You have four tools:

1. rag_tool
   Use this tool whenever the user asks about the uploaded PDF,
   document, file, its contents, topics, sections, data, or information
   that may be present in the uploaded document.

2. web_search
   Use ONLY for current, recent, live, or time-sensitive information,
   such as:
   - current news
   - today's events
   - recent developments
   - current prices
   - live information
   - information that may have changed recently

   Do NOT use web_search for normal general-knowledge questions,
   basic facts, definitions, mathematics, programming concepts,
   geography, history, or other information you already know.

3. calculator
   Use for arithmetic calculations.

4. weather_data
   Use when the user asks for current weather information.

Important:
- Do not call web_search unnecessarily.
- If web_search returns WEB_SEARCH_FAILED, do not call it again.
- Instead, answer using your existing knowledge when possible.
- Give a direct and useful answer.
"""

@traceable()
def chat_node(state: chatbotState) -> chatbotState:

  
    messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            *state["messages"]
        ]
    
    response = model_with_tools.invoke(messages)
   

    return {"messages": [response]}
    
        
tool_node=ToolNode(tools=tools, handle_tool_errors=True)

# PostgreSQL checkpointer
conn = Connection.connect(
    os.environ["DATABASE_URL"],
    autocommit=True,
    prepare_threshold=0,
)

checkpointer = PostgresSaver(conn)
checkpointer.setup()

graph=StateGraph(chatbotState)
graph.add_node('chat_node',chat_node)
graph.add_node('input_guard',input_guardrail)
graph.add_node('output_guard',output_guardrail)
graph.add_node("tools",tool_node)
graph.add_edge(START, "input_guard")


graph.add_conditional_edges(
    "input_guard",
    route_guardrail,
    {
        "chat_node": "chat_node",
        "end": END
    }
)
graph.add_conditional_edges(
    "chat_node",
    tools_condition,
    {
        "tools": "tools",
        END: "output_guard"
    }
)

graph.add_edge('tools','chat_node')
graph.add_edge('output_guard',END)


workflow = graph.compile(
    checkpointer=checkpointer,
    store=store,
)