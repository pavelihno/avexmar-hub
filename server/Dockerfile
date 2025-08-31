FROM python:3.12-slim-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    build-essential \
    libglib2.0-0 \
    libcairo2 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    libjpeg-dev \
    zlib1g-dev \
    shared-mime-info \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt

RUN pip install --upgrade pip setuptools && pip install --no-cache-dir -r requirements.txt

COPY . /app

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8000

ENV FLASK_APP='app/app.py'

CMD ["bash", "/app/start.sh"]