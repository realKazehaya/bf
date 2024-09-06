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

# Función para obtener el avatar de Roblox con la API actualizada
def get_roblox_avatar_url(username):
    roblox_api_url = f'https://users.roblox.com/v1/users/search?keyword={username}'
    try:
        response = requests.get(roblox_api_url)
        response.raise_for_status()
        data = response.json()

        # Verificar si se encontró un usuario
        if data['data']:
            user_id = data['data'][0]['id']
            # Nueva API para obtener el avatar
            thumbnail_url = f'https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds={user_id}&size=150x150&format=Png&isCircular=false'
            thumbnail_response = requests.get(thumbnail_url)
            thumbnail_data = thumbnail_response.json()

            if thumbnail_data['data']:
                avatar_url = thumbnail_data['data'][0]['imageUrl']
                return avatar_url
        else:
            print("Usuario no encontrado en la API de Roblox.")
    except requests.RequestException as e:
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
        try:
            user = conn.execute('SELECT * FROM users WHERE roblox_username = ?', (roblox_username,)).fetchone()
            robux_earned = user['robux_earned'] if user else 0
        except sqlite3.OperationalError as e:
            print(f"Error accessing database: {e}")
            robux_earned = 0
        finally:
            conn.close()

        return render_template('profile.html', username=roblox_username, avatar_url=avatar_url, robux_earned=robux_earned)
    return redirect(url_for('index'))

# Ruta de soporte
@app.route('/support')
def support():
    return redirect("https://discord.gg/your-discord-group")

@app.route('/logout')
def logout():
    # Limpiar la sesión
    session.clear()
    # Redirigir al usuario a la página principal
    return redirect(url_for('index'))

# Crear la base de datos y tabla
def init_db():
    try:
        conn = get_db_connection()
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                roblox_username TEXT UNIQUE NOT NULL,
                robux_earned INTEGER DEFAULT 0
            )
        ''')
        conn.commit()
    except sqlite3.Error as e:
        print(f"Error initializing database: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
