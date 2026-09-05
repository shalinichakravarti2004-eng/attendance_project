from flask import Blueprint, request, jsonify
from db import get_db_connection

admin_bp = Blueprint("admin_bp", __name__)

# =========================
# 🔐 LOGIN (FIXED + CLEAN ✅)
# =========================
@admin_bp.route("/login", methods=["POST"])
def admin_login():

    
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM admins WHERE email=%s", (email,))
    admin = cursor.fetchone()

    cursor.close()
    conn.close()

    if admin and admin["password"] == password:
        return jsonify({
            "success": True,
            "role": admin["role"],
            "department": admin["department"],
            "branch": admin["branch"]
        })
    else:
        return jsonify({
            "success": False,
            "message": "Invalid credentials"
        }), 401
    

# =========================
# ➕ ADD STUDENT
# =========================
@admin_bp.route("/add-student", methods=["POST"])
def add_student():
    data = request.json

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
    INSERT INTO students 
    (enrollment_id, name, gender, department, branch, mobile, email, password)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
""", (
    data["enrollment_id"],
    data["name"],
    data.get("gender"),
    data.get("department"),
    data.get("branch"),   # ✅ NEW
    data.get("mobile"),
    data.get("email"),
    data.get("password")
))

        conn.commit()
        return jsonify({"success": True, "message": "Student added successfully"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

    finally:
        cursor.close()
        conn.close()


# =========================
# 📋 VIEW STUDENTS
# =========================
@admin_bp.route("/students", methods=["GET"])
def view_students():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    department = request.args.get("department")

    if department:
        cursor.execute(
            "SELECT * FROM students WHERE department=%s ORDER BY created_at DESC",
            (department,)
        )
    else:
        cursor.execute("SELECT * FROM students ORDER BY created_at DESC")

    students = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({"success": True, "students": students})


# =========================
# ❌ DELETE STUDENT
# =========================
@admin_bp.route("/delete-student/<enrollment_id>", methods=["DELETE"])
def delete_student(enrollment_id):

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM attendance WHERE enrollment_id=%s", (enrollment_id,))
        cursor.execute("DELETE FROM students WHERE enrollment_id=%s", (enrollment_id,))
        conn.commit()

        return jsonify({"success": True, "message": "Student deleted successfully"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

    finally:
        cursor.close()
        conn.close()

# =========================
# 📊 DASHBOARD STATS APIs (🔥 ADD THIS)
# =========================

@admin_bp.route("/stats/total-students", methods=["GET"])
def total_students():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM students")
    total = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    return jsonify({"total": total})


@admin_bp.route("/stats/today-present", methods=["GET"])
def today_present():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT COUNT(*) FROM attendance 
        WHERE status='Present' AND DATE(date)=CURDATE()
    """)
    present = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    return jsonify({"present": present})


@admin_bp.route("/stats/today-absent", methods=["GET"])
def today_absent():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 🔹 Total students
    cursor.execute("SELECT COUNT(*) FROM students")
    total_students = cursor.fetchone()[0]

    # 🔹 Present students today
    cursor.execute("""
        SELECT COUNT(DISTINCT enrollment_id) 
        FROM attendance 
        WHERE status='Present' AND DATE(date)=CURDATE()
    """)
    present = cursor.fetchone()[0]

    absent = total_students - present

    cursor.close()
    conn.close()

    return jsonify({"absent": absent})
   

@admin_bp.route("/stats/departments", methods=["GET"])
def departments():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(DISTINCT department) FROM students")
    dept = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    return jsonify({"departments": dept})

# =========================
# ✏ UPDATE STUDENT
# =========================
@admin_bp.route("/update-student/<enrollment_id>", methods=["PUT"])
def update_student(enrollment_id):
    data = request.json

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
    UPDATE students SET
    name=%s,
    gender=%s,
    department=%s,
    branch=%s,
    mobile=%s,
    email=%s
    WHERE enrollment_id=%s
""", (
    data["name"],
    data["gender"],
    data["department"],
    data["branch"],   # ✅ ADD THIS
    data["mobile"],
    data["email"],
    enrollment_id
))

        conn.commit()

        return jsonify({"success": True, "message": "Student updated successfully"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

    finally:
        cursor.close()
        conn.close()

# =========================
# 📊 ATTENDANCE PERCENT (HOD USE)
# =========================
@admin_bp.route("/attendance/<enrollment_id>", methods=["GET"])
def attendance_percent(enrollment_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 🔹 total classes
        cursor.execute("""
            SELECT COUNT(*) as total 
            FROM attendance 
            WHERE enrollment_id=%s
        """, (enrollment_id,))
        total = cursor.fetchone()["total"]

        # 🔹 present classes
        cursor.execute("""
            SELECT COUNT(*) as present 
            FROM attendance 
            WHERE enrollment_id=%s AND status='Present'
        """, (enrollment_id,))
        present = cursor.fetchone()["present"]

        percent = 0
        if total > 0:
            percent = round((present / total) * 100, 2)

        return jsonify({
            "success": True,
            "total": total,
            "present": present,
            "percentage": percent
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

    finally:
        cursor.close()
        conn.close()


@admin_bp.route("/mark-od", methods=["POST"])
def mark_od():
    data = request.json

    enrollment_id = data.get("enrollment_id")
    from_date = data.get("from_date")
    to_date = data.get("to_date")
    reason = data.get("reason")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        import datetime

        start = datetime.datetime.strptime(from_date, "%Y-%m-%d")
        end = datetime.datetime.strptime(to_date, "%Y-%m-%d")

        current = start

        while current <= end:
            cursor.execute("""
                INSERT INTO attendance (enrollment_id, date, status)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE status=%s
            """, (
                enrollment_id,
                current.date(),
                "OD",   # ✅ special status
                "OD"
            ))

            current += datetime.timedelta(days=1)

        conn.commit()

        return jsonify({"success": True, "message": "OD marked successfully"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

    finally:
        cursor.close()
        conn.close()

