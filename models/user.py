from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSON

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    discord_id = db.Column(db.String(50), unique=True, nullable=False)
    username = db.Column(db.String(100), nullable=False)
    avatar_url = db.Column(db.String(200), nullable=True)
    badges = db.Column(JSON, default=[])
    visit_count = db.Column(db.Integer, default=0)
    background_image = db.Column(db.String(200), nullable=True)
    background_music = db.Column(db.String(200), nullable=True)
    cursor_style = db.Column(db.String(100), nullable=True)
    social_links = db.Column(JSON, default={})
