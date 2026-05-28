FROM python:3.11-slim

# HF Spaces convention: run as a non-root user with UID 1000.
RUN useradd --create-home --uid 1000 user
USER user
ENV PATH="/home/user/.local/bin:${PATH}" \
    HF_HOME="/home/user/.cache/huggingface" \
    PYTHONUNBUFFERED=1

WORKDIR /home/user/app

COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

COPY --chown=user app ./app

# HF Spaces routes traffic to port 7860.
EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
