const kioskModal = document.getElementById("kiosk-modal");
const kioskForm = document.getElementById("kiosk-form");
const userModal = document.getElementById("user-modal");
const userForm = document.getElementById("user-form");

let kiosksData = [];
let usersData = []; // cache user list for editing
let ownersData = []; // cache owner list for kiosk editing

//check auth
const token = localStorage.getItem("token");
console.log(token);
console.log(localStorage.getItem("role"));
// if (!token) {
//     window.location.href = "/login";
// };

// Helper to add token to fetch requests
function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    const headers = options.headers || {};
    headers["Authorization"] = `Bearer ${token}`;

    return fetch(url, { ...options, headers }).then(async res => {

        if (res.status === 401) {
            showAccessDenied("Unauthenticated | 401");
            throw new Error("401 Unauthorized");
        }

        if (res.status === 403) {
            showAccessDenied("Forbidden | 403");
            throw new Error("403 Forbidden");
        }

        return res;
    });
}
function showAccessDenied(title) {
    document.body.innerHTML = `
        <div style="
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
            height:100vh;
            text-align:center;
            font-family:sans-serif;
        ">
            <h1>${title}</h1>
        </div>
    `;
}

//dom content
document.addEventListener("DOMContentLoaded", async () => {
    await loadKiosks();
    await loadUsers();
    ownersData = usersData.filter(u => u.role === 'owner');
    console.log("Your owners data are: ", ownersData);
    await loadKioskMap();

    // attach delegation listener to kiosk table (fires even after reload)
    const kioskTable = document.getElementById("kiosk-table");
    kioskTable.addEventListener("click", async (e) => {
        const row = e.target.closest("tr");
        if (!row) return;
        const id = e.target.dataset.id;

        if (e.target.id === 'add-new-kiosk') {
            openKioskModal();
            return;
        }
        if (e.target.classList.contains("default")) {
            const kiosk = kiosksData.find(k => k.id == id);
            if (kiosk) openKioskModal(kiosk);
            return;
        }
        if (e.target.classList.contains("alert")) {
            const currentStatus = row.children[3].textContent.trim();
            await toggleBlock(id, currentStatus);
        }
    });

    // attach delegation listener to user table
    const userTable = document.getElementById("user-table");
    userTable.addEventListener("click", e => {
        const row = e.target.closest("tr");
        if (!row) return;
        const id = e.target.dataset.id;

        if (e.target.id === 'add-new-user') {
            openUserModal();
            return;
        }
        if (e.target.classList.contains("default")) {
            const user = usersData.find(u => u.id == id);
            if (user) openUserModal(user);
            return;
        }
        if (e.target.classList.contains("alert")) {
            if (confirm("Hapus pengguna ini?")) {
                deleteUser(id);
            }
        }
    });

    kioskForm.addEventListener("submit", async (e) => {
        // e.preventDefault();
        // const id = kioskForm.elements["id"].value;
        // const name = kioskForm.elements["name"].value.trim();
        // const owner_id = kioskForm.elements["owner"].value || null;
        // try {
        // const res = await apiFetch(`/api/admin/kiosks/${id}`, {
        //         method: "PUT",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify({ name, owner_id })
        //     });
        //     if (!res.ok) throw new Error(`status ${res.status}`);
        //     kioskModal.classList.add("hidden");
        //     await loadKiosks();
        // } catch (err) {
        //     console.error("Failed to update kiosk", err);
        //     alert("Gagal memperbarui kiosk");
        // }
                e.preventDefault();
        let id = kioskForm.elements["id"].value.trim();
        // sanitize id - only allow digits
        const name = kioskForm.elements["name"].value.trim();
        const owner = kioskForm.elements["owner"].value;

        const payload = { name, owner_id: owner };

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
            await loadKiosks();
        } catch (err) {
            console.error("Gagal menyimpan kios", err);
            alert("Gagal menyimpan kios: " + err.message);
        }
    });

    // user form handling (add/edit)
    userForm.addEventListener("submit", async e => {
        e.preventDefault();
        let id = userForm.elements["id"].value.trim();
        // sanitize id - only allow digits
        if (id && !/^\d+$/.test(id)) id = "";
        console.log("user form submit, id=", id);
        const username = userForm.elements["username"].value.trim();
        const email = userForm.elements["email"].value.trim();
        const password = userForm.elements["password"].value;

        const payload = { username, email };
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
            await loadUsers();
        } catch (err) {
            console.error("Failed to save user", err);
            alert("Gagal menyimpan pengguna: " + err.message);
        }
    });
});

//open
function openKioskModal(kiosk) {
    if (kiosk) {
        kioskForm.elements["id"].value = kiosk.id;
        kioskForm.elements["name"].value = kiosk.name;
        const ownerSelect = kioskForm.elements["owner"];
        ownerSelect.innerHTML = '<option value="">-- Pilih Pemilik --</option>';
        ownersData.forEach(owner => {
            const option = document.createElement("option");
            option.value = owner.id;
            option.textContent = owner.username;
            ownerSelect.appendChild(option);
        });
        const currentOwner = ownersData.find(o => o.username === kiosk.owner);
        if (currentOwner) {
            ownerSelect.value = currentOwner.id;
        } else {
            ownerSelect.value = "";
        }
    }
    else {
        kioskForm.elements["id"].value = "";
        kioskForm.elements["name"].value = "";
        const ownerSelect = kioskForm.elements["owner"];
        ownerSelect.innerHTML = '<option value="">-- Pilih Pemilik --</option>';
        ownersData.forEach(owner => {
            const option = document.createElement("option");
            option.value = owner.id;
            option.textContent = owner.username;
            ownerSelect.appendChild(option);
        });
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
    }
    userModal.classList.remove("hidden");
};

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
            row.dataset.name = k.name;
            row.dataset.owner = k.owner;
            row.dataset.status = k.status;

            row.innerHTML = `
            <td>${index + 1}</td>
            <td>${k.owner || 'N/A'}</td>
            <td>${k.name}</td>
            <td>${k.status}</td>
            <td>
                <button data-id="${k.id}" class="button default">Edit</button>
                <button data-id="${k.id}" class="button alert">${k.status === "active" ? "Blokir" : "Aktifkan"}</button>
            </td>
            `;
            tbody.appendChild(row);
        });
        const addKiosk = document.createElement("tr");
        addKiosk.innerHTML = "<td colspan='5'><button id='add-new-kiosk' class='button default'>Tambah KIOS-K Baru</button></td>";

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
            <td>
                <button data-id="${u.id}" class="button default">Edit</button>
                <button data-id="${u.id}" class="button alert">Hapus</button>
            </td>
            `;
            tbody.appendChild(row);
        });
        
        const addUser = document.createElement("tr");
        addUser.innerHTML = "<td colspan='5'><button id='add-new-user' class='button default'>Tambah Pengguna Baru</button></td>";

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
        console.log(kiosks);

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
            console.log(`Added marker for ${kiosk.name} at [${lat}, ${lng}]`);
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

//other
async function deleteUser(id) {
    try {
        const res = await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        await loadUsers();
    } catch (err) {
        console.error("Failed to delete user", err);
        alert("Gagal menghapus pengguna");
    }
};
async function toggleBlock(kioskId, currentStatus) {
    const newStatus = currentStatus === "active" ? "blocked" : "active";

    await apiFetch(`/api/admin/kiosks/${kioskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
    })
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
    window.location.href = "/login";
});