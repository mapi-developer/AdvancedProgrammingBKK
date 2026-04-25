FROM python:3.10-slim

# Install only the minimal system dependencies needed for psycopg2 (PostgreSQL adapter)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy dependency list and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Expose the FastAPI port
EXPOSE 8000

# Note: The actual execution command (uvicorn) is already defined in your docker-compose.yml,
# but providing a default CMD is good Docker practice.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]