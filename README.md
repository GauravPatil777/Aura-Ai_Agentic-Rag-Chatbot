# ✨ AURA AI – Agentic RAG Chatbot

### An intelligent AI chatbot powered by Agentic RAG, LangGraph, and advanced LLM capabilities.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://aura-ai-agentic-rag-chatbot-1.onrender.com/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/GauravPatil777/Aura-Ai_Agentic-Rag-Chatbot)

**🚀 Live Application:** https://aura-ai-agentic-rag-chatbot-1.onrender.com/

AURA AI is an Agentic RAG-based chatbot designed to go beyond traditional question-answering systems. It combines retrieval-augmented generation, agentic workflows, conversational memory, and AI safety mechanisms to deliver context-aware and reliable interactions.

Unlike a basic chatbot, AURA AI focuses on building a more complete AI application with authentication, persistent conversations, guardrails, evaluation, observability, and deployment.

---

## 📸 Application Screenshots

### Login Page
![AURA AI Login](screenshots/login.png)

### Main Dashboard
![AURA AI Dashboard](screenshots/dashboard.png)

### AI Conversation
![AI Conversation](screenshots/conversation.png)

### LangSmith Observability
![LangSmith Observability](screenshots/tracing-langsmith.png)

### Architecture
![Workflow Architecture](screenshots/workflow.png)
---

## 🌟 Key Features

### 🤖 Agentic RAG Architecture
- Built using LangGraph for orchestrating agentic workflows.
- Retrieval-augmented generation for context-aware responses.
- Intelligent information retrieval and context processing.
- Multi-step AI workflow execution.

### 🧠 Conversational Memory
- Maintains context across multiple messages.
- Supports context-aware follow-up questions.
- Persistent conversation history for authenticated users.
- Temporary in-session conversations for guest users.

### 🛡️ AI Safety with NVIDIA NeMo Guardrails
- Integrates NVIDIA NeMo Guardrails.
- Adds safety and control to AI interactions.
- Helps restrict unwanted or inappropriate responses.

### 📊 LLM Evaluation
- Evaluates the quality and reliability of AI-generated responses.
- Helps identify weaknesses in chatbot outputs.
- Supports systematic testing and improvement.

### 🔍 Observability with LangSmith
- Tracks LLM execution and agent workflows.
- Provides visibility into traces and intermediate steps.
- Helps debug and monitor AI application behavior.

### 🔐 Authentication & User Management
- Google OAuth authentication.
- Guest login functionality.
- Session-based authentication.
- User-specific conversation management.

### 💬 Conversation Management
- Create and manage multiple conversations.
- Access previous conversations.
- Persistent chat history for authenticated users.
- Guest conversations are temporary and are not saved as chat history.

### ☁️ Deployment
- Containerized application using Docker.
- Frontend and backend deployed on Render.
- Environment-based configuration.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Backend | Python, FastAPI |
| Agentic Framework | LangGraph |
| AI / LLM | LLM APIs, Prompt Engineering |
| RAG | Embeddings, Vector Retrieval |
| Guardrails | NVIDIA NeMo Guardrails |
| Evaluation | LLM Evaluation |
| Observability | LangSmith |
| Database | PostgreSQL |
| Authentication | Google OAuth, Session Middleware |
| API Communication | Axios, REST APIs |
| Deployment | Docker, Render |
| Version Control | Git, GitHub |

---

## 🏗️ Architecture Overview

```text
                 ┌──────────────────────┐
                 │      React UI        │
                 │   (Vite Frontend)    │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │     FastAPI          │
                 │     Backend          │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   LangGraph Agent    │
                 │   Orchestration      │
                 └──────────┬───────────┘
                            │
                 ┌──────────┴───────────┐
                 ▼                      ▼
        ┌─────────────────┐    ┌─────────────────┐
        │   RAG Pipeline  │    │ Conversational  │
        │ Retrieval       │    │ Memory          │
        └────────┬────────┘    └─────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │   LLM Response  │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ NeMo Guardrails │
        │ Safety Layer    │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  Final Response │
        └─────────────────┘

       LangSmith: Tracing & Observability
       LLM Evaluation: Response Quality
       PostgreSQL: Persistent User Data
```

---

## 📂 Project Structure

```text
Aura-Ai_Agentic-Rag-Chatbot/
│
├── backend/
│   ├── auth/
│   ├── controllers/
│   ├── routers/
│   ├── database/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── screenshots/
│   ├── login.png
│   ├── dashboard.png
│   ├── conversation.png
│   ├── tracing-langsmith.png
│   └── observability.png
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

*Note: The structure above is a high-level representation. Adjust folder names to match the actual repository.*

---

## ⚙️ Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/GauravPatil777/Aura-Ai_Agentic-Rag-Chatbot.git

cd Aura-Ai_Agentic-Rag-Chatbot
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables in your `.env` file.

Start the backend:

```bash
uvicorn main:app --reload
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Configure the backend API URL using your frontend environment configuration.

Start the development server:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

---

## 🔐 Environment Variables

Configure the required environment variables for your backend and frontend.

Examples of configuration categories:

**Backend**
- LLM provider API key
- PostgreSQL database connection
- Google OAuth client credentials
- Session secret key
- LangSmith API key and tracing configuration
- Other integrations used by the application

**Frontend**
- Backend API base URL

**Important:** Never commit `.env` files, API keys, OAuth secrets, or database credentials to GitHub.

---

## 🔍 Monitoring & Evaluation

AURA AI incorporates observability and evaluation to improve the reliability of LLM-powered applications.

- **LangSmith:** Inspect traces, monitor agent execution, and debug workflows.
- **LLM Evaluation:** Assess response quality and identify areas for improvement.
- **NeMo Guardrails:** Add safety controls to AI-generated interactions.

---

## 🎯 Project Objectives

This project explores how to build and deploy a production-oriented AI chatbot by combining:

- Agentic AI and LangGraph workflows.
- Retrieval-Augmented Generation.
- Conversational memory.
- LLM safety and guardrails.
- Evaluation and observability.
- Authentication and user management.
- Full-stack application development.
- Docker-based deployment.

---

## 🚀 Try AURA AI

Experience the application here:

### 👉 [Launch AURA AI – Live Demo](https://aura-ai-agentic-rag-chatbot-1.onrender.com/)

### 👉 [Explore the GitHub Repository](https://github.com/GauravPatil777/Aura-Ai_Agentic-Rag-Chatbot)

---

## 👨‍💻 Author

**Gaurav Patil**

B.E. Computer Engineering | AI/ML & Full-Stack Development

- GitHub: [GauravPatil777](https://github.com/GauravPatil777)
- LinkedIn: [Gaurav Patil](https://www.linkedin.com/in/gaurav-patil45/)

---

⭐ If you find this project interesting, consider giving the repository a star!