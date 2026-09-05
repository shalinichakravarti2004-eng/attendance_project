// 🔐 ROLE PROTECTION
const API = "http://localhost:5000/api/faculty";
const role = localStorage.getItem("role");

if (!role || role.toLowerCase() !== "faculty") {
    alert("Access Denied – Faculty Only");
    window.location.href = "index.html";
}

// 📍 SHOW DEPT + BRANCH
document.getElementById("deptText").innerText =
    "Department: " + localStorage.getItem("department") +
    " | Branch: " + localStorage.getItem("branch");

// 🚪 LOGOUT
function logout() {
    localStorage.clear();
    window.location.replace("login.html"); // ✅ FIXED
}

fetch("http://localhost:5000/api/faculty/live-attendance")

let allStudents = [];

// 📥 LOAD STUDENTS
async function loadStudents() {
    try {
        const dept = localStorage.getItem("department");
        const branch = localStorage.getItem("branch");

        const res = await fetch(`${API}/students?department=${dept}&branch=${branch}`);
        const result = await res.json();

        if (result.success) {
            allStudents = result.students || result.data || [];
            renderTable(allStudents);
        }

    } catch (err) {
        console.error(err);
    }
}

// 🧾 RENDER TABLE (FIXED HEADER ISSUE)
function renderTable(data) {
    const table = document.getElementById("studentTable");
    table.innerHTML = "";

    data.forEach(s => {

        let statusColor = "gray";
        if (s.today_status === "Present") statusColor = "green";
        if (s.today_status === "Absent") statusColor = "red";

        table.innerHTML += `
            <tr>
                <td>${s.enrollment_id}</td>
                <td>${s.name}</td>
                <td>${s.branch}</td>
                <td>${s.attendance_percentage}%</td>
                <td style="color:${statusColor}; font-weight:bold;">
                    ${s.today_status}
                </td>
                <td>
                    <button class="btn" onclick="viewStudent('${s.enrollment_id}')">View</button>
                    <button class="btn" onclick="markAbsent('${s.enrollment_id}')">Absent</button>
                </td>
            </tr>
        `;
    });
}

// 👁️ VIEW STUDENT (WORKING)
function viewStudent(enrollment) {
    window.location.href = `reports.html?enrollment=${enrollment}`;
}

// ❌ FORCE ABSENT (LOCK SYSTEM)
async function markAbsent(enrollment) {
    if (!confirm("Mark this student as Absent?")) return;

    try {
        const res = await fetch(`${API}/mark-absent`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ enrollment_id: enrollment })
        });

        const data = await res.json();

        if (data.success) {
            alert("Marked Absent (Locked)");
            loadStudents();
        }

    } catch (err) {
        console.error(err);
    }
}

// 🔍 SEARCH
function searchName(value) {
    value = value.toLowerCase();

    const filtered = allStudents.filter(s =>
        s.name.toLowerCase().includes(value) ||
        s.enrollment_id.toLowerCase().includes(value)
    );

    renderTable(filtered);
}

// 🔄 LIVE AUTO REFRESH
setInterval(async () => {
    try {
        const res = await fetch("http://localhost:5000/api/faculty/live-attendance");

        if (!res.ok) throw new Error("Server error");

        const result = await res.json();

        if (!result.success) return;

        const liveData = result.data;

        // 🔥 UPDATE TABLE STATUS
        allStudents.forEach(student => {

            const found = liveData.find(
                l => l.enrollment_id === student.enrollment_id
            );

            if (found) {
                student.today_status = "Present";
            }
        });

        renderTable(allStudents);

    } catch (err) {
        console.error("Live Attendance Error:", err);
    }
}, 5000);


loadStudents();