import os
from flask import Flask, render_template, request, redirect, session, url_for
import sqlite3
import requests

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'supersecretkey')

# Conexión a la base de datos
def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

# Ruta principal - Página de inicio
@app.route('/')
def index():
    if 'roblox_username' in session:
        return redirect(url_for('profile'))
    return render_template('index.html')

# Ruta de inicio de sesión
@app.route('/login', methods=['POST'])
def login():
    roblox_username = request.form['username']
    avatar_url = get_roblox_avatar_url(roblox_username)
    
    # Guardar datos de sesión
    session['roblox_username'] = roblox_username
    session['avatar_url'] = avatar_url
    
    return redirect(url_for('profile'))

# Función para obtener el avatar de Roblox
def get_roblox_avatar_url(username):
    roblox_api_url = f'https://api.roblox.com/users/get-by-username?username={username}'
    try:
        response = requests.get(roblox_api_url)
        response.raise_for_status()  # Verifica que la solicitud fue exitosa
        data = response.json()
        if 'Id' in data:
            user_id = data['Id']
            avatar_url = f'https://www.roblox.com/headshot-thumbnail/image?userId={user_id}&width=420&height=420&format=png'
            return avatar_url
    except requests.RequestException as e:
        # Imprime el error y maneja el problema de conexión
        print(f"Error fetching Roblox avatar: {e}")
    return None

# Página de perfil del usuario
@app.route('/profile')
def profile():
    if 'roblox_username' in session:
        roblox_username = session['roblox_username']
        avatar_url = session.get('avatar_url')

        # Consultar los Robux ganados
        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE roblox_username = ?', (roblox_username,)).fetchone()
        robux_earned = user['robux_earned'] if user else 0
        conn.close()

        return render_template('profile.html', username=roblox_username, avatar_url=avatar_url, robux_earned=robux_earned)
    return redirect(url_for('index'))

# Página de encuestas (Surveys)
@app.route('/surveys')
def surveys():
    if 'roblox_username' in session:
        return render_template('surveys.html')
    return redirect(url_for('index'))

# Página para retirar Robux (Withdraw)
@app.route('/withdraw')
def withdraw():
    if 'roblox_username' in session:
        return render_template('withdraw.html')
    return redirect(url_for('index'))

# Ruta de soporte
@app.route('/support')
def support():
    # Redirigir al enlace de Discord
    return redirect("https://discord.gg/your-discord-group")

# Crear la base de datos y tabla
def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            roblox_username TEXT UNIQUE NOT NULL,
            robux_earned INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
