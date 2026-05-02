FROM python:3.12-slim

WORKDIR /app

RUN pip install uv

COPY pyproject.toml uv.lock ./
RUN uv export --no-dev --no-emit-project -o /tmp/requirements.txt && \
    uv pip install --system --no-cache -r /tmp/requirements.txt

COPY . .

ENV PORT=8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
