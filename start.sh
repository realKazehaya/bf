#!/bin/bash

# Ejecutar el script de inicialización de la base de datos
python init_db.py

# Ejecutar Gunicorn para el entorno de producción
gunicorn --bind 0.0.0.0:5000 app:app
