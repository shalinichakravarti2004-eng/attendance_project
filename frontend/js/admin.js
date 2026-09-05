const addMsg = document.getElementById("msg");
const API = "http://localhost:5000/api/admin";

let allStudents = [];
let isEditMode = false;
let editId = null;

// ✅ GET ROLE
const role = localStorage.getItem("role");

// =========================
// 🔐 SECURITY (ADMIN ONLY)
// =========================
if (!role || role.toLowerCase() !== "admin") {
    alert("Access Denied! Admin only.");
    window.location.href = "index.html";
}

// =========================
// 🔹 ADD / UPDATE STUDENT
// =========================
async function addStudent() {

    const data = {
        enrollment_id: document.getElementById("enrollment").value,
        name: document.getElementById("name").value,
        gender: document.getElementById("gender").value,
        department: document.getElementById("departmentInput").value,
        branch: document.getElementById("branch").value,
        mobile: document.getElementById("mobile").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };

    try {

        if (isEditMode) {
            await fetch(`${API}/update-student/${editId}`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            addMsg.innerText = "Student updated!";
            isEditMode = false;
            editId = null;

        } else {
            await fetch(`${API}/add-student`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            addMsg.innerText = "Student added!";
        }

        clearForm();
        loadStudents();
        loadStats();

        document.querySelector("button.btn-success").innerText = "Add Student";
        document.getElementById("enrollment").disabled = false;

    } catch (err) {
        addMsg.innerText = "Operation failed!";
        console.error(err);
    }
}

// =========================
// 🔹 CLEAR FORM
// =========================
function clearForm() {
    document.getElementById("enrollment").value = "";
    document.getElementById("name").value = "";
    document.getElementById("gender").value = "";
    document.getElementById("departmentInput").value = "";
    document.getElementById("branch").value = "";
    document.getElementById("mobile").value = "";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";

    isEditMode = false;
    editId = null;

    document.getElementById("enrollment").disabled = false;
}

// =========================
// 🔹 LOAD STUDENTS (ADMIN = ALL)
// =========================
async function loadStudents() {
    try {

        const res = await fetch(`${API}/students`);
        const result = await res.json();

        allStudents = result.students || [];
        renderTable(allStudents);

    } catch (err) {
        console.error("Error loading students:", err);
    }
}

// =========================
// 🔹 RENDER TABLE
// =========================
function renderTable(data) {

    const table = document.getElementById("studentTable");

    table.innerHTML = "";

    data.forEach(s => {
        table.innerHTML += `
        <tr>
            <td>${s.enrollment_id}</td>
            <td>${s.name}</td>
            <td>${s.department}</td>
            <td>${s.branch}</td>
            <td>
                <!-- ✅ FIX ADDED -->
                <button class="btn btn-info btn-sm"
                onclick="viewStudent('${s.enrollment_id}')">View</button>

                <button class="btn btn-warning btn-sm"
                onclick="editStudent('${s.enrollment_id}', '${s.name}', '${s.gender}', '${s.department}', '${s.branch}', '${s.mobile}', '${s.email}')">
                Edit</button>

                <button class="btn btn-danger btn-sm"
                onclick="deleteStudent('${s.enrollment_id}')">
                Delete</button>
            </td>
        </tr>`;
    });
}

// =========================
// 🔹 VIEW STUDENT
// =========================
function viewStudent(enrollment) {
    window.location.href = `reports.html?enrollment=${enrollment}`;
}

// =========================
// 🔹 EDIT STUDENT
// =========================
function editStudent(id, n, g, d, b, m, e) {

    isEditMode = true;
    editId = id;

    document.getElementById("enrollment").value = id;
    document.getElementById("name").value = n;
    document.getElementById("gender").value = g;

    // ✅ STEP 1: Set department
    document.getElementById("departmentInput").value = d;

    // ✅ STEP 2: LOAD correct branches for that department
    loadBranches(d);

    // ✅ STEP 3: Set branch AFTER loading options
    setTimeout(() => {
        document.getElementById("branch").value = b;
    }, 100);

    document.getElementById("mobile").value = m;
    document.getElementById("email").value = e;

    document.getElementById("password").value = "";

    document.getElementById("enrollment").disabled = true;
    document.querySelector("button.btn-success").innerText = "Update Student";

    window.scrollTo(0, 0);
    addMsg.innerText = "Edit mode enabled";
}

// =========================
// 🔹 DELETE STUDENT
// =========================
async function deleteStudent(id) {

    if (!confirm("Delete this student?")) return;

    try {
        await fetch(`${API}/delete-student/${id}`, { method: "DELETE" });
        addMsg.innerText = "Deleted!";
        loadStudents();
        loadStats();
    } catch (err) {
        console.error(err);
    }
}

// =========================
// 🔹 LOAD STATS (ADMIN ONLY)
// =========================
async function loadStats() {
    try {

        const totalRes = await fetch(`${API}/stats/total-students`);
        const totalData = await totalRes.json();

        const presentRes = await fetch(`${API}/stats/today-present`);
        const presentData = await presentRes.json();

        const absentRes = await fetch(`${API}/stats/today-absent`);
        const absentData = await absentRes.json();

        const deptRes = await fetch(`${API}/stats/departments`);
        const deptData = await deptRes.json();

        document.getElementById("totalStudents").innerText = totalData.total;
        document.getElementById("todayPresent").innerText = presentData.present;
        document.getElementById("todayAbsent").innerText = absentData.absent;
        document.getElementById("deptCount").innerText = deptData.departments;

    } catch (error) {
        console.error("Stats loading error:", error);
    }
}

// =========================
// 🔹 INIT
// =========================
window.onload = () => {
    loadStudents();
    loadStats();
};

// =========================
// 🔹 LOGOUT
// =========================
function logout() {
    if (!confirm("Logout?")) return;

    localStorage.clear();
    window.location.href = "index.html";
}

function filterDept(dept) {
    if (!dept) {
        renderTable(allStudents);
        return;
    }

    const filtered = allStudents.filter(s => s.department === dept);
    renderTable(filtered);
}


function searchStudent() {
    const input = document.getElementById("searchInput").value.toLowerCase();

    const filtered = allStudents.filter(s =>
        s.name.toLowerCase().includes(input) ||
        s.enrollment_id.toLowerCase().includes(input)
    );

    renderTable(filtered);
}

// =========================
// 🔹 LOAD BRANCH FILTER (LEFT SIDE)
// =========================
function loadBranchFilter(dept) {

    const branchFilter = document.getElementById("branchFilter");
    branchFilter.innerHTML = '<option value="">Select Branch</option>';

    let branches = [];

    if (dept === "B.Tech") {
        branches = ["CS", "Civil", "Mechanical", "Electrical", "AI & ML"];
    } 
    else if (dept === "M.Tech") {
        branches = ["CS", "Civil", "Mechanical"];
    }
    else if (dept === "BCA") {
        branches = ["BCA"];
    }
    else if (dept === "MCA") {
        branches = ["MCA"]; // ✅ YOUR LOGIC (no change)
    }
    else if (dept === "MBA") {
        branches = ["MBA"];
    }

    branches.forEach(b => {
        branchFilter.innerHTML += `<option value="${b}">${b}</option>`;
    });

    applyFilters(); // auto apply after selecting dept
}


// =========================
// 🔹 MAIN FILTER (SEARCH + DEPT + BRANCH)
// =========================
function applyFilters() {

    const search = document.getElementById("searchInput").value.toLowerCase();
    const dept = document.getElementById("departmentFilter").value;
    const branch = document.getElementById("branchFilter").value;

    let filtered = allStudents;

    if (search) {
        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(search) ||
            s.enrollment_id.toLowerCase().includes(search)
        );
    }

    if (dept) {
        filtered = filtered.filter(s => s.department === dept);
    }

    if (branch) {
        filtered = filtered.filter(s => s.branch === branch);
    }

    renderTable(filtered);
}


function loadBranches(dept) {

    const branchSelect = document.getElementById("branch");
    branchSelect.innerHTML = '<option value="">Select Branch</option>';

    let branches = [];

    if (dept === "B.Tech") {
        branches = ["CS", "Civil", "Mechanical", "Electrical", "AI & ML"];
    } 
    else if (dept === "M.Tech") {
        branches = ["CS", "Civil", "Mechanical"];
    }
    else if (dept === "BCA") {
        branches = ["BCA"];
    }
    else if (dept === "MCA") {
        branches = ["MCA"];   // ✅ FIXED (this was missing)
    }
    else if (dept === "MBA") {
        branches = ["MBA"];
    }

    branches.forEach(b => {
        branchSelect.innerHTML += `<option value="${b}">${b}</option>`;
    });
}