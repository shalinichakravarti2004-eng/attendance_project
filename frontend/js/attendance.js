const video = document.getElementById("video");
const actionBtn = document.getElementById("actionBtn");

const enrollment_id = localStorage.getItem("enrollment_id");
const COLLEGE_LAT = 23.14702584325091;
const COLLEGE_LON = 79.92262997561673;

const ALLOWED_RADIUS = 500;

// 📏 Distance
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a =
        Math.sin(Δφ/2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ/2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

// ⏰ Time check
function isWithinTime() {
    const now = new Date();

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const startMinutes =9* 60 ;      // 10:00 AM
    const endMinutes = 11 * 60 + 45;   // 10:30 AM

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// 🎥 Camera
navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    video.srcObject = stream;
});

// 🔥 Page Load
document.addEventListener("DOMContentLoaded", () => {
    checkStatus();
    setInterval(checkStatus, 30000);
});

// 🔥 STATUS CHECK
function checkStatus(){

    if(!isWithinTime()){
        actionBtn.innerText = "Attendance Closed";
        actionBtn.disabled = true;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {

            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            const distance = getDistance(userLat, userLon, COLLEGE_LAT, COLLEGE_LON);

            if(distance > ALLOWED_RADIUS){
                actionBtn.innerText = "Out of Location";
                actionBtn.disabled = true;
                alert("You are out of allowed location");
                return;
            }

            // ✅ ONLY HERE API CALL
            callStatusAPI();

        },
        error => {
            alert("Location access denied OR not working");
            actionBtn.innerText = "Enable Location";
            actionBtn.disabled = true;
        }
    );
}

// ✅ API CALL FUNCTION
async function callStatusAPI() {
    try {
        const res = await fetch("http://localhost:5000/api/attendance/status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                enrollment_id: enrollment_id,
                date: new Date().toISOString().split("T")[0]
            })
        });

        const data = await res.json();

        console.log("STATUS RESPONSE:", data); // ✅ debug

        // ✅ NOT MARKED → SHOW CHECK-IN
        if (data.status === "not_marked") {
            actionBtn.innerText = "Mark Attendance";
            actionBtn.disabled = false;
        }

        // ✅ CHECKED-IN → SHOW CHECK-OUT
        else if (data.status === "checked_in") {
            actionBtn.innerText = "Check-Out";
            actionBtn.disabled = false;
        }

        // ✅ COMPLETED → DISABLE
        else if (data.status === "completed") {
            actionBtn.innerText = "Done";
            actionBtn.disabled = true;
        }

        // ❌ fallback
        else {
            actionBtn.innerText = "Error";
            actionBtn.disabled = true;
        }

    } catch (err) {
        console.error("Error:", err);
        actionBtn.innerText = "Server Error";
        actionBtn.disabled = true;
    }
}

// 🔘 Button
function handleAction(){

    if(actionBtn.innerText === "Mark Attendance"){
        captureAndCheckIn();
    }
    else if(actionBtn.innerText === "Check-Out"){
        checkOut();
    }
}

// 📸 Capture + Check-in
function captureAndCheckIn(){

    navigator.geolocation.getCurrentPosition(position => {

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        context.drawImage(video,0,0);

        const image = canvas.toDataURL("image/png");

        fetch("http://localhost:5000/api/attendance/save-face",{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body:JSON.stringify({
                enrollment_id,
                image
            })
        })
        .then(res=>res.json())
        .then(data=>{

            if(!data.success){
                checkIn(image, lat, lon);
            }
            else{
                alert("Face Registered. Click again.");
            }
        });

    });
}

// ✅ Check-in
function checkIn(image, lat, lon){

    fetch("http://localhost:5000/api/attendance/check-in",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
            enrollment_id,
            image,
            latitude: lat,
            longitude: lon
        })
    })
    .then(res=>res.json())
    .then(data=>{
        alert(data.message);
        checkStatus();
    });
}

// 🔚 Check-out
function checkOut(){

    fetch("http://localhost:5000/api/attendance/check-out",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ enrollment_id })
    })
    .then(res=>res.json())
    .then(data=>{
        alert(data.message);
        checkStatus();
    });
}