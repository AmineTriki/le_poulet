FROM python:3.12-slim AS builder

WORKDIR /app
RUN pip install uv
COPY pyproject.toml .
RUN uv pip install --system --no-cache .

FROM python:3.12-slim AS runtime

RUN useradd -m -u 1000 poulet
WORKDIR /app

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .

RUN chown -R poulet:poulet /app
USER poulet

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import httpx; httpx.get('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
