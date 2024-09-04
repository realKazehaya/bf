import os

class Config:
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY')
    SESSION_TYPE = 'redis'
    SESSION_REDIS = os.environ.get('REDIS_URL')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DISCORD_CLIENT_ID = os.environ.get('DISCORD_CLIENT_ID')
    DISCORD_CLIENT_SECRET = os.environ.get('DISCORD_CLIENT_SECRET')
    DISCORD_REDIRECT_URI = os.environ.get('BASE_URL') + '/auth/callback'
    DISCORD_API_BASE_URL = 'https://discord.com/api'
    DISCORD_WEBHOOK_URL = os.environ.get('DISCORD_WEBHOOK_URL')
    BASE_URL = os.environ.get('BASE_URL')
