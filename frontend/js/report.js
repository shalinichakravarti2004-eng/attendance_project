const API = "http://localhost:5000/api/attendance";

let reportData = {};
let studentName = localStorage.getItem("student_name") || "Student";

async function loadMonthlyReport(){
    const params = new URLSearchParams(window.location.search);
    const enrollment_id = params.get("enrollment") || localStorage.getItem("enrollment_id");

    const res = await fetch(`${API}/monthly-report/${enrollment_id}`);
    const data = await res.json();

    if(data){
        reportData = data; // ✅ SAVE DATA
    }

    const box = document.getElementById("reportBox");

    box.innerHTML = `
        <h3>📅 Monthly Report</h3>
        <p>✅ Present: ${data.present}</p>
        <p>❌ Absent: ${data.absent}</p>
        <p>📊 Total Days: ${data.total}</p>
    `;
    if(data.absent > data.present){
    box.style.border = "2px solid red";
}
}


async function loadReport() {

    const enrollment_id = localStorage.getItem("enrollment_id");

    const res = await fetch(`${API}/monthly-report/${enrollment_id}`);
    const data = await res.json();

    // ✅ FIX: Convert to Number
    const present = Number(data.present) || 0;
    const absent = Number(data.absent) || 0;

    const barCtx = document.getElementById("barChart");
    const pieCtx = document.getElementById("pieChart");

    // ❗ Destroy old charts (important)
    if (window.barChartInstance) {
        window.barChartInstance.destroy();
    }

    if (window.pieChartInstance) {
        window.pieChartInstance.destroy();
    }

    // =========================
    // 📊 BAR CHART
    // =========================
    window.barChartInstance = new Chart(barCtx, {
        type: "bar",
        data: {
            labels: ["Present", "Absent"],
            datasets: [{
                label: "Attendance",
                data: [present, absent]
            }]
        }
    });

    // =========================
    // 🥧 PIE CHART
    // =========================
    window.pieChartInstance = new Chart(pieCtx, {
        type: "pie",
        data: {
            labels: ["Present", "Absent"],
            datasets: [{
                data: [present, absent]
            }]
        }
    });
}


async function loadTrend(){

    const enrollment_id = localStorage.getItem("enrollment_id");

    const res = await fetch(`${API}/yearly-trend/${enrollment_id}`);
    const data = await res.json();

    const months = data.map(d => d.month);
    const values = data.map(d => d.total);

    const trendCtx = document.getElementById("trendChart");

    new Chart(trendCtx, {
        type: "line",
        data: {
            labels: months,
            datasets: [{
                label: "Monthly Present",
                data: values
            }]
        }
    });
}

window.onload = () => {
    loadMonthlyReport();
    loadReport();
    loadTrend();
};


function downloadPDF(){

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const present = reportData.present || 0;
    const absent = reportData.absent || 0;
    const total = reportData.total || 0;

    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    const today = new Date();
    const months = data.map(d => new Date(2024, d.month - 1).toLocaleString('default', { month: 'short' })
    );

    // 🧾 TITLE
    doc.setFontSize(18);
    doc.text("Attendance Report", 20, 20);

    // 👤 Student Info
    doc.setFontSize(12);
    doc.text("Name: " + studentName, 20, 35);
    doc.text("Month: " + monthName, 20, 45);
    doc.text("Attendance: " + percentage + "%", 20, 55);

    // 📊 TABLE HEADER
    doc.setFontSize(14);
    doc.text("Summary", 20, 70);

    doc.setFontSize(12);
    doc.text("Present", 20, 85);
    doc.text("Absent", 80, 85);
    doc.text("Total", 140, 85);

    // 📊 TABLE VALUES
    doc.text(String(present), 20, 95);
    doc.text(String(absent), 80, 95);
    doc.text(String(total), 140, 95);

    // 📦 Draw simple table lines
    doc.line(20, 80, 180, 80);
    doc.line(20, 100, 180, 100);
    doc.line(20, 80, 20, 100);
    doc.line(80, 80, 80, 100);
    doc.line(140, 80, 140, 100);
    doc.line(180, 80, 180, 100);

    // =========================
    // 📊 BAR CHART ADD
    // =========================

    const canvas = document.getElementById("barChart");

    if(canvas){
        const imgData = canvas.toDataURL("image/png");

        doc.text("Attendance Chart", 20, 120);
        doc.addImage(imgData, "PNG", 20, 125, 160, 80);
    }

    // 💾 SAVE
    doc.save("Attendance_Report.pdf");
}

window.downloadPDF = downloadPDF;

downloadPDF;