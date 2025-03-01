# Use the official Python 3.11 image as the base image
FROM python:3.11-slim

# Set the working directory inside the container to /app
WORKDIR /src

# Update pip to the latest version
RUN python -m pip install --upgrade pip

# Copy the requirements.txt file into the container
COPY requirements.txt /src/

# Set the environment variable LOGS_LEVEL
ENV LOGS_LEVEL=1

# Install dependencies from the requirements.txt file
RUN pip install --no-cache-dir -r requirements.txt

# Copy all the application code into the container (including /src folder and /app.py)
COPY . /src/

# Expose the port your Flask app will run on
EXPOSE 5000

# Command to run the Flask app
CMD ["python", "app.py"]
