from flask_wtf import FlaskForm

from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired

class LoginForm(FlaskForm):
    username = StringField('User Name', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    token = PasswordField('Security Token', validators=[DataRequired()])
    is_sandbox = BooleanField('Is Sandbox?')
    submit = SubmitField('Login')
