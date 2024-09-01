#!/bin/bash

# Ejecutar la aplicación Flask con gunicorn
gunicorn -b 0.0.0.0:8000 app:app
