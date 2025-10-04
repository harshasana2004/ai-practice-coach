FROM python:3.11-slim
WORKDIR /code
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt
COPY ./app.py /code/app.py
EXPOSE 7860
# Use a single worker for stability and add a long timeout
CMD ["gunicorn", "--workers", "1", "--timeout", "300", "--bind", "0.0.0.0:7860", "app:app"]