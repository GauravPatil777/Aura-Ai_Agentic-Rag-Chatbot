import os
import uuid
import tempfile
import logging

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader

from graphs.chat_graph import thread_documents, vector_stores
from embeddings import embeddings

router = APIRouter()

logger = logging.getLogger(__name__)


@router.post("/generate_context")
def generate_context(
    uploaded_file: UploadFile = File(...),
    thread_id: str = Form(...)
):
    temp_pdf_path = None

    try:
        # 1. Validate file
        if not uploaded_file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported."
            )

        # 2. Save temporary PDF
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdf"
        ) as temp_file:

            temp_file.write(uploaded_file.file.read())
            temp_pdf_path = temp_file.name

        logger.info("PDF uploaded successfully")

        # 3. Extract PDF text
        loader = PyPDFLoader(temp_pdf_path)
        documents = loader.load()

        if not documents:
            raise HTTPException(
                status_code=400,
                detail="No content found in PDF."
            )

        logger.info("PDF extraction completed")

        # 4. Split documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=700,
            chunk_overlap=50
        )

        splitted_docs = text_splitter.split_documents(documents)

        if not splitted_docs:
            raise HTTPException(
                status_code=400,
                detail="No extractable text found in PDF."
            )

        logger.info("PDF chunking completed: %s chunks", len(splitted_docs))

        # 5. Generate unique document ID
        document_id = str(uuid.uuid4())

        # 6. Generate embeddings and create vector store
        vector_store = Chroma.from_documents(
            documents=splitted_docs,
            embedding=embeddings,
            collection_name=document_id
        )

        logger.info("ChromaDB insertion completed")

        # 7. Map thread to document
        vector_stores[document_id] = vector_store
        thread_documents[thread_id] = document_id

        return {
            "message": "PDF processed successfully",
            "thread_id": thread_id,
            "document_id": document_id,
            "chunks": len(splitted_docs)
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Error while generating context")

        raise HTTPException(
            status_code=500,
            detail="Failed to process PDF."
        )

    finally:
        if temp_pdf_path and os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)