import os

class Config:
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'your_secret_key')  # Ajustado el nombre de la variable de entorno
    SESSION_TYPE = 'filesystem'

    DISCORD_CLIENT_ID = os.getenv('DISCORD_CLIENT_ID', 'your_client_id')
    DISCORD_CLIENT_SECRET = os.getenv('DISCORD_CLIENT_SECRET', 'your_client_secret')
    DISCORD_REDIRECT_URI = os.getenv('DISCORD_REDIRECT_URI', 'http://localhost:5000/auth/callback')  # Asegúrate de agregarla en Render
    DISCORD_API_BASE_URL = 'https://discord.com/api'

    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
