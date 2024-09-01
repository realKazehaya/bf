#!/bin/bash

# Establece el entorno
export FLASK_APP=app.py
export FLASK_ENV=production

# Ejecuta la aplicación Flask
exec python -m flask run --host=0.0.0.0 --port=${PORT:-5000}
