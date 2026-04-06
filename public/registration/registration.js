//Song for this file: Miku by Anamaguchi & Hatsune Miku
const userModal = document.getElementById("user-modal");
const userForm = document.getElementById("user-form");
const kioskModal = document.getElementById("kiosk-modal");
const kioskForm = document.getElementById("kiosk-form");
const mapModal = document.getElementById("map-modal");

const params = new URLSearchParams(window.location.search);
const type = params.get("type");

//map input for location
document.getElementById("open-map").onclick = () => {
    mapModal.classList.remove("hidden");
    setTimeout(() => {
        if (!map) initMap();
        else map.invalidateSize();
    }, 100);
};
document.getElementById("close-map").onclick = () => {
    mapModal.classList.add("hidden");
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

let map, marker;

function initMap() {
    if (map) return;
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    })
}

if (type === "user") {
    userModal?.classList.remove("hidden");
} else if (type === "kiosk") {
    kioskModal?.classList.remove("hidden");
}

const handleSubmit = async (form) => {
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const data = new FormData(form);
        const body = Object.fromEntries(data.entries());
        const method = form === kioskForm ? "PUT" : "POST";

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
                alert(errorMsg);
                return;
            }

            alert("Berhasil terdaftar!");
            form.reset();
            window.location.href = "/";
        } catch (error) {
            console.error("regist error", error);
            alert("Gagal terhubung ke server");
        }
    });
};

if (userForm) handleSubmit(userForm);
if (kioskForm) handleSubmit(kioskForm);
