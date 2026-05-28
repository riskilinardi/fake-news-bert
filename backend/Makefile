.PHONY: install dev test test-integration lint docker-build docker-run clean

install:
	pip install -r requirements-dev.txt

dev:
	uvicorn app.main:app --reload --port 8000

test:
	pytest -v

test-integration:
	RUN_INTEGRATION=1 pytest tests/test_integration.py -v

lint:
	ruff check app tests

docker-build:
	docker build -t fake-news-backend .

docker-run:
	docker run --rm -p 7860:7860 \
		-e MODEL_NAME="$${MODEL_NAME:-bert-base-uncased}" \
		fake-news-backend

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name .pytest_cache -exec rm -rf {} +
	rm -rf .ruff_cache
