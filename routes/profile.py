from flask import Blueprint, render_template, session, redirect, url_for, request
from models.user import db, User
from functools import wraps

profile_bp = Blueprint('profile', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@profile_bp.route('/dashboard')
@login_required
def dashboard():
    user = User.query.get(session['user_id'])
    return render_template('dashboard.html', user=user)

@profile_bp.route('/profile/<username>')
def view_profile(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return "Usuario no encontrado", 404
    user.visit_count += 1
    db.session.commit()
    return render_template('profile.html', user=user)

@profile_bp.route('/edit_profile', methods=['GET', 'POST'])
@login_required
def edit_profile():
    user = User.query.get(session['user_id'])
    if request.method == 'POST':
        user.background_image = request.form.get('background_image')
        user.background_music = request.form.get('background_music')
        user.cursor_style = request.form.get('cursor_style')
        social_links = {
            'facebook': request.form.get('facebook'),
            'instagram': request.form.get('instagram'),
            'spotify': request.form.get('spotify'),
            'discord': request.form.get('discord'),
            'snapchat': request.form.get('snapchat'),
            'roblox': request.form.get('roblox'),
        }
        user.social_links = social_links
        db.session.commit()
        return redirect(url_for('profile.dashboard'))
    return render_template('edit_profile.html', user=user)
