//Song for this file: Miku by Anamaguchi & Hatsune Miku
const userModal = document.getElementById("user-modal");
const userForm = document.getElementById("user-form");
const kioskModal = document.getElementById("kiosk-modal");
const kioskForm = document.getElementById("kiosk-form");
const mapModal = document.getElementById("map-modal");

const params = new URLSearchParams(window.location.search);
const type = params.get("type");
let map, marker;

//toast
function showToast(message, type) {
    const container = document.getElementById("toast-container");

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
//for error in input
function setFormError(message) {
    const errorDiv = document.getElementById("form-error");
    errorDiv.textContent = message;
}

//check what kind of registration
if (type === "user") {
    userModal?.classList.remove("hidden");
} else if (type === "kiosk") {
    kioskModal?.classList.remove("hidden");
}

//map input for location
document.getElementById("open-map").onclick = () => {
    document.getElementById("form-error").classList.add("hidden")
    mapModal.classList.remove("hidden");
    setTimeout(() => {
        if (!map) initMap();
        else map.invalidateSize();
    }, 100);
};
document.getElementById("close-map").onclick = () => {
    mapModal.classList.add("hidden");
    setFormError("");
}
document.getElementById("save-map").onclick = () => {
    if (!marker) {
        alert("Tolong taruh pin penunjuk terlebih dahulu!");
        return;
    }
    const { lat, lng } = marker.getLatLng();
    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lng;
    mapModal.classList.add("hidden");
}

function initMap() {
    if (map) return;
    map = L.map('map').setView([-6.9500928, 107.6232192], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    })
}
const handleSubmit = async (form) => {
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const data = new FormData(form);
        const body = Object.fromEntries(data.entries());
        const method = form === kioskForm ? "PUT" : "POST";

        if (!body.latitude || !body.longitude) {
            document.getElementById("form-error").classList.remove("hidden")
            mapModal.classList.remove("hidden");
            setTimeout(() => {
                if (!map) initMap();
                else map.invalidateSize();
            }, 100);
            return setFormError("Tolong masukkan lokasi KIOS-K menggunakan peta di bawah");
        }

        try {
            const res = await fetch("/api/regist", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                let errorMsg = "Gagal mendaftar";
                try {
                    const err = await res.json();
                    errorMsg = err.error || errorMsg;
                } catch (_) {}
                showToast("Gagal mendaftar", "error");
                return;
            }
            alert("Berhasil terdaftar! Selamat menggunakan KIOS-K!")
            form.reset();
            window.location.href = "/";
        } catch (error) {
            console.error("regist error", error);
            showToast("Server error", "error")
        }
    });
};

if (userForm) handleSubmit(userForm);
if (kioskForm) handleSubmit(kioskForm);
