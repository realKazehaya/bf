#!/bin/bash

export FLASK_APP=app.py
export FLASK_ENV=production

exec gunicorn -b 0.0.0.0:5000 app:app
