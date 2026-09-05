// ✅ CORRECT APIs
const ADMIN_API = "http://localhost:5000/api/admin";
const ATTENDANCE_API = "http://localhost:5000/api/attendance";

const role = localStorage.getItem("role");
const userDept = localStorage.getItem("department");

let allStudents = [];

// =========================
// 🔐 SECURITY (HOD ONLY)
// =========================
if (!role || role.toUpperCase() !== "HOD") {
    alert("Access Denied! HOD only.");
    window.location.href = "index.html";
}

// =========================
// 🔹 SHOW DEPARTMENT
// =========================
const deptText = document.getElementById("deptText");
if (deptText) {
    deptText.innerText = "Department: " + userDept;
}

// =========================
// 🔹 LOAD STUDENTS
// =========================
async function loadStudents() {
    try {
        const res = await fetch(`${ADMIN_API}/students?department=${userDept}`);
        const result = await res.json();

        console.log("HOD DATA:", result);

        allStudents = result.students || [];
        renderTable(allStudents);

    } catch (err) {
        console.error("Error loading students:", err);
    }
}

// =========================
// 🔹 RENDER TABLE
// =========================
async function renderTable(list) {
    const studentTable = document.getElementById("studentTable");

    studentTable.innerHTML = `
        <tr>
            <th>Enrollment</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Branch</th>
            <th>Attendance %</th>
            <th>Action</th>
        </tr>
    `;

    for (let s of list) {

        let percent = "0%";

        try {
            const res = await fetch(`${ADMIN_API}/attendance/${s.enrollment_id}`);
            const data = await res.json();

            if (data.success) {
                percent = data.percentage + "%";
            }
        } catch (err) {
            console.error(err);
        }

        studentTable.innerHTML += `
        <tr>
            <td>${s.enrollment_id}</td>
            <td>${s.name}</td>
            <td>${s.email}</td>
            <td>${s.department}</td>
            <td>${s.branch}</td>
            <td>${percent}</td>
            <td>
                <button onclick="viewStudent('${s.enrollment_id}')">View</button>
            </td>
        </tr>`;
    }
}

// =========================
// 🔍 SEARCH
// =========================
function searchTable() {
    let input = document.getElementById("search").value.toLowerCase();

    const filtered = allStudents.filter(s =>
        (s.name && s.name.toLowerCase().includes(input)) ||
        (s.enrollment_id && s.enrollment_id.toLowerCase().includes(input))
    );

    renderTable(filtered);
}

// =========================
// 👁 VIEW STUDENT
// =========================
function viewStudent(id) {
    window.location.href = `reports.html?enrollment=${id}`;
}

// =========================
// 🚪 LOGOUT
// =========================
function logout() {
    if (!confirm("Logout?")) return;

    localStorage.clear();
    window.location.href = "index.html";
}

// =========================
// 🚀 INIT
// =========================
window.onload = () => {
    loadStudents();
};

// =========================
// 🟢 MARK OD
// =========================
async function markOD() {

    const data = {
        enrollment_id: document.getElementById("odEnrollment").value,
        from_date: document.getElementById("odFrom").value,
        to_date: document.getElementById("odTo").value,
        reason: document.getElementById("odReason").value
    };

    try {
        const res = await fetch(`${ADMIN_API}/mark-od`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        document.getElementById("odMsg").innerText = result.message;

    } catch (err) {
        console.error(err);
    }
}

// =========================
// 🔴 CANCEL / UPDATE OD
// =========================
async function updateAttendance() {

    const data = {
        enrollment_id: document.getElementById("cancelEnrollment").value,
        date: document.getElementById("cancelDate").value,
        status: document.getElementById("cancelStatus").value
    };

    try {
        const res = await fetch(`${ATTENDANCE_API}/update-attendance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        document.getElementById("cancelMsg").innerText = result.message;

        // ✅ REFRESH TABLE AFTER UPDATE
        loadStudents();

    } catch (err) {
        console.error(err);
        document.getElementById("cancelMsg").innerText = "Error updating attendance";
    }
}