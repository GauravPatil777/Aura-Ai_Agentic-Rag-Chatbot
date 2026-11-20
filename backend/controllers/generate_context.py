import os
from dotenv import load_dotenv
from  fastapi import APIRouter, UploadFile, File, Form, HTTPException
load_dotenv()

import uuid
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
import tempfile



from graphs.chat_graph import thread_documents,vector_stores

router=APIRouter()

@router.post("/generate_context")
def generate_context(uploaded_file: UploadFile = File(...),
thread_id: str = Form(...)):
   
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        temp_file.write(uploaded_file.file.read())
        temp_pdf_path = temp_file.name
    try:
        # Load PDF using the file path
        loader = PyPDFLoader(temp_pdf_path)
        documents = loader.load()

        # Split the documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=20)
        splitted_docs = text_splitter.split_documents(documents)

        # Generate embeddings
        # embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-2")
        
        embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

        document_id = str(uuid.uuid4())
        # Create a vector store
        vector_store = Chroma.from_documents(splitted_docs,
                                             embedding=embeddings,
                                             collection_name=document_id)
        vector_stores[document_id]=vector_store
        # Map current thread to this PDF
        thread_documents[thread_id] = document_id
    finally:
         # Delete temporary PDF
            os.remove(temp_pdf_path)
