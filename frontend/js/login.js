console.log("LOGIN FUNCTION STARTED");
// ===== LOGIN FUNCTION =====
function login() {

    let roleType = document.getElementById("role").value;
    let msg = document.getElementById("msg");

    msg.innerText = "Please wait...";

    // ===== STUDENT LOGIN =====
    if (roleType === "student") {

        let enrollment = document.getElementById("enrollment").value;
        let email = document.getElementById("studentEmail").value;
        let mobile = document.getElementById("mobile").value;
        let password = document.getElementById("studentPassword").value;

        fetch("http://localhost:5000/api/auth/student-login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                enrollment_id: enrollment,
                email: email,
                mobile: mobile,
                password: password
            })
        })
        .then(res => res.json())
        .then(data => {

            if (data.success) {

                // Save data
                localStorage.setItem("role", "student");
                localStorage.setItem("enrollment_id", data.enrollment_id);
                localStorage.setItem("email", data.email);

                // Redirect
                window.location.href = "verify-otp.html";

            } else {
                msg.innerText = data.message;
            }

        })
        .catch(() => {
            msg.innerText = "Server error ❌";
        });

    }

    // ===== STAFF LOGIN (Admin / HOD / Faculty) =====
    else {

        let email = document.getElementById("email").value;
        let password = document.getElementById("password").value;

        fetch("http://localhost:5000/api/admin/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        })
        .then(res => res.json())
        .then(data => {

            console.log(data.role); // ✅ PUT IT HERE
            if (data.success) {

                // Save role & department
                localStorage.setItem("role", data.role);
                localStorage.setItem("department", data.department);
                localStorage.setItem("branch", data.branch);   // ✅ ADD THIS

                // ===== ROLE BASED REDIRECT =====
                if (data.role === "admin") {
                    window.location.href = "dashboard-admin.html";
                }
                else if (data.role === "hod") {
                    window.location.href = "hod-dashboard.html";
                }
                else if (data.role === "faculty") {
                    window.location.href = "faculty-dashboard.html";
                }

            } else {
                msg.innerText = data.message;
            }

        })
        .catch(() => {
            msg.innerText = "Server error ❌";
        });

    }
}


// ===== TOGGLE FIELDS =====
function toggleFields() {

    let role = document.getElementById("role").value;

    if (role === "student") {
        document.getElementById("adminFields").style.display = "none";
        document.getElementById("studentFields").style.display = "block";
    } else {
        document.getElementById("adminFields").style.display = "block";
        document.getElementById("studentFields").style.display = "none";
    }
}


// ===== LOGOUT FUNCTION =====
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}