FROM python:3.12-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy NeMo configuration
COPY config/ ./config/

# Add backend to Python path
ENV PYTHONPATH=/app/backend

EXPOSE 8000

# Start FastAPI
CMD ["sh", "-c", "uvicorn main:app --app-dir /app/backend --host 0.0.0.0 --port ${PORT:-8000}"]