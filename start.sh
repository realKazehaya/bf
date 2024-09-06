#!/bin/bash

# Ejecutar Gunicorn para el entorno de producción
gunicorn --bind 0.0.0.0:5000 app:app
