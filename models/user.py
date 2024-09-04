from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    discord_id = db.Column(db.String(50), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    avatar_url = db.Column(db.String(200))
    social_links = db.Column(db.JSON, nullable=False, default={})
    background_image = db.Column(db.String(200))
    background_music = db.Column(db.String(200))
    cursor_style = db.Column(db.String(100))
    badges = db.Column(db.JSON, nullable=False, default=[])
    visit_count = db.Column(db.Integer, default=0)

    def __init__(self, discord_id, username, avatar_url, background_image=None, background_music=None, cursor_style=None):
        self.discord_id = discord_id
        self.username = username
        self.avatar_url = avatar_url
        self.social_links = {}
        self.badges = []
        self.background_image = background_image
        self.background_music = background_music
        self.cursor_style = cursor_style
        self.visit_count = 0
