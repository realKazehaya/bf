from flask import Flask, request, jsonify, redirect, url_for, render_template, flash
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_wtf import FlaskForm
from wtforms import SelectField, IntegerField, HiddenField
from wtforms.validators import DataRequired, NumberRange
from flask_wtf.csrf import CSRFProtect
import os
import requests

# Inicialización de la aplicación
app = Flask(__name__)
app.config.from_object('config.Config')
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'supersecretkey')  # Necesario para flash messages
db = SQLAlchemy(app)
migrate = Migrate(app, db)
csrf = CSRFProtect(app)

DISCORD_WEBHOOK_URL = os.getenv('DISCORD_WEBHOOK_URL')

# Modelos
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

# Formulario de Retiro con Flask-WTF
class WithdrawalForm(FlaskForm):
    user_id = HiddenField(validators=[DataRequired()])
    region = SelectField('Región', choices=[
        ('AL', 'América Latina'), ('NA', 'América del Norte'), 
        ('SA', 'América del Sur'), ('AS', 'Asia'), 
        ('EEUU', 'Europa (EEUU)'), ('MEA', 'Medio Oriente y África'), 
        ('IN', 'India'), ('ID', 'Indonesia'), ('PK', 'Pakistán'), 
        ('TH', 'Tailandia')
    ], validators=[DataRequired()])
    diamonds = IntegerField('Diamantes', validators=[
        DataRequired(), NumberRange(min=1, message="Debes retirar al menos 1 diamante.")
    ])

# Rutas
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
    form = WithdrawalForm()

    if form.validate_on_submit():  # POST request with valid CSRF token
        try:
            user_id = int(form.user_id.data)
            region = form.region.data
            diamonds = int(form.diamonds.data)

            # Validar si el usuario existe y tiene suficientes diamantes
            user = User.query.get(user_id)
            if not user:
                flash('Usuario no encontrado.', 'error')
                return redirect(url_for('withdraw', user_id=user_id))
            if user.diamonds < diamonds:
                flash('No tienes diamantes suficientes para retirar.', 'error')
                return redirect(url_for('withdraw', user_id=user_id))

            # Restar diamantes y registrar el retiro
            user.diamonds -= diamonds
            withdrawal = Withdrawal(user_id=user.id, region=region, diamonds=diamonds)
            db.session.add(withdrawal)
            db.session.commit()

            # Enviar información al webhook de Discord
            webhook_payload = {
                'content': f"Solicitud de Retiro:\nRegión: {region}\nID: {user.freefire_id}\nDiamantes: {diamonds}\nFecha: {withdrawal.requested_at}"
            }
            requests.post(DISCORD_WEBHOOK_URL, json=webhook_payload)

            flash('Solicitud de retiro recibida.', 'success')
            return redirect(url_for('profile', user_id=user_id))

        except Exception as e:
            app.logger.error(f'Error en /withdraw: {e}')
            flash('Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.', 'error')
            return redirect(url_for('withdraw', user_id=form.user_id.data))

    elif request.method == 'GET':
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            flash('ID de usuario no proporcionado.', 'error')
            return redirect(url_for('index'))
        form.user_id.data = user_id
        return render_template('withdraw.html', form=form)

@app.route('/faq')
def faq():
    return render_template('faq.html')

if __name__ == '__main__':
    app.run(debug=True)
