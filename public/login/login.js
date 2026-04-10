//Song for this file: IRIS OUT by Kenshi Yonezu
//handles submission of the login form and navigates to the owner UI
const form = document.getElementById("login-form");

//For the error stuff and warning
function setFormError(message) {
    const errorDiv = document.getElementById("form-error");
    errorDiv.textContent = message;
}
function setInputError(input) {
    input.classList.add("input-error");
}
function clearInputErrors() {
    document.querySelectorAll(".input-error")
        .forEach(el => el.classList.remove("input-error"));
}

function showKiosks(kiosks) {
    const container = document.getElementById("selection");
    container.innerHTML = "<h2>Pilih KIOS-K</h2>";
    kiosks.forEach(kiosk => {
        const btn = document.createElement("button");
        btn.classList = "button";
        btn.textContent = kiosk.name;
        btn.onclick = () => {
            window.location.href = `/manage/${kiosk.id}`;
        };
        container.appendChild(btn);
    });
    container.classList.remove("hidden");
}

form.addEventListener("submit", async e => {
    e.preventDefault();
    setFormError("")
    clearInputErrors();
    const data = new FormData(form);
    const body = Object.fromEntries(data.entries());

    if (!body.useremail.trim()) {
        setInputError(useremail);
        return setFormError("Tolong isi bagian username / email");
    }
    if (!body.password) {
        setInputError(password);
        return setFormError("Tolong isi bagian password");
    }

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        // First check status
        if (!res.ok) {
            let errorMsg = "Gagal masuk";
            try {
                const err = await res.json();
                errorMsg = err.error || errorMsg;
            } catch (_) {}
            console.error(errorMsg);
            return setFormError(errorMsg || "Terjadi kesalahan")
        }

        // Now parse successful JSON
        const result = await res.json();
        if (result.role === "superadmin") {
            localStorage.setItem('token', result.token);
            localStorage.setItem('role', result.role);
            location.href = "/admin";
            return;
        }
        const kiosks = result.kiosks || [];
        if (kiosks.length === 0) {
            alert("Anda belum memiliki kios!");
            return;
        }

        // save token for owner session as well
        if (result.token) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('role', result.role);
        }
        showKiosks(kiosks);

    } catch (error) {
        console.error("login error", error);
        setFormError("Server error");
    }
});