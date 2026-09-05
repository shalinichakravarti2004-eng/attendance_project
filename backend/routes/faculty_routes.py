from flask import Blueprint, request, jsonify
from db import get_db_connection
from datetime import datetime, timedelta

faculty_bp = Blueprint("faculty_bp", __name__)

# ✅ GET STUDENTS (STRICT BRANCH FILTER)
@faculty_bp.route("/students", methods=["GET"])
def get_students():
    department = request.args.get("department")
    branch = request.args.get("branch")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT enrollment_id, name, branch 
            FROM students 
            WHERE department=%s AND branch=%s
        """, (department, branch))

        students = cursor.fetchall()

        for s in students:

            cursor.execute("""
                SELECT COUNT(*) as total 
                FROM attendance 
                WHERE enrollment_id=%s
            """, (s["enrollment_id"],))
            total = cursor.fetchone()["total"]

            cursor.execute("""
                SELECT COUNT(*) as present 
                FROM attendance 
                WHERE enrollment_id=%s AND status='Present'
            """, (s["enrollment_id"],))
            present = cursor.fetchone()["present"]

            percent = round((present / total) * 100, 2) if total > 0 else 0

            s["attendance_percentage"] = percent

            # ✅ ✅ ADD THIS PART HERE (LIVE STATUS)
            cursor.execute("""
                SELECT status 
                FROM attendance 
                WHERE enrollment_id=%s AND date=CURDATE()
                """, (s["enrollment_id"],))

            today = cursor.fetchone()

            if today:
                s["today_status"] = today["status"]
            else:
                s["today_status"] = "Not Marked"

        return jsonify({"success": True, "students": students})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

    finally:
        cursor.close()
        conn.close()


# ✅ FORCE ABSENT WITH LOCK
@faculty_bp.route("/mark-absent", methods=["POST"])
def mark_absent():

    data = request.json
    enrollment_id = data.get("enrollment_id")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO attendance (enrollment_id, date, status)
            VALUES (%s, CURDATE(), 'Absent')
            ON DUPLICATE KEY UPDATE status='Absent'
        """, (enrollment_id,))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Marked Absent (Locked)"
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

    finally:
        cursor.close()
        conn.close()


@faculty_bp.route("/live-attendance", methods=["GET"])
def live_attendance():

    print("LIVE ATTENDANCE API CALLED")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        today = datetime.now().date()

        cursor.execute("""
            SELECT * FROM attendance 
            WHERE date=%s AND check_in IS NOT NULL
        """, (today,))

        data = cursor.fetchall()

        # ✅ FIX: Convert non-JSON fields
        for row in data:
            for key, value in row.items():

                # ✅ convert datetime
                if isinstance(value, datetime):
                    row[key] = value.strftime("%Y-%m-%d %H:%M:%S")

                # ✅ convert timedelta (MAIN ERROR FIX)
                elif isinstance(value, timedelta):
                    row[key] = str(value)

        return jsonify({
            "success": True,
            "data": data
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

    finally:
        cursor.close()
        conn.close()

