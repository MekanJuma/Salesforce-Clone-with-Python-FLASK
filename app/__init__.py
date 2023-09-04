from flask import Flask
from flask_login import LoginManager

# Create an instance of LoginManager
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    app.secret_key = 'some_secret_key'

    # Initialize login_manager with the app
    login_manager.init_app(app)

    from .views import auth_views, main_views  # Ensure these imports are correct
    app.register_blueprint(auth_views.auth)  # No prefix for the auth blueprint
    app.register_blueprint(main_views.main)  # Register the main blueprint

    return app
