const pageContainer = document.getElementById("page-carousel");
const mouContainer = document.getElementById("mou-carousel");
const addPageModal = document.getElementById("add-page-modal");
const addPageForm = document.getElementById("add-page-form");
const addMouModal = document.getElementById("add-mou-modal");
const addMouForm = document.getElementById("add-mou-form");
const cancelAdd = document.getElementById("cancel-add");

let cards = [];

//Load and render dat pages shi
async function loadPages() {
    const res = await fetch("/api/pages");
    const pages = await res.json();
    renderCards(pages);
}
function renderCards(pages) {
    pageContainer.innerHTML = "";

    pages.forEach(page => {
        const card = document.createElement("div");
        card.className = "page-card";
        card.dataset.id = page.id;

        const previewImage = page.page_type === "multi" ? page.photo_many?.[1] : page.photo_one;
        const imgSrc = previewImage || "placeholder.png"
        let shortDesc = "";
        if (page.desc) {
            const words = page.desc.split(" ");
            shortDesc = words.length > 20 ? words.slice(0, 19).join(" ") + "..." : page.desc;
        }
        card.innerHTML = `
            <img src="/uploads/${imgSrc}">
            <p id="heading"><b>${page.heading}</b></p>
            <p id="title"><b>${page.title}</b></p>
            <p id="desc">${shortDesc}</p>
            <div>
                <button onclick="editPage('${page.id}')">Edit</button>
                <button onclick="deletePage('${page.id}', this.closest('.page-card'))">Hapus</button>
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

//load and render dat mou shi
async function loadLogos() {
    const res = await fetch("/api/mou");
    console.log(res.status, res.ok);
    const logos = await res.json();
    console.log(logos);
    renderLogos(logos);
}
function renderLogos(logos) {
    mouContainer.innerHTML = "";

    logos.forEach(logo => {
        const card = document.createElement("div");
        card.className = "mou-card";
        card.dataset.id = logo.id;

        const imgSrc = logo.image;

        card.innerHTML = `
            <img src="/uploads/${imgSrc}">
            <div>
                <button onclick="editMou('${logo.id}')">Edit</button>
                <button onclick="deleteMou('${logo.id}', this.closest('.mou-card'))">Hapus</button>
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

//Create Update Delete trio
async function createNewPage() {
    addPageForm.reset();
    addPageForm.elements["id"].value = "";
    addPageModal.classList.remove("hidden")
}
async function editPage(id) {
    try {
        const res = await fetch("/api/pages");
        const pages = await res.json();
        const page = pages.find(p => p.id == id);
        if (!page) return alert("Halaman tidak ditemukan: 404");
        addPageModal.classList.remove("hidden");

        addPageForm.elements["id"].value = page.id;
        addPageForm.elements["heading"].value = page.heading;
        addPageForm.elements["title"].value = page.title;
        addPageForm.elements["desc"].value = page.desc;
        addPageForm.elements["page_type"].value = page.page_type;
    } catch(error) {
        console.error(error);
        alert("Gagal memuat halaman");
    }
}
async function deletePage(id, cardElement) {
    if (id === "welcome") {
        alert("Tidak bisa menghapus halaman selamat datang!");
        return;
    }
    if (!confirm("Hapus halaman ini?")) return;
    try {
        const res = await fetch(`/api/pages/${id}`, { method: "DELETE" });
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

//Create Update Delete trio #2
async function createNewMou() {
    addMouForm.reset();
    addMouForm.elements["id"].value = "";
    addMouModal.classList.remove("hidden")
}
async function editMou(id) {
    try {
        const res = await fetch("/api/mou");
        const logos = await res.json();
        const logo = logos.find(l => l.id == id);
        if (!logo) return alert("Logo tidak ditemukan: 404");
        addMouModal.classList.remove("hidden");

        addMouForm.elements["id"].value = logo.id;
    } catch(error) {
        console.error(error);
        alert("Gagal memuat mou");
    }
}
async function deleteMou(id, cardElement) {
    if (!confirm("Hapus mou ini?")) return;
    try {
        const res = await fetch(`/api/mou/${id}`, { method: "DELETE" });
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
addPageForm.addEventListener("submit", async e => {
    e.preventDefault();

    const id = addPageForm.elements["id"].value;
    const formData = new FormData(addPageForm);

    const method = id ? "PUT" : "POST";
    const url = id ? `/api/pages/${id}` : "/api/pages";

    try {
        const res = await fetch(url, {
        method, body: formData
        });

        if (!res.ok) throw new Error("Gagal menyimpan");

        addPageModal.classList.add("hidden");
        addPageForm.reset();
        loadPages();
    } catch(error) {
        console.error(error);
        alert("Gagal menyimpan halaman")
    }
});
addMouForm.addEventListener("submit", async e => {
    e.preventDefault();

    const id = addMouForm.elements["id"].value;
    const formData = new FormData(addMouForm);

    const method = id ? "PUT" : "POST";
    const url = id ? `/api/mou/${id}` : "/api/mou";

    try {
        const res = await fetch(url, {
        method, body: formData
        });

        if (!res.ok) throw new Error("Gagal menyimpan");

        addMouModal.classList.add("hidden");
        addMouForm.reset();
        loadLogos();
    } catch(error) {
        console.error(error);
        alert("Gagal menyimpan MoU")
    }
});

document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", e => {
        const modal = e.target.closest(".modal");
        if (modal) modal.classList.add("hidden");
        modal.querySelector("form")?.reset();
    });
});

//call the whole 180 lines of code and logos
loadLogos();
loadPages();