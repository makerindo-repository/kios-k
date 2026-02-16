const container = document.getElementById("page-carousel");
const addModal = document.getElementById("add-modal");
const addForm = document.getElementById("add-page-form");
const cancelAdd = document.getElementById("cancel-add");

async function loadPages() {
    const res = await fetch("/api/pages");
    const pages = await res.json();
    renderCards(pages);
}

async function createNewPage() {
    addForm.reset();
    addForm.elements["id"].value = "";
    addModal.classList.remove("hidden")
}
async function editPage(id) {
    try {
        const res = await fetch("/api/pages");
        const pages = await res.json();
        const page = pages.find(p => p.id == id);
        if (!page) return alert("Halaman tidak ditemukan: 404");
        addModal.classList.remove("hidden");

        addForm.elements["id"].value = page.id;
        addForm.elements["heading"].value = page.heading;
        addForm.elements["title"].value = page.title;
        addForm.elements["desc"].value = page.desc;
        addForm.elements["page_type"].value = page.page_type;
    } catch(error) {
        console.error(error);
        alert("Gagal memuat halaman");
    }
}
async function deletePage(id, cardElement) {
    if (!confirm("Hapus halaman ini?")) return;

    try {
        const res = await fetch(`/api/pages/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json();
            alert("Error dalam menghapus halaman: " + err.error);
            return;
        }
        if (cardElement) cardElement.remove();
    } catch (error) {
        console.error(error);
        alert("Server error")
    }
}

function renderCards(pages) {
    container.innerHTML = "";

    pages.forEach(page => {
        const card = document.createElement("div");
        card.className = "page-card";

        const previewImage = page.page_type === "multi" ? page.photo_many?.[1] : page.photo_one;
        const imgSrc = previewImage || "placeholder.png"
        let shortDesc = "";
        if (page.desc) {
            const words = page.desc.split(" ");
            shortDesc = words.length > 10 ? words.slice(0, 9).join(" ") + "..." : page.desc;
        }
        card.innerHTML = `
            <img src="/uploads/${imgSrc}">
            <h3>${page.heading}</h3>
            <h2>${page.title}</h2>
            <p>${shortDesc}</p>
            <div>
                <button onclick="editPage('${page.id}')">Edit</button>
                <button onclick="deletePage('${page.id}', this.closest('.page-card'))">Hapus</button>
            </div>
        `;

        container.appendChild(card);
    });

    const addCard = document.createElement("div");
    addCard.className = "page-card add-card";
    addCard.innerHTML = `<div class="add-button">+</div>`;
    addCard.onclick = () => createNewPage();

    container.appendChild(addCard);
}

addForm.addEventListener("submit", async e => {
    e.preventDefault();

    const id = addForm.elements["id"].value;
    const formData = new FormData(addForm);

    const method = id ? "PUT" : "POST";
    const url = id ? `/api/pages/${id}` : "/api/pages";

    try {
        const res = await fetch(url, {
        method, body: formData
        });

        if (!res.ok) throw new Error("Gagal menyimpan");

        addModal.classList.add("hidden");
        addForm.reset();
        loadPages();
    } catch(error) {
        console.error(error);
        alert("Gagal menyimpan halaman")
    }
});

cancelAdd.addEventListener("click", () => {
    addModal.classList.add("hidden");
    addForm.reset();
});

loadPages();