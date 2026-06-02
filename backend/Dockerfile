FROM python:3.13-slim

# Prevent writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies for psycopg2 and building libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project source
COPY . /app/

# Expose port
EXPOSE 8000

# Start command (migrations and collection will run from docker-compose or start script)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
