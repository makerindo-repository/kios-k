// handles submission of the login form and navigates to the owner UI
const form = document.getElementById("login-form");

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
    const data = new FormData(form);
    const body = Object.fromEntries(data.entries());

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        // First check status
        if (!res.ok) {
            // try parsing error JSON if any
            let errorMsg = "Gagal masuk";
            try {
                const err = await res.json();
                errorMsg = err.error || errorMsg;
            } catch (_) {}
            alert(errorMsg);
            return;
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
        alert("Gagal terhubung ke server");
    }
});