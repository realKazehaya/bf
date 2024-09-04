#!/bin/bash

# Iniciar la aplicación Flask
python app.py &

# Iniciar el bot de Discord
python discord_bot/bot.py &

# Esperar que ambos procesos finalicen
wait
