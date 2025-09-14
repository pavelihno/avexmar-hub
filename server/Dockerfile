FROM python:3.12-slim-bullseye AS builder

WORKDIR /app

COPY requirements.txt /app/requirements.txt

RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libcairo2 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    shared-mime-info \
    libffi-dev \
    libjpeg-dev \
    zlib1g-dev \
    && pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt \
    && apt-get purge -y --auto-remove libffi-dev libjpeg-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

FROM python:3.12-slim-bullseye AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libcairo2 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local /usr/local
COPY . /app

RUN chmod +x /app/start.sh \
    && python -m pip cache purge \
    && python -m pip uninstall -y pip setuptools wheel || true \
    && rm -rf /root/.cache/pip

EXPOSE 8000

ENV FLASK_APP='app/app.py'

CMD ["bash", "/app/start.sh"]
