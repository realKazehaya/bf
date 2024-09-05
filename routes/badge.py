from flask import Blueprint, request, jsonify
from models.user import db, User

badge_bp = Blueprint('badge', __name__)

@badge_bp.route('/assign_badge', methods=['POST'])
def assign_badge():
    data = request.get_json()
    discord_id = data.get('discord_id')
    badge = data.get('badge')

    if badge not in ['staff', 'vip', 'famoso']:
        return jsonify({'error': 'Insignia no válida'}), 400

    user = User.query.filter_by(discord_id=discord_id).first()
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    if badge not in user.badges:
        user.badges.append(badge)
        db.session.commit()

    return jsonify({'message': 'Insignia asignada correctamente'}), 200
