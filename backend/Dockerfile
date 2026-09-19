FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for PyMySQL/cryptography
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc default-libmysqlclient-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# Production WSGI server, listens on all interfaces so Docker network can reach it
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "3", "app:app"]
