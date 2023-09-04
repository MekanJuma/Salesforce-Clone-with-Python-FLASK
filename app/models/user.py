from werkzeug.security import generate_password_hash
from simple_salesforce import SalesforceLogin

class User:
    def __init__(self, username, security_token):
        self.id = self.generate_id(username)  # Use the hash of the username as the ID
        self.username = username
        self.security_token = security_token
        self.sf = None

    def generate_id(self, username):
        return generate_password_hash(username)

    @classmethod
    def authenticate(cls, username, password, security_token, is_sandbox):
        try:
            session, instance = SalesforceLogin(username=username, password=password, security_token=security_token, domain='test' if is_sandbox else None, sf_version='58.0')
            return cls(username, security_token), session, instance
        except:
            return None

    @classmethod
    def get(cls, user_id):
        return cls(user_id, None)

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.id)
