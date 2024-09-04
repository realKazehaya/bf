from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    discord_id = db.Column(db.String(50), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    avatar_url = db.Column(db.String(200))
    social_links = db.Column(db.JSON)
    background_image = db.Column(db.String(200))
    background_music = db.Column(db.String(200))
    cursor_style = db.Column(db.String(100))
    badges = db.Column(db.ARRAY(db.String))
    visit_count = db.Column(db.Integer, default=0)

    def __init__(self, discord_id, username, avatar_url):
        self.discord_id = discord_id
        self.username = username
        self.avatar_url = avatar_url
        self.social_links = {}
        self.badges = []
