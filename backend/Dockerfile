FROM python:3.11-bookworm

WORKDIR /app

# Install system dependencies with retry logic and error handling
RUN set -ex; \
    apt-get update -y && \
    apt-get install -y --no-install-recommends \
        postgresql-client \
        gcc \
        python3-dev \
        libyaml-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir PyYAML==6.0.1

# Copy project files
COPY . .

# Create media directory
RUN mkdir -p media

# Set Python path
ENV PYTHONPATH=/app

# Run migrations and collect static files
CMD ["sh", "-c", "python manage.py migrate && python manage.py collectstatic --noinput && python manage.py runserver 0.0.0.0:8000"] 