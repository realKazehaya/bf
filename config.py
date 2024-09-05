import os

class Config:
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'your_secret_key')  # Ajustado el nombre de la variable de entorno
    SESSION_TYPE = 'filesystem'

    DISCORD_CLIENT_ID = os.getenv('DISCORD_CLIENT_ID', '1279932838631968851')
    DISCORD_CLIENT_SECRET = os.getenv('DISCORD_CLIENT_SECRET', 'd5NsN3kx_--CKtN_JtRE7ITd8IaxhiYb')
    DISCORD_REDIRECT_URI = os.getenv('DISCORD_REDIRECT_URI', 'https://bf-1.onrender.com/auth/callback')  # Asegúrate de agregarla en Render
    DISCORD_API_BASE_URL = 'https://discord.com/api'

    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
