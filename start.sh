#!/bin/bash

# Iniciar la aplicación Flask
python app.py &

# Iniciar el bot de Discord desde la ruta correcta
python discord_bot/bot.py
