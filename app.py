import os
from flask import Flask, redirect, url_for
from flask_session import Session
from models.user import db
from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.badge import badge_bp
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Inicializar la base de datos
    db.init_app(app)

    # Configurar las sesiones
    Session(app)

    # Registrar los Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(badge_bp)

    # Crear las tablas en la base de datos
    with app.app_context():
        db.create_all()

    @app.route('/')
    def index():
        return redirect(url_for('profile.dashboard'))

    return app

if __name__ == "__main__":
    app = create_app()  # Crear la instancia de la aplicación
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
