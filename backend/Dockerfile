# Use a Python base image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy the requirements.txt file into the container
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app code into the container
COPY app.py .

# Copy the service account key file into the container
COPY kubeletes-4bf0d7b9a7c5.json /app/kubeletes-4bf0d7b9a7c5.json
COPY inverted_index.json /app/inverted_index.json

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6

# Expose the port that Flask will run on
EXPOSE 5000

# Run the Flask app
CMD ["python", "app.py"]
