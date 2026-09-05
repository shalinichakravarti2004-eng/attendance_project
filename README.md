# Smart Attendance System

A web-based **Smart Attendance Management System** that automates student attendance using **OTP-based authentication and face verification**. The system provides separate dashboards and attendance management features for students, faculty, HODs, and administrators.

## 📌 Project Overview

The Smart Attendance System is designed to simplify and automate the traditional attendance process.

Students can log in using their registered details and OTP verification, capture their face during the initial setup, and use face verification for subsequent attendance marking. The system manages check-in and check-out records and provides attendance reports through a web-based interface.

## ✨ Key Features

* 🔐 **OTP-Based Authentication**

  * Secure login using registered email and OTP verification.
  * OTP expiry and resend functionality.

* 👤 **Face Verification**

  * Face capture during the initial student setup.
  * Face verification for subsequent attendance-related authentication.

* 🕐 **Check-In / Check-Out**

  * Students can mark check-in and check-out attendance.
  * Attendance status is automatically maintained based on attendance activity.
  * A minimum time gap is maintained between check-in and check-out.

* 📊 **Attendance Reports**

  * View attendance records and monthly attendance information.
  * Attendance status includes Present, Pending, and Absent.

* 👨‍🎓 **Student Management**

  * Student registration and profile management.
  * Attendance history and personal information.

* 👨‍🏫 **Faculty & HOD Management**

  * Faculty and HOD dashboards for managing and monitoring attendance-related activities.

* 👨‍💼 **Admin Dashboard**

  * Manage students, faculty, departments, and attendance-related data.

* 🗄️ **Database Management**

  * MySQL database used for storing student, authentication, and attendance information.

## 🛠️ Technologies Used

### Frontend

* HTML5
* CSS3
* Bootstrap
* JavaScript

### Backend

* Python
* Flask

### Database

* MySQL

### Other Technologies / Libraries

* DeepFace
* OpenCV
* Flask-CORS
* Flask Session
* OTP / Email Service

## 🏗️ System Architecture

The system follows a client-server architecture:

```text
User
  ↓
Frontend (HTML / CSS / JavaScript)
  ↓
Flask Backend
  ↓
Authentication & Attendance APIs
  ↓
MySQL Database
```

Face verification services are integrated into the backend for identity verification.

## 📁 Project Structure

```text
attendance_project/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── db.py
│   ├── requirements.txt
│   │
│   ├── models/
│   │   ├── admin_model.py
│   │   ├── attendance_model.py
│   │   └── student_model.py
│   │
│   ├── routes/
│   │   ├── admin_routes.py
│   │   ├── attendance_routes.py
│   │   ├── auth_routes.py
│   │   ├── faculty_routes.py
│   │   └── student_routes.py
│   │
│   └── utils/
│       ├── face_recognition.py
│       ├── helpers.py
│       └── otp_service.py
│
├── frontend/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── admin.js
│   │   ├── attendance.js
│   │   ├── change-password.js
│   │   ├── faculty.js
│   │   ├── hod.js
│   │   ├── login.js
│   │   ├── my-attendance.js
│   │   ├── profile.js
│   │   ├── report.js
│   │   └── verify.js
│   │
│   ├── dashboard-admin.html
│   ├── dashboard-student.html
│   ├── faculty-dashboard.html
│   ├── hod-dashboard.html
│   ├── index.html
│   ├── mark-attendance.html
│   ├── my-attendance.html
│   ├── profile.html
│   ├── reports.html
│   └── verify-otp.html
│
└── .gitignore
```

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/shalinichakravarti2004-eng/attendance_project.git
```

### 2. Navigate to the Project

```bash
cd attendance_project
```

### 3. Create a Virtual Environment

```bash
python -m venv .venv
```

### 4. Activate the Virtual Environment

**Windows:**

```bash
.venv\Scripts\activate
```

### 5. Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### 6. Configure MySQL

Create the required MySQL database and configure the database credentials in the backend configuration file.

### 7. Configure Environment Variables

Add the required configuration values such as database credentials, email/OTP settings, and application secrets according to your local environment.

### 8. Run the Flask Application

```bash
python backend/app.py
```

Then open the frontend through the configured local development server.

## 🔄 Attendance Workflow

```text
Student Login
      ↓
OTP Verification
      ↓
Face Setup / Face Verification
      ↓
Attendance Authentication
      ↓
Check-In
      ↓
Check-Out
      ↓
Attendance Status Updated
      ↓
Reports & Attendance History
```

## 📊 Attendance Status

The system maintains attendance based on the student's attendance activity.

* **Present** — valid check-in and check-out completed.
* **Pending** — check-in recorded but check-out is not completed.
* **Absent** — no valid attendance recorded for the applicable day.

## 🎯 Objectives

The main objectives of this project are:

1. To reduce manual attendance work.
2. To provide a more automated attendance marking process.
3. To improve attendance record management.
4. To provide secure student authentication.
5. To make attendance records and reports easily accessible.
6. To reduce errors associated with traditional attendance systems.

## 🚀 Future Scope

The system can be further enhanced with:

* Cloud deployment.
* Mobile application support.
* Advanced analytics and attendance visualization.
* Automated notifications for low attendance.
* Improved face-recognition performance.
* Integration with college ERP systems.
* Role-based access control enhancements.
* Automated report generation and export.

## 👩‍💻 Developer

**Shalini Chakrawarti**

MCA Graduate | Python Full Stack Developer

## 📄 License

This project is developed for educational and portfolio purposes.
