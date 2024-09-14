from flask import Flask, request, jsonify, redirect, url_for, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
import requests

app = Flask(__name__)
app.config.from_object('config.Config')
db = SQLAlchemy(app)
migrate = Migrate(app, db)

DISCORD_WEBHOOK_URL = os.getenv('DISCORD_WEBHOOK_URL')

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    freefire_id = db.Column(db.String(255), unique=True, nullable=False)
    diamonds = db.Column(db.Integer, default=0)
    last_login = db.Column(db.DateTime, default=db.func.current_timestamp())

class Survey(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    survey_name = db.Column(db.String(255))
    diamonds_earned = db.Column(db.Integer)
    completed_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class Withdrawal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    region = db.Column(db.String(255))
    diamonds = db.Column(db.Integer)
    requested_at = db.Column(db.DateTime, default=db.func.current_timestamp())

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    freefire_id = request.form['freefire_id']
    user = User.query.filter_by(freefire_id=freefire_id).first()

    if user:
        user.last_login = db.func.current_timestamp()
    else:
        user = User(freefire_id=freefire_id)
        db.session.add(user)

    db.session.commit()
    return redirect(url_for('profile', user_id=user.id))

@app.route('/profile/<int:user_id>')
def profile(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'Usuario no encontrado'}), 404

    return render_template('profile.html', user=user)

@app.route('/surveys/<int:user_id>', methods=['POST'])
def complete_survey(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'Usuario no encontrado'}), 404

    survey_name = request.form['survey_name']
    diamonds_earned = int(request.form['diamonds_earned'])

    user.diamonds += diamonds_earned
    survey = Survey(user_id=user.id, survey_name=survey_name, diamonds_earned=diamonds_earned)
    db.session.add(survey)
    db.session.commit()

    return jsonify({'message': 'Encuesta completada'}), 200

@app.route('/withdraw', methods=['GET', 'POST'])
def withdraw():
    if request.method == 'POST':
        user_id = int(request.form['user_id'])
        region = request.form['region']
        diamonds = int(request.form['diamonds'])

        user = User.query.get(user_id)
        if not user or user.diamonds < diamonds:
            return jsonify({'message': 'Usuario no encontrado o diamantes insuficientes'}), 400

        user.diamonds -= diamonds
        withdrawal = Withdrawal(user_id=user.id, region=region, diamonds=diamonds)
        db.session.add(withdrawal)
        db.session.commit()

        webhook_payload = {
            'content': f"Solicitud de Retiro:\nRegión: {region}\nID: {user.freefire_id}\nDiamantes: {diamonds}\nFecha: {withdrawal.requested_at}"
        }
        requests.post(DISCORD_WEBHOOK_URL, json=webhook_payload)

        return jsonify({'message': 'Solicitud de retiro recibida'}), 200
    else:
        # Mostrar el formulario para hacer un retiro
        return render_template('withdraw.html')

@app.route('/faq')
def faq():
    return render_template('faq.html')

if __name__ == '__main__':
    app.run(debug=True)
