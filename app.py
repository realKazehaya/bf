import os
from flask import Flask, render_template, request, redirect, session, url_for, flash
import sqlite3
import requests
import json
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'supersecretkey')

# Conexión a la base de datos
def get_db_connection():
    try:
        conn = sqlite3.connect('database.db')
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        print(f"Error connecting to database: {e}")
        return None

# Ruta principal - Página de inicio
@app.route('/')
def index():
    if 'roblox_username' in session:
        return render_template('index.html', logged_in=True)
    return render_template('index.html', logged_in=False)

# Ruta de inicio de sesión
@app.route('/login', methods=['POST'])
def login():
    roblox_username = request.form['username']
    avatar_url = get_roblox_avatar_url(roblox_username)

    if avatar_url is None:
        flash('Error al obtener el avatar de Roblox. Intenta nuevamente.', 'error')
        return redirect(url_for('index'))
    
    # Guardar datos de sesión
    session['roblox_username'] = roblox_username
    session['avatar_url'] = avatar_url
    
    # Crear el usuario si no existe
    conn = get_db_connection()
    if conn:
        try:
            conn.execute('''
                INSERT OR IGNORE INTO users (roblox_username, robux_earned) 
                VALUES (?, 0)
            ''', (roblox_username,))
            conn.commit()
        except sqlite3.Error as e:
            print(f"Error inserting user: {e}")
        finally:
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
        if conn:
            try:
                user = conn.execute('SELECT * FROM users WHERE roblox_username = ?', (roblox_username,)).fetchone()
                withdrawals = conn.execute('SELECT * FROM withdrawals WHERE roblox_username = ?', (roblox_username,)).fetchall()
                conn.close()

                balance = user['robux_earned'] if user else 0

                return render_template('profile.html', username=roblox_username, avatar_url=avatar_url, balance=balance, withdrawals=withdrawals)
            except sqlite3.Error as e:
                print(f"Database error: {e}")
                return "Error al acceder a la base de datos.", 500
        else:
            return "No se pudo conectar a la base de datos.", 500
    return redirect(url_for('index'))

# Página de retiro de Robux
@app.route('/withdraw', methods=['GET', 'POST'])
def withdraw():
    if 'roblox_username' not in session:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        roblox_username = session['roblox_username']
        try:
            amount = int(request.form['amount'])
        except ValueError:
            return "Cantidad inválida", 400

        conn = get_db_connection()
        if conn:
            try:
                user = conn.execute('SELECT * FROM users WHERE roblox_username = ?', (roblox_username,)).fetchone()

                if user and user['robux_earned'] >= amount:
                    # Restar la cantidad del balance
                    new_balance = user['robux_earned'] - amount
                    conn.execute('UPDATE users SET robux_earned = ? WHERE roblox_username = ?', (new_balance, roblox_username))
                    conn.execute('INSERT INTO withdrawals (roblox_username, amount, date) VALUES (?, ?, ?)', 
                                (roblox_username, amount, datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
                    conn.commit()
                else:
                    return "Fondos insuficientes", 400

            except sqlite3.Error as e:
                print(f"Database error: {e}")
                return "Error al acceder a la base de datos.", 500
            finally:
                conn.close()

            # Enviar a la webhook de Discord
            webhook_url = 'https://discord.com/api/webhooks/1281796784053813268/QL9Uu5Y3fZ_PXDQ0iCA337Bg-cLDxs6tCrU7IG-wrb42cibPXNPDRLcnBumU5FsMgUp0'
            data = {
                "content": f"Withdraw Request\nUSERNAME: {roblox_username}\nR$: {amount}\nDATE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            }
            discord_response = requests.post(webhook_url, data=json.dumps(data), headers={'Content-Type': 'application/json'})
            
            if discord_response.status_code != 204:
                print(f"Error sending to Discord webhook: {discord_response.status_code}, {discord_response.text}")

            return redirect(url_for('profile'))
    
    return render_template('withdraw.html')

# Página de encuestas
@app.route('/surveys')
def surveys():
    if 'roblox_username' not in session:
        return redirect(url_for('index'))
    return render_template('surveys.html')

# Ruta para cerrar sesión
@app.route('/logout')
def logout():
    session.clear()  # Eliminar todos los datos de la sesión
    return redirect(url_for('index'))  # Redirigir a la página de inicio

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
