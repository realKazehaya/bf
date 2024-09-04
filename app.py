import os  # Asegúrate de importar el módulo os
from flask import Flask
from flask_session import Session
from config import Config
from models.user import db
from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.badge import badge_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Inicializar la base de datos
    db.init_app(app)

    # Configurar sesiones
    server_session = Session(app)

    # Registrar Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(badge_bp)

    # Crear tablas si no existen
    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=os.environ.get('PORT', 5000))
