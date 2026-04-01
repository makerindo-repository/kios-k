//Song for this file: Monitoring by DECO*27
//constants and variables
const pageContainer = document.getElementById("page-carousel");
const mouContainer = document.getElementById("mou-carousel");
const pageModal = document.getElementById("page-modal");
const pageForm = document.getElementById("page-form");
const welcomeModal = document.getElementById("welcome-modal")
const welcomeForm = document.getElementById("welcome-form")
const mouModal = document.getElementById("mou-modal");
const mouForm = document.getElementById("mou-form");
const decoForm = document.getElementById("deco-form");
const kioskNameEl = document.getElementById("kiosk-name");
const ownerNameEl = document.getElementById("owner-name");
const urlParams = new URLSearchParams(window.location.search);
let kioskId = urlParams.get("kiosk");

//check authorization
if (!kioskId) {
    const parts = window.location.pathname.split("/");
    //parts[0] = "", parts[1] = "manage", parts[2] = kioskId
    kioskId = parts[2] || null;
}    
function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    const headers = options.headers || {};
    headers["Authorization"] = `Bearer ${token}`;

    return fetch(url, { ...options, headers }).then(async res => {

        if (res.status === 401) {
            showAccessDenied("Unauthenticated | 401",);
            throw new Error("401 Unauthorized");
        }

        if (res.status === 403) {
            showAccessDenied("Forbidden | 403",);
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

//load and render pages
async function loadPages() {
    if (!kioskId) {
        console.warn("owner: no kiosk id supplied, not fetching pages");
        return;
    }
    const res = await apiFetch(`/api/owner/kiosk/${kioskId}/contents`);
    const pages = await res.json();
    console.log("Pages response:", pages, "Type:", Array.isArray(pages));
    if (!Array.isArray(pages)) {
        console.error("Pages is not an array:", pages);
        return;
    }
    renderCards(pages);
}
function renderCards(pages) {
    pageContainer.innerHTML = "";

    function parsePhotos(val) {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === "string") {
            try {
                const p = JSON.parse(val);
                if (Array.isArray(p)) return p;
                if (typeof p === "string") return [p];
            } catch {}
            return [val];
        }
        return [];
    }

    pages.forEach(page => {
        const card = document.createElement("div");
        card.className = "page-card";
        card.dataset.id = page.id;

        const photos = parsePhotos(page.photos);
        const imgSrc = photos[0] || "placeholder.png";
        let shortDesc = "";
        const text = page.description || page.desc || "";
        if (text) {
            const words = text.split(" ");
            shortDesc = words.length > 15 ? words.slice(0, 14).join(" ") + "..." : text;
        }
        card.innerHTML = `
            <img src="/uploads/${imgSrc}">
            <p id="heading"><b>${page.heading}</b></p>
            ${page.page_type === "welcome" ? "" : `<p id="title"><b>${page.title}</b></p>`}
            <p id="desc">${shortDesc}</p>
            <div>
                <button onclick="${page.page_type === "welcome" ? "editWelcome" : "editPage"}('${page.id}')" class="button default for-card"><i class="fi fi-rr-edit"></i></button>
                ${page.page_type === "welcome" ? "" : `<button onclick="deletePage('${page.id}', this.closest('.page-card'))" class="button alert for-card"><i class="fi fi-rr-trash"></i></button>`}
            </div>
        `;

        pageContainer.appendChild(card);
    });

    //special last card for adding new page
    const addCard = document.createElement("div");
    addCard.className = "page-card add-card";
    addCard.innerHTML = `<div class="add-button">+</div>`;
    addCard.onclick = () => createNewPage();

    pageContainer.appendChild(addCard);

    currentIndex = 0;
}
//load and render kiosk header info
async function loadHeaderInfo() {
    if (!kioskId) {
        console.warn("owner: no kiosk id supplied, skipping header info");
        return;
    }
    try {
        const res = await apiFetch(`/api/owner/kiosk/${kioskId}/info`);
        if (!res.ok) {
            console.warn("Failed to load kiosk info", res.status);
            return;
        }
        const info = await res.json();
        if (kioskNameEl && info.kioskName) kioskNameEl.textContent = info.kioskName;
        if (ownerNameEl && info.ownerName) ownerNameEl.textContent = info.ownerName;
    } catch (error) {
        console.error("Failed to load header info:", error);
    }
}
//load and render mous
async function loadLogos() {
    if (!kioskId) {
        console.warn("owner: no kiosk id supplied, skipping logos");
        return;
    }
    const res = await apiFetch(`/api/owner/kiosk/${kioskId}/mous`);
    console.log(res.status, res.ok);
    const logos = await res.json();
    console.log("Logos response:", logos, "Type:", Array.isArray(logos));
    if (!Array.isArray(logos)) {
        console.error("Logos is not an array:", logos);
        return;
    }
    renderLogos(logos);
}
function renderLogos(logos) {
    mouContainer.innerHTML = "";

    logos.forEach(logo => {
        const card = document.createElement("div");
        card.className = "mou-card";
        card.dataset.id = logo.id;

        const imgSrc = logo.photo;

        card.innerHTML = `
            <img src="/uploads/${imgSrc}">
            <div>
                <button onclick="editMou('${logo.id}')" class="button default for-card"><i class="fi fi-rr-edit"></i></button>
                <button onclick="deleteMou('${logo.id}', this.closest('.mou-card'))" class="button alert for-card"><i class="fi fi-rr-trash"></i></button>
            </div>
        `;

        mouContainer.appendChild(card);
    });

    // special last card for adding new logo
    const addCard = document.createElement("div");
    addCard.className = "mou-card add-card";
    addCard.innerHTML = `<div class="add-button">+</div>`;
    addCard.onclick = () => createNewMou();

    mouContainer.appendChild(addCard);

    currentIndex = 0;
}
//Load decoration
async function loadDecos() {
    if (!kioskId) {
        console.warn("No kiosk id supplied, skipping decorations");
        return;
    }
    const res = await apiFetch(`/api/owner/kiosk/${kioskId}/decorations`);
    console.log(res.status, res.ok);
    const decos = await res.json();
    console.log("Decos response: ", decos, "Type: ", Array.isArray(decos));
    if (!Array.isArray(decos)) {
        console.error("Decos is not an array: ", decos);
        return;
    }

    if (!decos.length) {
        return;
    }

    const deco = decos[0];
    decoForm.elements["cp"].value = deco.color_palette || "#10507c";
    decoForm.elements["ip"].value = deco.page_interval || "5";
    decoForm.elements["mou"].value = deco.mou_option != null ? deco.mou_option : "1";
    decoForm.elements["tc"].value = deco.text_content || "";
    decoForm.elements["sd"].value = deco.side_deco || "techline";
}

//Create Update Delete for page
async function createNewPage() {
    pageForm.reset();
    pageForm.elements["id"].value = "";
    pageModal.classList.remove("hidden")
}
async function editPage(id) {
    if (!kioskId) return;
    const res = await apiFetch(`/api/owner/kiosk/${kioskId}/contents`);
    const pages = await res.json();
    try {
        const page = pages.find(p => p.id == id);
        if (!page) return alert("Halaman tidak ditemukan: 404");
        pageModal.classList.remove("hidden");

        pageForm.elements["id"].value = page.id;
        pageForm.elements["heading"].value = page.heading;
        pageForm.elements["title"].value = page.title;
        pageForm.elements["description"].value = page.description || page.desc || "";
        pageForm.elements["page_type"].value = page.page_type;
    } catch(error) {
        console.error(error);
        alert("Gagal memuat halaman");
    }
}
async function editWelcome(id) {
    if (!kioskId) return;
    const res = await apiFetch(`/api/owner/kiosk/${kioskId}/contents`);
    const pages = await res.json();
    try {
        const page = pages.find(p => p.id == id);
        if (!page) return alert("Halaman tidak ditemukan: 404");
        welcomeModal.classList.remove("hidden");

        welcomeForm.elements["id"].value = page.id;
        welcomeForm.elements["heading"].value = page.heading;
        welcomeForm.elements["description"].value = page.description || page.desc || "";
    } catch(error) {
        console.error(error);
        alert("Gagal memuat halaman");
    }
}
async function deletePage(id, cardElement) {
    if (!kioskId) return;
    if (id === "welcome") {
        alert("Tidak bisa menghapus halaman selamat datang!");
        return;
    }
    if (!confirm("Hapus halaman ini?")) return;
    try {
        const res = await apiFetch(`/api/owner/kiosk/${kioskId}/contents/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json();
            alert("Error dalam menghapus halaman: " + err.error);
            return;
        }
        if (cardElement) cardElement.remove();
        cards = Array.from(pageContainer.querySelectorAll(".page-card"));
    } catch (error) {
        console.error(error);
        alert("Server error")
    }
}

//Create Update Delete for mou
async function createNewMou() {
    mouForm.reset();
    mouForm.elements["id"].value = "";
    mouModal.classList.remove("hidden")
}
async function editMou(id) {
    if (!kioskId) return;
    const res = await apiFetch(`/api/owner/kiosk/${kioskId}/mous`);
    const logos = await res.json();
    try {
        const logo = logos.find(l => l.id == id);
        if (!logo) return alert("Logo tidak ditemukan: 404");
        mouModal.classList.remove("hidden");

        mouForm.elements["id"].value = logo.id;
    } catch(error) {
        console.error(error);
        alert("Gagal memuat mou");
    }
}
async function deleteMou(id, cardElement) {
    if (!kioskId) return;
    if (!confirm("Hapus mou ini?")) return;
    try {
        const res = await apiFetch(`/api/owner/kiosk/${kioskId}/mous/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json();
            alert("Error dalam menghapus mou: " + err.error);
            return;
        }
        if (cardElement) cardElement.remove();
        cards = Array.from(mouContainer.querySelectorAll(".mou-card"));
    } catch (error) {
        console.error(error);
        alert("Server error")
    }
}

//form event listener or something something my tummy hurts
pageForm.addEventListener("submit", async e => {
    e.preventDefault();

    const id = pageForm.elements["id"].value;
    const formData = new FormData(pageForm);
    
    // Remove id from formData for POST requests
    if (!id) {
        formData.delete("id");
    }

    const method = id ? "PUT" : "POST";
    const url = id ? `/api/owner/kiosk/${kioskId}/contents/${id}` : `/api/owner/kiosk/${kioskId}/contents`;

    console.log("[owner form] submitting", method, url, "formData keys:", Array.from(formData.keys()));

    try {
        const res = await apiFetch(url, {
        method, body: formData
        });

        console.log("[owner form] response status:", res.status);

        if (!res.ok) {
            const errJson = await res.json();
            console.error("[owner form] server error:", errJson);
            alert("Gagal menyimpan halaman: " + (errJson.error || res.statusText));
            return;
        }

        pageModal.classList.add("hidden");
        pageForm.reset();
        loadPages();
    } catch(error) {
        console.error("[owner form] fetch error:", error);
        alert("Gagal menyimpan halaman: " + error.message)
    }
});
mouForm.addEventListener("submit", async e => {
    e.preventDefault();

    const id = mouForm.elements["id"].value;
    const formData = new FormData(mouForm);
    
    // Remove id from formData for POST requests
    if (!id) {
        formData.delete("id");
    }

    const method = id ? "PUT" : "POST";
    const url = id ? `/api/owner/kiosk/${kioskId}/mous/${id}` : `/api/owner/kiosk/${kioskId}/mous`;

    try {
        const res = await apiFetch(url, {
        method, body: formData
        });

        if (!res.ok) throw new Error("Gagal menyimpan");

        mouModal.classList.add("hidden");
        mouForm.reset();
        loadLogos();
    } catch(error) {
        console.error(error);
        alert("Gagal menyimpan MoU")
    }
});
welcomeForm.addEventListener("submit", async e => {
    e.preventDefault();

    const id = welcomeForm.elements["id"].value;
    const formData = new FormData(welcomeForm);

    const method = "PUT";
    const url = `/api/owner/kiosk/${kioskId}/contents/${id}`;

    try {
        const res = await apiFetch(url, {
            method,
            body: formData
        });

        if (!res.ok) {
            const err = await res.json();
            alert("Gagal menyimpan halaman welcome: " + err.error);
            return;
        }

        welcomeModal.classList.add("hidden");
        welcomeForm.reset();
        loadPages();

    } catch (error) {
        console.error(error);
        alert("Gagal menyimpan halaman welcome");
    }
});
decoForm.addEventListener("submit", async e => {
    e.preventDefault();

    const formData = new FormData(decoForm);

    const method = "PUT";
    const url = `/api/owner/kiosk/${kioskId}/decorations`;

    try {
        const res = await apiFetch(url, {
            method,
            body: formData
        });

        if (!res.ok) {
            const err = await res.json();
            alert("Gagal menyimpan dekorasi: " + (err.error || res.statusText));
            return;
        }
        alert("Berhasil mengubah tampilan!");
        loadDecos();

    } catch (error) {
        console.error(error);
        alert("Gagal menyimpan dekorasi: " + error.message);
    }
});
document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", e => {
        const modal = e.target.closest(".modal");
        if (modal) modal.classList.add("hidden");
        modal.querySelector("form")?.reset();
    });
});
document.querySelector(".logout")?.addEventListener("click", () => {
    // Remove token
    localStorage.removeItem("token");

    // Optionally remove any cached user info
    localStorage.removeItem("userId");
    localStorage.removeItem("role");

    // Redirect to login
    window.location.href = "/login";
});
document.addEventListener("keydown", function(e) {
    if(e.key === 'F2') {
        window.location.href = `/kiosk/${kioskId}`;
    }
});
//call the whole 300 lines of code and logos
loadPages();
loadLogos();
loadDecos();
loadHeaderInfo();