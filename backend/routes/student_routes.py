from flask import Blueprint, request, jsonify
from db import get_db_connection

student_bp = Blueprint("student", __name__)

@student_bp.route("/profile", methods=["POST"])
def get_profile():
    try:
        data = request.get_json()
        enrollment_id = data.get("enrollment_id")

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT name, enrollment_id, gender, department, email, mobile
            FROM students
            WHERE enrollment_id = %s
        """, (enrollment_id,))

        student = cursor.fetchone()

        cursor.close()
        conn.close()

        if student:
            return jsonify({
                "success": True,
                "data": student
            })
        else:
            return jsonify({
                "success": False,
                "message": "Student not found"
            })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })
    
@student_bp.route("/update-profile", methods=["POST"])
def update_profile():
    try:
        data = request.get_json()

        enrollment_id = data.get("enrollment_id")
        email = data.get("email")
        mobile = data.get("mobile")

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE students
            SET email = %s, mobile = %s
            WHERE enrollment_id = %s
        """, (email, mobile, enrollment_id))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Profile updated successfully"
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })
