# app/views/auth_views.py

from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, logout_user, login_required
from app.models.user import User
from app.forms.login_form import LoginForm 
from app import login_manager
from flask import session
from flask_login import current_user


auth = Blueprint('auth', __name__, template_folder='templates')

@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)

@auth.route('/')
def index():
    if current_user.is_authenticated: 
        return redirect(url_for('main.main_page'))  
    return redirect(url_for('auth.login'))

@auth.route("/login", methods=["GET", "POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user, session_code, instance = User.authenticate(form.username.data, form.password.data, form.token.data, form.is_sandbox.data)
        if user:
            session['login_data'] = {
                'username': form.username.data,
                'password': form.password.data,
                'security_token': form.token.data,
                'is_sandbox': form.is_sandbox.data
            }
            
            session['session_code'] = session_code
            session['instance'] = instance
            
            login_user(user)
            return redirect(url_for("main.main_page")) 
        else:
            flash('Invalid credentials or Salesforce authentication failed.')
    return render_template('login.html', form=form)

@auth.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))
