import os
from flask import Flask, render_template, request, redirect, session, url_for
import sqlite3
import requests
import json
from datetime import datetime

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
    
    # Crear el usuario si no existe
    conn = get_db_connection()
    conn.execute('''
        INSERT OR IGNORE INTO users (roblox_username, robux_earned) 
        VALUES (?, 0)
    ''', (roblox_username,))
    conn.commit()
    conn.close()
    
    return redirect(url_for('profile'))

# Función para obtener el avatar de Roblox
def get_roblox_avatar_url(username):
    roblox_api_url = f'https://users.roblox.com/v1/users/search?keyword={username}'
    try:
        response = requests.get(roblox_api_url)
        response.raise_for_status()
        data = response.json()

        if data['data']:
            user_id = data['data'][0]['id']
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

        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE roblox_username = ?', (roblox_username,)).fetchone()
        withdrawals = conn.execute('SELECT * FROM withdrawals WHERE roblox_username = ?', (roblox_username,)).fetchall()
        conn.close()

        balance = user['robux_earned'] if user else 0

        return render_template('profile.html', username=roblox_username, avatar_url=avatar_url, balance=balance, withdrawals=withdrawals)
    return redirect(url_for('index'))

# Página de retiro de Robux
@app.route('/withdraw', methods=['GET', 'POST'])
def withdraw():
    if 'roblox_username' not in session:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        roblox_username = session['roblox_username']
        amount = int(request.form['amount'])

        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE roblox_username = ?', (roblox_username,)).fetchone()

        if user and user['robux_earned'] >= amount:
            # Restar la cantidad del balance
            new_balance = user['robux_earned'] - amount
            conn.execute('UPDATE users SET robux_earned = ? WHERE roblox_username = ?', (new_balance, roblox_username))
            conn.execute('INSERT INTO withdrawals (roblox_username, amount, date) VALUES (?, ?, ?)', 
                         (roblox_username, amount, datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
            conn.commit()
            conn.close()

            # Enviar a la webhook de Discord
            webhook_url = 'https://discord.com/api/webhooks/1281796784053813268/QL9Uu5Y3fZ_PXDQ0iCA337Bg-cLDxs6tCrU7IG-wrb42cibPXNPDRLcnBumU5FsMgUp0'
            data = {
                "content": f"Withdraw Request\nUSERNAME: {roblox_username}\nR$: {amount}\nDATE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            }
            requests.post(webhook_url, data=json.dumps(data), headers={'Content-Type': 'application/json'})

            return redirect(url_for('profile'))
        else:
            return "Fondos insuficientes", 400
    
    return render_template('withdraw.html')

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
        conn.execute('''
            CREATE TABLE IF NOT EXISTS withdrawals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                roblox_username TEXT NOT NULL,
                amount INTEGER NOT NULL,
                date TEXT NOT NULL
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
