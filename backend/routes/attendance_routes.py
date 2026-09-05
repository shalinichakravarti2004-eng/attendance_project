from flask import Blueprint, request, jsonify
from db import get_db_connection
import base64
import cv2
import numpy as np
from deepface import DeepFace
from datetime import datetime, timedelta
import math
import calendar

attendance_bp = Blueprint("attendance_bp", __name__)

# 📍 LOCATION CONFIG
COLLEGE_LAT = 23.14702584325091
COLLEGE_LON = 79.92262997561673
ALLOWED_RADIUS = 500  # meters


# -----------------------------
# DISTANCE FUNCTION
# -----------------------------
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    return R * c


# -----------------------------
# SAVE FACE
# -----------------------------
@attendance_bp.route("/save-face", methods=["POST"])
def save_face():
    data = request.json
    enrollment_id = data["enrollment_id"]
    image_data = data["image"]

    image_data = image_data.split(",")[1]
    image_bytes = base64.b64decode(image_data)

    np_array = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    _, buffer = cv2.imencode(".jpg", image)
    stored_image = base64.b64encode(buffer).decode("utf-8")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM face_data WHERE enrollment_id=%s",
        (enrollment_id,)
    )
    existing = cursor.fetchone()

    if existing:
        return jsonify({"success": False, "message": "Face already registered"})

    cursor.execute(
        "INSERT INTO face_data (enrollment_id, face_image) VALUES (%s, %s)",
        (enrollment_id, stored_image)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True, "message": "Face registered successfully"})


# -----------------------------
# CHECK-IN
# -----------------------------
@attendance_bp.route("/check-in", methods=["POST"])
def check_in():
    data = request.json
    enrollment_id = data["enrollment_id"]
    image_data = data["image"]

    image_data = image_data.split(",")[1]
    image_bytes = base64.b64decode(image_data)
    np_array = np.frombuffer(image_bytes, np.uint8)
    captured_image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    # 📍 LOCATION CHECK
    user_lat = data.get("latitude")
    user_lon = data.get("longitude")

    if user_lat is None or user_lon is None:
        return jsonify({"success": False, "message": "Location required"})

    distance = calculate_distance(user_lat, user_lon, COLLEGE_LAT, COLLEGE_LON)

    if distance > ALLOWED_RADIUS:
        return jsonify({"success": False, "message": "You are out of allowed location"})

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT face_image FROM face_data WHERE enrollment_id=%s",
        (enrollment_id,)
    )
    result = cursor.fetchone()

    if not result:
        return jsonify({"success": False, "message": "Face not registered"})

    stored_image_base64 = result[0]
    stored_bytes = base64.b64decode(stored_image_base64)
    stored_np = np.frombuffer(stored_bytes, np.uint8)
    stored_image = cv2.imdecode(stored_np, cv2.IMREAD_COLOR)

    try:
        match = DeepFace.verify(captured_image, stored_image)["verified"]
    except:
        return jsonify({"success": False, "message": "Face verification error"})

    if not match:
        return jsonify({"success": False, "message": "Face not matched"})

    # ❌ SUNDAY BLOCK
    # 🔥 TEST MODE (ALLOW SUNDAY TEMPORARY)
    TEST_MODE = False   # ❗ Later change to False

    if datetime.now().weekday() == 6 and not TEST_MODE:
        return jsonify({
        "success": False,
        "message": "Sunday not allowed"
    })

    today = datetime.now().date()
    current_time = datetime.now().time()

    cursor.execute(
        "SELECT * FROM attendance WHERE enrollment_id=%s AND date=%s",
        (enrollment_id, today)
    )
    existing = cursor.fetchone()

    # 🔐 ✅ ADD THIS BLOCK HERE
    if existing and existing[3] == "Absent":   # assuming status is 4th column
        return jsonify({
        "success": False,
        "message": "Blocked by Faculty (Marked Absent)"
    })

    if existing:
        return jsonify({"success": False, "message": "Already checked-in"})

    cursor.execute(
        "INSERT INTO attendance (enrollment_id, date, check_in, status) VALUES (%s, %s, %s, %s)",
        (enrollment_id, today, current_time, "Pending")
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True, "message": "Check-in successful"})


# -----------------------------
# CHECK-OUT
# -----------------------------
@attendance_bp.route("/check-out", methods=["POST"])
def check_out():
    data = request.json
    enrollment_id = data["enrollment_id"]

    # ❌ BLOCK SUNDAY
    if datetime.now().weekday() == 6:
        return jsonify({
            "success": False,
            "message": "Sunday not allowed"
        })

    conn = get_db_connection()
    cursor = conn.cursor()

    today = datetime.now().date()

    # ✅ Get check_in and check_out
    cursor.execute(
        "SELECT check_in, check_out FROM attendance WHERE enrollment_id=%s AND date=%s",
        (enrollment_id, today)
    )
    record = cursor.fetchone()

    # ❌ No check-in
    if not record:
        return jsonify({"success": False, "message": "Check-in not done"})

    check_in_time = record[0]
    check_out_time = record[1]

    # ❌ Already checked-out
    if check_out_time:
        return jsonify({"success": False, "message": "Already checked out"})

    current_time = datetime.now().time()

    # ✅ Handle timedelta issue
    if isinstance(check_in_time, timedelta):
        check_in_time = (datetime.min + check_in_time).time()

    check_in_dt = datetime.combine(datetime.today(), check_in_time)
    current_dt = datetime.combine(datetime.today(), current_time)

    # ❌ Minimum 1 hour rule
    if current_dt - check_in_dt < timedelta(hours=1):
        return jsonify({"success": False, "message": "Wait at least 1 hour"})

    # ✅ Update attendance
    cursor.execute(
        "UPDATE attendance SET check_out=%s, status='Present' WHERE enrollment_id=%s AND date=%s",
        (current_time, enrollment_id, today)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True, "message": "Check-out successful"})
 

# -----------------------------
# STATUS
# -----------------------------
@attendance_bp.route("/status", methods=["POST"])
def check_attendance_status():
    try:
        data = request.json
        enrollment_id = data.get("enrollment_id")
        date = data.get("date")

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT check_in, check_out, status, marked_by
            FROM attendance 
            WHERE enrollment_id=%s AND date=%s
        """, (enrollment_id, date))

        result = cursor.fetchone()

        if not result:
            return jsonify({"status": "not_marked"})

        # ✅ Already checked-in but not checked-out
        if result["check_in"] and not result["check_out"]:
            return jsonify({
                "status": "checked_in",
                "message": "Show checkout button"
            })

        # ✅ Already checked-out
        if result["check_out"]:
            return jsonify({
                "status": "completed",
                "message": "Attendance complete"
            })

        return jsonify({"status": "unknown"})

    except Exception as e:
        print("STATUS ERROR:", e)
        return jsonify({"error": str(e)}), 500


# -----------------------------
# MY ATTENDANCE
# -----------------------------
@attendance_bp.route("/my-attendance", methods=["POST"])
def my_attendance():
    data = request.json
    enrollment_id = data["enrollment_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT date, check_in, check_out, status FROM attendance WHERE enrollment_id=%s",
        (enrollment_id,)
    )

    records = cursor.fetchall()

    for row in records:
        row["date"] = str(row["date"])
        row["check_in"] = str(row["check_in"]) if row["check_in"] else ""
        row["check_out"] = str(row["check_out"]) if row["check_out"] else ""
        row["status"] = row["status"] if row["status"] else ""

        if row["check_in"] and row["check_out"]:
            check_in_dt = datetime.strptime(row["check_in"], "%H:%M:%S")
            check_out_dt = datetime.strptime(row["check_out"], "%H:%M:%S")
            duration = check_out_dt - check_in_dt
            row["duration"] = str(duration)
        else:
            row["duration"] = "0:00"

    first_date = None
    if records:
        first_date = min(r["date"] for r in records)

    cursor.close()
    conn.close()

    return jsonify({
        "success": True,
        "data": records,
        "first_date": first_date
    })


# -----------------------------
# MONTHLY REPORT
# -----------------------------
@attendance_bp.route("/monthly-report/<enrollment_id>", methods=["GET"])
def monthly_report(enrollment_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    month = datetime.now().month
    year = datetime.now().year

    cursor.execute("""
        SELECT date, status FROM attendance
        WHERE enrollment_id=%s AND MONTH(date)=%s AND YEAR(date)=%s
    """, (enrollment_id, month, year))

    records = cursor.fetchall()

    today = datetime.now().date()
    start_date = today.replace(day=1)

    # ✅ Map date → status
    attendance_map = {}
    for r in records:
        attendance_map[r["date"]] = r["status"]

    present = 0
    absent = 0
    total_days = 0

    current = start_date

    while current <= today:

        # ❌ Skip Sunday
        if current.weekday() == 6:
            current += timedelta(days=1)
            continue

        total_days += 1

        if current in attendance_map:
            status = attendance_map[current]

            # ✅ IMPORTANT FIX (handles OD correctly)
            if status and ("present" in status.lower() or "od" in status.lower()):
                present += 1
            else:
                absent += 1
        else:
            absent += 1

        current += timedelta(days=1)

    cursor.close()
    conn.close()

    return jsonify({
        "present": present,
        "absent": absent,
        "total": total_days
    })


# -----------------------------
# UPDATE / CANCEL ATTENDANCE (HOD)
# -----------------------------
@attendance_bp.route("/update-attendance", methods=["POST"])
def update_attendance():

    data = request.json
    enrollment_id = data.get("enrollment_id")
    date = data.get("date")   # format: YYYY-MM-DD
    new_status = data.get("status")  # Present / Absent / OD / Cancel

    if not enrollment_id or not date or not new_status:
        return jsonify({"success": False, "message": "Missing data"})

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if record exists
    cursor.execute(
        "SELECT * FROM attendance WHERE enrollment_id=%s AND date=%s",
        (enrollment_id, date)
    )
    record = cursor.fetchone()

    if not record:
        return jsonify({"success": False, "message": "Record not found"})

    # ❌ If cancel → delete record
    if new_status.lower() == "cancel":
        cursor.execute(
            "DELETE FROM attendance WHERE enrollment_id=%s AND date=%s",
            (enrollment_id, date)
        )
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": "Attendance cancelled"})

    # ✅ Otherwise update status
    cursor.execute(
        "UPDATE attendance SET status=%s WHERE enrollment_id=%s AND date=%s",
        (new_status, enrollment_id, date)
    )

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True, "message": "Attendance updated"})
