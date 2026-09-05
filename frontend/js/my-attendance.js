const API = "http://localhost:5000/api/attendance";

// ✅ Get student id
const enrollment_id = localStorage.getItem("enrollment_id");

let monthlyData = [];

// ✅ Run after DOM loads
document.addEventListener("DOMContentLoaded", () => {
    loadAttendance();
    loadPercentage();
    loadMonthlyData();

    const dropdown = document.getElementById("monthDropdown");
    if (dropdown) {
        dropdown.addEventListener("change", function () {
            showPercentage(parseInt(this.value));
        });
    }
});


// ================= ATTENDANCE =================

async function loadAttendance() {

    const res = await fetch(`${API}/my-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment_id })
    });

    const data = await res.json();

    if (data.success) {
        renderCalendar(data.data, data.first_date);
    }
}

function renderCalendar(records, firstDate) {

    const monthContainer = document.getElementById("monthContainer");
    if (!monthContainer) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalMonths = 12;
    const startOffset = -5;

    monthContainer.innerHTML = "";

    let firstAttendanceDate = null;
    if (firstDate) {
        firstAttendanceDate = new Date(firstDate);
        firstAttendanceDate.setHours(0, 0, 0, 0);
    }

    for (let m = startOffset; m < totalMonths - 1; m++) {

        const date = new Date(today.getFullYear(), today.getMonth() + m, 1);

        const year = date.getFullYear();
        const month = date.getMonth();

        const monthName = date.toLocaleString('default', { month: 'long' });
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const monthBlock = document.createElement("div");
        monthBlock.classList.add("month-block");

        const title = document.createElement("div");
        title.classList.add("month-title");
        title.innerText = `${monthName} ${year}`;
        monthBlock.appendChild(title);

        const weekdays = document.createElement("div");
        weekdays.classList.add("weekdays");
        weekdays.innerHTML = `
            <div>Sun</div><div>Mon</div><div>Tue</div>
            <div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        `;
        monthBlock.appendChild(weekdays);

        const cal = document.createElement("div");
        cal.classList.add("calendar");

        const firstDay = new Date(year, month, 1).getDay();

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement("div");
            empty.classList.add("day");
            empty.style.visibility = "hidden";
            cal.appendChild(empty);
        }

        for (let i = 1; i <= daysInMonth; i++) {

            const dayBox = document.createElement("div");
            dayBox.classList.add("day");

            const dateEl = document.createElement("div");
            dateEl.classList.add("date");
            dateEl.innerText = i;

            dayBox.appendChild(dateEl);

            const record = records.find(r => {
                const d = new Date(r.date);
                return d.getDate() === i &&
                    d.getMonth() === month &&
                    d.getFullYear() === year;
            });

            if (record) {

                // ✅ STATUS COLORS
                if (record.status === "Present") {
                    dayBox.style.backgroundColor = "#d4edda"; // green
                } 
                else if (record.status === "OD") {
                    dayBox.style.backgroundColor = "#4da6ff"; // 🔵 blue

                    const od = document.createElement("div");
                    od.innerText = "OD";
                    od.style.color = "white";
                    od.style.fontWeight = "bold";
                    od.style.fontSize = "12px";
                    dayBox.appendChild(od);
                }
                else if (record.status === "Pending") {
                    dayBox.style.backgroundColor = "#fff3cd"; // yellow

                    const msg = document.createElement("div");
                    msg.innerText = "No Check-out";
                    msg.style.fontSize = "12px";
                    msg.style.color = "#856404";
                    dayBox.appendChild(msg);
                }

                // ✅ IMPORTANT FIX: NO TIME FOR OD
                if (record.status !== "OD") {

                    if (record.check_in) {
                        const ci = document.createElement("div");
                        ci.innerText = "IN: " + record.check_in;
                        dayBox.appendChild(ci);
                    }

                    if (record.check_out) {
                        const co = document.createElement("div");
                        co.innerText = "OUT: " + record.check_out;
                        dayBox.appendChild(co);
                    }

                    if (record.duration) {
                        const du = document.createElement("div");
                        du.style.fontSize = "12px";
                        du.innerText = "⏱ " + record.duration;
                        dayBox.appendChild(du);
                    }
                }

            } else {

                const currentDate = new Date(year, month, i);
                currentDate.setHours(0, 0, 0, 0);

                const dayOfWeek = currentDate.getDay();

                if (firstAttendanceDate &&
                    currentDate >= firstAttendanceDate &&
                    currentDate < today &&
                    dayOfWeek !== 0) {

                    dayBox.style.backgroundColor = "#f8d7da";

                    const ab = document.createElement("div");
                    ab.innerText = "Absent";
                    ab.style.color = "red";
                    ab.style.fontSize = "12px";

                    dayBox.appendChild(ab);
                }
            }

            cal.appendChild(dayBox);
        }

        monthBlock.appendChild(cal);
        monthContainer.appendChild(monthBlock);
    }
}

// ================= TOTAL PERCENTAGE =================

async function loadPercentage() {

    const res = await fetch(`${API}/monthly-report/${enrollment_id}`);
    const data = await res.json();

    const box = document.getElementById("percentageBox");
    if (!box) return;

    const percentage = data.total > 0
        ? ((data.present / data.total) * 100).toFixed(1)
        : 0;

    box.innerText = "Attendance: " + percentage + "%";

    box.style.color = percentage < 75 ? "red" : "green";
}


// ================= MONTHLY DROPDOWN =================

async function loadMonthlyData() {

    const res = await fetch(`${API}/monthly-percentage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment_id })
    });

    const data = await res.json();

    console.log("Monthly Data:", data); // ✅ debug

    monthlyData = data;

    const dropdown = document.getElementById("monthDropdown");
    if (!dropdown) return;

    dropdown.innerHTML = "";

    data.forEach((item, index) => {
        const opt = document.createElement("option");
        opt.value = index;
        opt.text = item.month;
        dropdown.appendChild(opt);
    });

    showPercentage(0);
}


function showPercentage(index) {

    const item = monthlyData[index];
    if (!item) return;

    const box = document.getElementById("percentageBox");
    if (!box) return;

    box.innerText = `Attendance: ${item.percentage}%`;
    box.style.color = item.percentage < 75 ? "red" : "green";
}

function logout(){
    // ✅ clear user session
    localStorage.removeItem("enrollment_id");

    // (optional) clear everything
    localStorage.clear();

    // ✅ redirect to login page properly
    window.location.replace("index.html");
}
logout;