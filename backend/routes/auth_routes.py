from flask import Blueprint, request, jsonify, session, current_app
from flask_mail import Message
from db import get_db_connection   # ✅ IMPORTANT FIX
import random, time

auth_bp = Blueprint("auth_bp", __name__)

OTP_EXPIRY = 300  # 5 minutes


# =========================
# ✅ STUDENT LOGIN
# =========================
@auth_bp.route("/student-login", methods=["POST"])
def student_login():
    data = request.get_json()

    enrollment_id = data.get("enrollment_id")
    email = data.get("email")
    password = data.get("password")

    # ✅ DB CONNECTION
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # ✅ CHECK USER
    cursor.execute(
        "SELECT * FROM students WHERE enrollment_id=%s AND email=%s",
        (enrollment_id, email)
    )
    user = cursor.fetchone()

    if not user:
        return jsonify({"success": False, "message": "Invalid credentials ❌"})

    # ✅ SESSION SAVE
    session["enrollment_id"] = user["enrollment_id"]
    session["email"] = user["email"]

    # ✅ OTP
    otp = str(random.randint(100000, 999999))
    session["otp"] = otp
    session["otp_time"] = time.time()

    # ✅ SEND MAIL
    msg = Message(
        subject="Your OTP Code",
        sender=current_app.config["MAIL_USERNAME"],
        recipients=[user["email"]]
    )
    msg.body = f"Your OTP is {otp}"

    current_app.extensions["mail"].send(msg)

    return jsonify({
        "success": True,
        "enrollment_id": user["enrollment_id"],
        "email": user["email"],
        "message": "OTP sent successfully"
    })


# =========================
# ✅ VERIFY OTP
# =========================
@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json()

    print("SESSION DATA:", dict(session))

    user_otp = data.get("otp")
    session_otp = session.get("otp")
    otp_time = session.get("otp_time")

    if not session_otp:
        return jsonify({"success": False, "message": "Session expired ❌"})

    if not otp_time or time.time() - otp_time > OTP_EXPIRY:
        return jsonify({"success": False, "message": "OTP expired ❌"})

    if session_otp != user_otp:
        return jsonify({"success": False, "message": "Invalid OTP ❌"})

    # ✅ LOGIN SUCCESS
    session["logged_in"] = True

    return jsonify({
        "success": True,
        "message": "OTP verified ✅",
        "enrollment_id": session.get("enrollment_id")
    })


# =========================
# ✅ RESEND OTP
# =========================
@auth_bp.route("/resend-otp", methods=["POST"])
def resend_otp():

    session_email = session.get("email")

    if not session_email:
        return jsonify({"success": False, "message": "Session expired ❌"})

    otp = str(random.randint(100000, 999999))
    session["otp"] = otp
    session["otp_time"] = time.time()

    msg = Message(
        subject="Resent OTP",
        sender=current_app.config["MAIL_USERNAME"],
        recipients=[session_email]
    )
    msg.body = f"Your new OTP is {otp}"

    current_app.extensions["mail"].send(msg)

    return jsonify({"success": True, "message": "OTP resent successfully ✅"})


@auth_bp.route("/change-password", methods=["POST"])
def change_password():
    data = request.get_json()

    enrollment_id = data.get("enrollment_id")
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    # ✅ 1. validation
    if not enrollment_id or not old_password or not new_password:
        return jsonify({"message": "Missing fields ❌"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # ✅ 2. get user
    cursor.execute(
        "SELECT password FROM students WHERE enrollment_id=%s",
        (enrollment_id,)
    )
    user = cursor.fetchone()

    if not user:
        return jsonify({"message": "User not found ❌"}), 404

    db_password = str(user["password"]).strip()
    old_password = str(old_password).strip()

    # ✅ 3. DEBUG (TEMP — remove later)
    print("DB:", db_password)
    print("INPUT:", old_password)

    # ✅ 4. compare safely
    if db_password != old_password:
        return jsonify({"message": "Old password incorrect ❌"}), 400

    # ✅ 5. update password
    cursor.execute(
        "UPDATE students SET password=%s WHERE enrollment_id=%s",
        (new_password.strip(), enrollment_id)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Password changed successfully ✅"})