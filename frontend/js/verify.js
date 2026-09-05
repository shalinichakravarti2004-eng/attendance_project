console.log("verify.js loaded successfully");

function verifyOTP() {

    let otp = document.getElementById("otp").value;
    let msg = document.getElementById("msg");

    msg.innerText = "Verifying...";

    fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ otp: otp })
    })
    .then(res => res.json())
    .then(data => {

        if (data.success) {

            // ✅ SAVE LOGIN STATUS
            localStorage.setItem("logged_in", "true");

            // ✅ REDIRECT TO STUDENT DASHBOARD
            window.location.href = "dashboard-student.html";

        } else {
            msg.innerText = data.message;
        }

    })
    .catch(() => {
        msg.innerText = "Server error ❌";
    });
}

window.resendOTP = async function () {

    const email = localStorage.getItem("email");

    const res = await fetch("http://localhost:5000/api/auth/resend-otp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email })
    });

    const data = await res.json();

    document.getElementById("msg").innerText = data.message;

    // 🔥 RESET TIMER
    clearInterval(timerInterval);
    timeLeft = 300;
    startTimer();
};

let timeLeft = 300; // 5 minutes = 300 seconds
let timerInterval;

function startTimer() {
    const timerEl = document.getElementById("timer");

    timerInterval = setInterval(() => {

        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;

        seconds = seconds < 10 ? "0" + seconds : seconds;

        timerEl.innerText = `OTP expires in: ${minutes}:${seconds}`;

        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(timerInterval);
            timerEl.innerText = "OTP expired. Please resend OTP ❌";
            document.getElementById("msg").innerText = "OTP expired";
        }

    }, 1000);
}