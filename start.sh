#!/bin/bash

# Ejecutar migraciones
flask db upgrade

# Iniciar el servidor
gunicorn -b 0.0.0.0:5000 app:app
