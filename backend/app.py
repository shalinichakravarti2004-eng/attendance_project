from flask import Flask, request
from flask_cors import CORS
from flask_mail import Mail
from flask_session import Session
from dotenv import load_dotenv
from datetime import timedelta
import os

load_dotenv()

app = Flask(__name__, static_folder="frontend", static_url_path="")
app.secret_key = "supersecretkey"

# =========================
# ✅ STRONG CORS FIX
# =========================
CORS(app, supports_credentials=True)

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        return "", 200

@app.after_request
def add_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5500"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# =========================
# ✅ MAIL CONFIG
# =========================
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv("EMAIL_USER")
app.config['MAIL_PASSWORD'] = os.getenv("EMAIL_PASS")

# =========================
# ✅ SESSION CONFIG
# =========================
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=10)

Session(app)

mail = Mail(app)

# =========================
# ✅ IMPORT BLUEPRINTS
# =========================
from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.student_routes import student_bp
from routes.attendance_routes import attendance_bp
from routes.faculty_routes import faculty_bp

app.register_blueprint(faculty_bp, url_prefix="/api/faculty")
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(student_bp, url_prefix="/api/student")
app.register_blueprint(attendance_bp, url_prefix="/api/attendance")

# =========================
# ✅ RUN
# =========================
if __name__ == "__main__":
    app.run(debug=True)