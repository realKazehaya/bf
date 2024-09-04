from flask import Blueprint, redirect, request, session, url_for
from urllib.parse import urlencode
import requests
from models.user import db, User
from config import Config

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login')
def login():
    params = {
        'client_id': Config.DISCORD_CLIENT_ID,
        'redirect_uri': Config.DISCORD_REDIRECT_URI,
        'response_type': 'code',
        'scope': 'identify'
    }
    url = f"{Config.DISCORD_API_BASE_URL}/oauth2/authorize?{urlencode(params)}"
    return redirect(url)

@auth_bp.route('/auth/callback')
def callback():
    code = request.args.get('code')
    data = {
        'client_id': Config.DISCORD_CLIENT_ID,
        'client_secret': Config.DISCORD_CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': Config.DISCORD_REDIRECT_URI,
        'scope': 'identify'
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    response = requests.post(f"{Config.DISCORD_API_BASE_URL}/oauth2/token", data=data, headers=headers)
    credentials = response.json()
    access_token = credentials.get('access_token')

    user_response = requests.get(
        f"{Config.DISCORD_API_BASE_URL}/users/@me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    user_data = user_response.json()

    discord_id = user_data['id']
    username = user_data['username'] + '#' + user_data['discriminator']
    avatar_hash = user_data['avatar']
    avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.png"

    user = User.query.filter_by(discord_id=discord_id).first()
    if not user:
        user = User(discord_id=discord_id, username=username, avatar_url=avatar_url)
        db.session.add(user)
        db.session.commit()

    session['user_id'] = user.id

    return redirect(url_for('profile.dashboard'))

@auth_bp.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('auth.login'))
