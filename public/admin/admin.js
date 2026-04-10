//Song for this file: MAD TALE by mimizu
const kioskModal = document.getElementById("kiosk-modal");
const kioskForm = document.getElementById("kiosk-form");
const kioskTable = document.getElementById("kiosk-table");
const userModal = document.getElementById("user-modal");
const userForm = document.getElementById("user-form");
const userTable = document.getElementById("user-table");

let kiosksData = [];
let usersData = []; // cache user list for editing
let ownersData = []; // cache owner list for kiosk editing

//check auth
const token = localStorage.getItem("token");
// Helper to add token to fetch requests
function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    const headers = options.headers || {};
    headers["Authorization"] = `Bearer ${token}`;

    return fetch(url, { ...options, headers }).then(async res => {

        if (res.status === 401) {
            showAccessDenied("401");
            throw new Error("401 Unauthorized");
        }

        if (res.status === 403) {
            showAccessDenied("403 | Forbidden");
            throw new Error("403 Forbidden");
        }

        return res;
    });
}
function showAccessDenied(title) {
    document.body.innerHTML = `
        <div class="forbidden">
            <h1>${title}</h1>
            <button onclick="window.location.href='/login'" class="button default">Login</button>
        </div>
    `;
}

//dom content
document.addEventListener("DOMContentLoaded", async () => {
    await loadKiosks();
    await loadUsers();
    await loadKioskStats();
    await loadUserStats();
    ownersData = usersData.filter(u => u.role === 'owner');
    await loadKioskMap();

    // attach delegation listener to kiosk table (fires even after reload)
    kioskTable.addEventListener("click", async (e) => {
        const row = e.target.closest("tr");
        if (!row) return;
        const id = e.target.dataset.id;

        if (e.target.id === 'add-new-kiosk') {
            createNewKiosk();
            return;
        }
        if (e.target.classList.contains("edit")) {
            const kiosk = kiosksData.find(k => k.id == id);
            if (kiosk) openKioskModal(kiosk);
            return;
        }
        if (e.target.classList.contains("block")) {
            const kiosk = kiosksData.find(k => k.id  == id);
            const currentStatus = kiosk.status;
            await toggleBlock(id, currentStatus);
        }
        if (e.target.classList.contains("delete")) {
            if (confirm("Hapus kios ini?")) {
                deleteKiosk(id);
            }
        }
    });

    // attach delegation listener to user table
    userTable.addEventListener("click", e => {
        const row = e.target.closest("tr");
        if (!row) return;
        const id = e.target.dataset.id;

        if (e.target.id === 'add-new-user') {
            openUserModal();
            return;
        }
        if (e.target.classList.contains("edit")) {
            const user = usersData.find(u => u.id == id);
            if (user) openUserModal(user);
            return;
        }
        if (e.target.classList.contains("delete")) {
            if (confirm("Hapus pengguna ini?")) {
                deleteUser(id);
            }
        }
    });

    kioskForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        let id = kioskForm.elements["id"].value.trim();
        // sanitize id - only allow digits
        const name = kioskForm.elements["name"].value.trim();
        const payload = { name };
        const method = id ? "PUT" : "POST";
        const url = id ? `/api/admin/kiosks/${id}` : `/api/admin/kiosks`;

        try {
            const res = await apiFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || res.statusText);
            }
            kioskModal.classList.add("hidden");
            kioskForm.reset();
            showToast("Berhasil menyimpan KIOS-K", "success");
            await loadKiosks();
        } catch (err) {
            console.error("Gagal menyimpan kios", err);
            showToast("Gagal menyimpan KIOS-K", "success");
        }
    });

    // user form handling (add/edit)
    userForm.addEventListener("submit", async e => {
        e.preventDefault();
        let id = userForm.elements["id"].value.trim();
        if (id && !/^\d+$/.test(id)) id = "";
        const username = userForm.elements["username"].value.trim();
        const email = userForm.elements["email"].value.trim();
        const no_telp = userForm.elements["no_telp"].value.trim();
        const password = userForm.elements["password"].value;

        const payload = { username, email, no_telp };
        if (password) payload.password = password;

        const method = id ? "PUT" : "POST";
        const url = id ? `/api/admin/users/${id}` : `/api/admin/users`;

        try {
            const res = await apiFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || res.statusText);
            }
            userModal.classList.add("hidden");
            userForm.reset();
            showToast("Berhasil menyimpan pengguna", "success");
            await loadUsers();
        } catch (err) {
            console.error("Failed to save user", err);
            showToast("Gagal menyimpan pengguna", "error");
        }
    });
});

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

//open
function openKioskModal(kiosk) {
    if (kiosk) {
        kioskForm.elements["id"].value = kiosk.id;
        kioskForm.elements["name"].value = kiosk.name;
    }
    else {
        kioskForm.elements["id"].value = "";
        kioskForm.elements["name"].value = "";
    }
    kioskModal.classList.remove("hidden");
};
function openUserModal(user) {
    // always clear out the id field so the form defaults to POST
    userForm.reset();
    userForm.elements["id"].value = "";
    if (user) {
        userForm.elements["id"].value = user.id;
        userForm.elements["username"].value = user.username;
        userForm.elements["email"].value = user.email;
        userForm.elements["no_telp"].value = user.no_telp;
    }
    userModal.classList.remove("hidden");
};
function formatDate(d) {
    const day = String(d.getDate()).padStart(2,'0');
    const month = String(d.getMonth()+1).padStart(2,'0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

//loads
async function loadKiosks() {
    try {
        const res = await apiFetch("/api/admin/kiosks");
        if (!res.ok) {
            throw new Error(`API returned status ${res.status}`);
        }
        const kiosks = await res.json();
        
        if (!Array.isArray(kiosks)) {
            console.error("Kiosks data is not an array:", kiosks);
            return;
        }

        kiosksData = kiosks;
        const table = document.getElementById("kiosk-table");
        const oldBody = table.querySelector("tbody");
        if (oldBody) oldBody.remove();

        const tbody = document.createElement("tbody");
        kiosks.forEach((k, index) => {
            const row = document.createElement("tr");
            row.dataset.id = k.id;
            row.dataset.regist_id = k.regist_id;
            row.dataset.name = k.name;
            row.dataset.owner = k.owner;
            row.dataset.status = k.status;
            row.dataset.warranty = k.warranty;

            //Status stuff
            let statusText = "";
            let toggleButton = "";
            let editButton = "";
            switch (k.status) {
                case "active":
                    statusText = "Aktif";
                    toggleButton = `<button data-id="${k.id}" class="button warning block"><i class="fi fi-rr-ban"></i></button>`;
                    editButton = `<button data-id="${k.id}" class="button default edit"><i class="fi fi-rr-edit"></i></button>`;
                    break;
                case "blocked":
                    statusText = "Diblokir";
                    toggleButton = `<button data-id="${k.id}" class="button warning block"><i class="fi fi-rr-undo"></i></button>`;
                    editButton = `<button data-id="${k.id}" class="button default edit"><i class="fi fi-rr-edit"></i></button>`;
                    break;
                default:
                    statusText = "Nonaktif";
                    toggleButton = ``;
                    editButton = ``;
                    break;
            };

            //Warranty stuff
            const now = new Date();
            let warrantyText = '';
            if (!k.warranty) {
                warrantyText = 'Belum Aktif';
            } else if (new Date(k.warranty) > now) {
                warrantyText = `Aktif | ${formatDate(new Date(k.warranty))}`;
            } else {
                warrantyText = 'Kadaluarsa'
            }

            row.innerHTML = `
            <td>${index + 1}</td>
            <td>${k.regist_id}</td>
            <td>${k.owner || 'N/A'}</td>
            <td>${k.name}</td>
            <td>${statusText}</td>
            <td>${warrantyText}</td>
            <td class="action">
                ${editButton}
                ${toggleButton}
                <button data-id="${k.id}" class="button alert delete"><i class="fi fi-rr-trash"></i></button>
            </td>
            `;
            tbody.appendChild(row);
        });
        const addKiosk = document.createElement("tr");
        addKiosk.innerHTML = "<td colspan='7'><button id='add-new-kiosk' class='button default'>Tambah KIOS-K Baru</button></td>";

        table.appendChild(tbody);

        table.querySelectorAll('tr > td > #add-new-kiosk').forEach(btn => {
            const row = btn.closest('tr');
            if (row && row !== addKiosk) row.remove();
        });
        tbody.appendChild(addKiosk);
    } catch (error) {
        console.error("Failed to load kiosks:", error);
    }
};
async function loadUsers() {
    try {
        const res = await apiFetch("/api/admin/users");
        if (!res.ok) {
            throw new Error(`API returned status ${res.status}`);
        }
        const users = await res.json();
        
        if (!Array.isArray(users)) {
            console.error("Users data is not an array:", users);
            return;
        }

        usersData = users; // cache for edit/delete
        const table = document.getElementById("user-table");
        const oldBody = table.querySelector("tbody");
        if (oldBody) oldBody.remove();

        const tbody = document.createElement("tbody");

        users.forEach((u, index) => {
            const row = document.createElement("tr");
            row.dataset.id = u.id;
            row.dataset.username = u.username;
            row.dataset.email = u.email;

            row.innerHTML = `
            <td>${index + 1}</td>
            <td>${u.username || 'N/A'}</td>
            <td>${u.email}</td>
            <td>${u.no_telp}</td>
            <td class="action">
                <button data-id="${u.id}" class="button default edit"><i class="fi fi-rr-edit"></i></button>
                <button data-id="${u.id}" class="button alert delete"><i class="fi fi-rr-trash"></i></button>
            </td>
            `;
            tbody.appendChild(row);
        });
        
        const addUser = document.createElement("tr");
        addUser.innerHTML = "<td colspan='6'><button id='add-new-user' class='button default'>Tambah Pengguna Baru</button></td>";

        table.appendChild(tbody);
        // remove any previous add-row to keep only one
        table.querySelectorAll('tr > td > #add-new-user').forEach(btn => {
            const row = btn.closest('tr');
            if (row && row !== addUser) row.remove();
        });
        tbody.appendChild(addUser);
    } catch (error) {
        console.error("Failed to load users:", error);
    }
};
async function loadKioskMap() {
    try {
        const res = await apiFetch("/api/admin/kiosks");
        if (!res.ok) throw new Error("Failed to fetch kiosks");

        const kiosks = await res.json();

        const map = L.map("map").setView([0, 0], 2);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        let bounds = [];

        kiosks.forEach(kiosk => {
            const lat = parseFloat(kiosk.latitude);
            const lng = parseFloat(kiosk.longitude);

            if (isNaN(lat) || isNaN(lng)) {
                console.warn(`Skipping kiosk ${kiosk.name}: invalid coordinates`, kiosk.lat, kiosk.lng);
                return;
            }

            // Add marker
            const marker = L.marker([lat, lng])
                .addTo(map)
                .bindPopup(`<b>${kiosk.name}</b><br>Owner: ${kiosk.owner || "N/A"}<br>Status: ${kiosk.status}`);
            
            bounds.push([lat, lng]);
            console.info(`Added marker for ${kiosk.name} at [${lat}, ${lng}]`);
        });

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        } else {
            console.warn("No valid kiosks to display on map");
        }
    } catch (error) {
        console.error("Failed to load kiosk map:", error);
    }
}
async function loadKioskStats() {
    const res = await apiFetch("/api/admin/kiosks");
    const kiosks = await res.json();

    let all = kiosks.length;
    let active = 0;
    let blocked = 0;

    kiosks.forEach(k => {
        if (k.status === "active") active++;
        else blocked++;
    })

    document.getElementById("stat-all").textContent = all;
    document.getElementById("stat-active").textContent = active;
    document.getElementById("stat-blocked").textContent = blocked;
}
async function loadUserStats() {
    const res = await apiFetch("/api/admin/users");
    const users = await res.json();

    document.getElementById("stat-users").textContent = users.length;
}

//other
async function deleteUser(id) {
    try {
        const res = await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        showToast("Berhasil menghapus pengguna", "success");
        await loadUsers();
    } catch (err) {
        console.error("Failed to delete user", err);
        showToast("Gagal menghapus pengguna", "error");
    }
};
async function deleteKiosk(id) {
    try {
        const res = await apiFetch(`/api/admin/kiosks/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        showToast("Berhasil menghapus KIOS-K", "success");
        await loadKiosks();
    } catch (err) {
        console.error("Failed to delete kiosk", err);
        showToast("Gagal menghapus KIOS-K", "error");
    }
}
async function createNewKiosk() {
    try {
        const res = await apiFetch("/api/admin/kiosks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || res.statusText);
        }
        showToast("Berhasil membuat KIOS-K baru", "success");
        await loadKiosks();
    } catch (err) {
        console.error("Failed to create kiosk", err);
        showToast("Gagal membuat KIOS-K baru", "error");
    }
}
async function toggleBlock(kioskId, currentStatus) {
    if (currentStatus === "unregistered") return;
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    await apiFetch(`/api/admin/kiosks/${kioskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
    })
    showToast("Berhasil mengubah status KIOS-K", "success");
    loadKiosks();
};

//for closing window
document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", e => {
        const modal = e.target.closest(".modal");
        if (modal) modal.classList.add("hidden");
        modal.querySelector("form")?.reset();
    });
});
document.querySelector(".logout")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    window.location.href = "/";
});