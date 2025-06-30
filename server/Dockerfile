FROM python:3.12-slim-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y libpq-dev gcc

COPY requirements.txt /app/requirements.txt

RUN pip install --upgrade pip setuptools && pip install --no-cache-dir -r requirements.txt

COPY . /app

EXPOSE 5000

ENV FLASK_APP='app/app.py'

# CMD ["python3", "-m", "flask", "run", "--host=0.0.0.0"]
CMD ["python3", "-m", "flask", "run", "--host=0.0.0.0", "--debug"]