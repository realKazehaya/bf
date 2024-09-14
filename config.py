import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'postgresql://ff:hGJOuC7QjMydteDbt22CgG3oQXA47dyh@dpg-criccfjv2p9s738g854g-a.oregon-postgres.render.com/ff_27eh'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DISCORD_WEBHOOK_URL = os.getenv('DISCORD_WEBHOOK_URL')
