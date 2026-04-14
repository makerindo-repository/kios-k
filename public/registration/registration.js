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
//map initialization
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

//registrations
async function apiRegister(body, method) {
    const res = await fetch("/api/regist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const text = await res.text();
    let data;
    
    try {
        data = JSON.parse(text);
    } catch {
        data = { error: text };
    }
    return { res, data };
}
async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const body = Object.fromEntries(new FormData(form).entries());
    const method = form === kioskForm ? "PUT" : "POST";

    try {
        const { res, data } = await apiRegister(body, method);

        //USER FLOW ONLY
        if (form === userForm) {
            if (res.status === 400) {
                showToast("Data tidak lengkap", "error");
                return;
            }
            if (res.status === 409) {
                if (data.code === "EMAIL_EXISTS") {
                    showToast("Email sudah terdaftar", "error");
                    return;
                }
                if (data.code === "PHONE_EXISTS") {
                    showToast("Nomor telepon sudah terdaftar", "error");
                    return;
                }
                showToast("Konflik data", "error");
                return;
            }
            if (!res.ok) {
                showToast("Server error", "error");
                return;
            }
            alert("Berhasil terdaftar!");
        }

        // KIOSK FLOW
        if (form === kioskForm) {
            if (res.status === 400) {
                if (data.code === "MISSING_REGIST_ID") {
                    showToast("Kode registrasi dibutuhkan", "error");
                    return;
                }
                if (data.code === "MISSING_NAME") {
                    showToast("Nama KIOS-K tidak boleh kosong", "error");
                    return;
                }
                if (data.code === "MISSING_EMAIL") {
                    showToast("Email dibutuhkan", "error");
                    return;
                }
                if (data.code === "MISSING_PASSWORD") {
                    showToast("Password dibutuhkan", "error");
                    return;
                }
                if (data.code === "MISSING_LOCATION") {
                    showToast("Lokasi harus ditentukan", "error");
                    return;
                }
            }

            if (res.status === 404) {
                showToast("KIOS-K dengan kode tersebut tidak ada", "error");
                return;
            }

            if (res.status === 401) {
                if (data.code === "EMAIL_NOT_FOUND") {
                    showToast("Email anda tidak terdaftar", "error");
                    return;
                }
                if (data.code === "INVALID_PASSWORD") {
                    showToast("Password invalid", "error");
                }
            }
            if (res.status === 409) {
                showToast("KIOS-K ini sudah aktif", "error");
                return;
            }
            if (!res.ok) {
                console.error(error)
                showToast("Server error", "error");
                return;
            }
            alert("Berhasil mengaktifkan KIOS-K");
        }

        form.reset();
        window.location.href = "/";

    } catch (error) {
        console.error("regist error", error);
        showToast("Server error", "error");
    }
}

if (userForm) userForm.addEventListener("submit", handleSubmit);
if (kioskForm) kioskForm.addEventListener("submit", handleSubmit);
