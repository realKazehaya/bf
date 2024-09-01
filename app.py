from flask import Flask, redirect, url_for, session, render_template
from flask_dance.contrib.discord import make_discord_blueprint, discord
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')  # Genera una clave secreta por defecto si no está en .env
app.config['SESSION_COOKIE_NAME'] = 'biolink_session'

# Configura el blueprint de Discord
discord_bp = make_discord_blueprint(
    client_id=os.getenv('DISCORD_CLIENT_ID'),
    client_secret=os.getenv('DISCORD_CLIENT_SECRET'),
    redirect_to='discord_callback',
    scope=['identify', 'email']
)
app.register_blueprint(discord_bp, url_prefix='/discord_login')

@app.route('/')
def home():
    if not discord.authorized:
        return redirect(url_for('discord.login'))
    resp = discord.get('/api/v10/users/@me')
    assert resp.ok, resp.text
    user_info = resp.json()
    return render_template('index.html', user=user_info)

@app.route('/perfil')
def perfil():
    if not discord.authorized:
        return redirect(url_for('discord.login'))
    resp = discord.get('/api/v10/users/@me')
    assert resp.ok, resp.text
    user_info = resp.json()
    return render_template('perfil.html', user=user_info)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

# Callback route for OAuth2
@app.route('/discord_login/callback')
def discord_callback():
    if not discord.authorized:
        return redirect(url_for('discord.login'))
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)
