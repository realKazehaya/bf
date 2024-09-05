from flask import Blueprint, redirect, request, session, url_for, flash
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
    
    # Verifica si el código existe
    if not code:
        flash('No se proporcionó código de autorización.', 'error')
        return redirect(url_for('auth.login'))
    
    data = {
        'client_id': Config.DISCORD_CLIENT_ID,
        'client_secret': Config.DISCORD_CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': Config.DISCORD_REDIRECT_URI,
        'scope': 'identify'
    }
    
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    # Intercambia el código por un token
    response = requests.post(f"{Config.DISCORD_API_BASE_URL}/oauth2/token", data=data, headers=headers)
    
    if response.status_code != 200:
        flash('Error al obtener el token de Discord. Verifica tu configuración.', 'error')
        return redirect(url_for('auth.login'))
    
    credentials = response.json()
    
    # Obtiene los datos del usuario
    user_response = requests.get(
        f"{Config.DISCORD_API_BASE_URL}/users/@me",
        headers={"Authorization": f"Bearer {credentials.get('access_token')}"}
    )
    
    if user_response.status_code != 200:
        flash('Error al obtener datos del usuario desde Discord.', 'error')
        return redirect(url_for('auth.login'))
    
    user_data = user_response.json()

    discord_id = user_data['id']
    username = user_data['username'] + '#' + user_data['discriminator']
    avatar_hash = user_data['avatar']
    avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.png"

    # Comprueba si el usuario ya existe en la base de datos
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
