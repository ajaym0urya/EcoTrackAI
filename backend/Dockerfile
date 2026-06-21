FROM python:3.12-slim

WORKDIR /app

# Install build dependencies for compiling packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend codebase
COPY . ./backend

# Define default port and add parent to path to support packages imports
EXPOSE 8000
ENV PYTHONPATH=/app

# Run server with uvicorn listening on port 8000
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
