const API = "http://localhost:5000/api/student";

// ✅ get student id
const enrollment_id = localStorage.getItem("enrollment_id");

// 🔹 Load Profile
async function loadProfile(){

    try{
        console.log("Enrollment ID:", enrollment_id);

        const res = await fetch(`${API}/profile`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ enrollment_id })
        });

        const data = await res.json();
        console.log("API Response:", data);

        if(data.success){

            document.getElementById("name").innerText = data.data.name;
            document.getElementById("enrollment").innerText = data.data.enrollment_id;
            document.getElementById("gender").innerText = data.data.gender;
            document.getElementById("department").innerText = data.data.department;

            document.getElementById("email").value = data.data.email || "";
            document.getElementById("mobile").value = data.data.mobile || "";
        }else{
            alert("Profile not found");
        }

    }catch(err){
        console.error("Error loading profile:", err);
    }
}


// 🔹 Update Profile
async function updateProfile(){

    const email = document.getElementById("email").value;
    const mobile = document.getElementById("mobile").value;

    try{

        const res = await fetch(`${API}/update-profile`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
                enrollment_id,
                email,
                mobile
            })
        });

        const data = await res.json();

        if(data.success){
            alert("Profile Updated Successfully ✅");
        }else{
            alert(data.message || "Update failed");
        }

    }catch(err){
        console.error("Update error:", err);
    }
}


// 🔹 Auto load
loadProfile();