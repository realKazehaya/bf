import os
from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
import requests

app = Flask(__name__)

# Configurar la clave secreta
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'clave_secreta_por_defecto')

# Configurar la URI de la base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://ff:hGJOuC7QjMydteDbt22CgG3oQXA47dyh@dpg-criccfjv2p9s738g854g-a.oregon-postgres.render.com/ff_27eh'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar SQLAlchemy
db = SQLAlchemy(app)

# Definir modelos aquí
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    balance = db.Column(db.Integer, default=0)

# Crear la base de datos
with app.app_context():
    db.create_all()

# Página principal
@app.route('/')
def index():
    if 'user_id' in session:
        user = User.query.filter_by(username=session['user_id']).first()
        if user:
            return render_template('index.html', user_id=user.username, balance=user.balance)
    return render_template('index.html')

# Página de inicio de sesión
@app.route('/login', methods=['POST'])
def login():
    user_id = request.form.get('freefire_id')
    if user_id:
        user = User.query.filter_by(username=user_id).first()
        if not user:
            user = User(username=user_id)
            db.session.add(user)
            db.session.commit()
        session['user_id'] = user.username
        return redirect(url_for('index'))
    else:
        flash('Debes ingresar un ID válido.')
        return redirect(url_for('index'))

# Página de retiro
@app.route('/withdraw', methods=['GET', 'POST'])
def withdraw():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    
    user = User.query.filter_by(username=session['user_id']).first()
    if not user:
        return redirect(url_for('index'))

    if request.method == 'POST':
        diamonds = int(request.form.get('diamonds', 0))
        if diamonds >= 100 and diamonds <= user.balance:
            # Simular el envío a Discord (aquí llamaríamos a un bot real)
            flash(f'Solicitud de retiro enviada por {diamonds} diamantes.')
            user.balance -= diamonds
            db.session.commit()
        else:
            flash('Debes retirar al menos 100 diamantes y no puedes retirar más de tu balance.')
        return redirect(url_for('withdraw'))

    return render_template('withdraw.html', balance=user.balance)

if __name__ == '__main__':
    app.run(debug=True)
