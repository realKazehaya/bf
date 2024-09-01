#!/bin/bash

# Activate the virtual environment
source .venv/bin/activate

# Run the Flask app using gunicorn
exec gunicorn --bind 0.0.0.0:$PORT app:app
