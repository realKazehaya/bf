#!/bin/bash

# Activar el entorno virtual, si estás usando uno
# source venv/bin/activate

# Ejecutar las migraciones de la base de datos (opcional, si estás usando algo como Alembic)
# flask db upgrade

# Iniciar la aplicación Flask
python app.py &

# Iniciar el bot de Discord
python bot.py
