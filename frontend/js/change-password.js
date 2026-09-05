const API = "http://localhost:5000/api/auth";

async function changePassword(){

    const old_password = document.getElementById("oldPassword").value.trim();
    const new_password = document.getElementById("newPassword").value.trim();

    const enrollment_id = localStorage.getItem("enrollment_id");

    console.log({enrollment_id, old_password, new_password}); // ✅ debug

    if(!old_password || !new_password){
        alert("Please fill all fields");
        return;
    }

    const res = await fetch(`${API}/change-password`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
            enrollment_id,
            old_password,
            new_password
        })
    });

    const data = await res.json();  // ✅ ALWAYS parse

    alert(data.message); // ✅ show real message

    if(res.ok){
        document.getElementById("oldPassword").value = "";
        document.getElementById("newPassword").value = "";
    }
}