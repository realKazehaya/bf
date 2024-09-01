from flask import Flask, redirect, url_for, request, render_template
import requests
from flask_dance.contrib.discord import make_discord_blueprint, discord
import os

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'mysecret')  # Usa una clave secreta segura

# Configura Flask-Dance para autenticarse con Discord
discord_bp = make_discord_blueprint(
    client_id=os.getenv('DISCORD_CLIENT_ID'),
    client_secret=os.getenv('DISCORD_CLIENT_SECRET'),
    redirect_to='profile'  # La función 'profile' manejará la URI de redirección
)
app.register_blueprint(discord_bp, url_prefix='/discord_login')

DISCORD_WEBHOOK_URL = os.getenv('DISCORD_WEBHOOK_URL')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login')
def login():
    if not discord.authorized:
        return redirect(url_for('discord.login'))
    return redirect(url_for('profile'))

@app.route('/profile')
def profile():
    if not discord.authorized:
        return redirect(url_for('discord.login'))
    
    try:
        user_info = discord.get('/users/@me')
        user_info.raise_for_status()  # Verifica si la solicitud a la API fue exitosa
        user = user_info.json()
        
        # Enviar información a Discord
        data = {
            'content': f'Inicio de sesión: Usuario {user["username"]} ({user["id"]})',
            'username': 'BiolinkBot'
        }
        response = requests.post(DISCORD_WEBHOOK_URL, json=data)
        response.raise_for_status()  # Verifica si la solicitud al webhook fue exitosa
        
        return render_template('perfil.html', user=user)
    except requests.exceptions.RequestException as e:
        # Manejar errores de red o HTTP
        print(f"Error al enviar mensaje al webhook o al obtener información del usuario: {e}")
        return "Ocurrió un error al procesar tu solicitud", 500
    except Exception as e:
        # Manejar otros errores
        print(f"Error interno: {e}")
        return "Ocurrió un error interno en el servidor", 500

@app.route('/logout')
def logout():
    discord.logout()
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)
