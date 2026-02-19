const container = document.getElementById("page-carousel");
const addModal = document.getElementById("add-modal");
const addForm = document.getElementById("add-page-form");
const cancelAdd = document.getElementById("cancel-add");

let currentIndex = 0;
let cards = [];

//Load and render dat shi
async function loadPages() {
    const res = await fetch("/api/pages");
    const pages = await res.json();
    renderCards(pages);
}
function renderCards(pages) {
    container.innerHTML = "";

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

    //special last card for adding new page
    const addCard = document.createElement("div");
    addCard.className = "page-card add-card";
    addCard.innerHTML = `<div class="add-button">+</div>`;
    addCard.onclick = () => createNewPage();

    container.appendChild(addCard);

    currentIndex = 0;
    initNavigation();
}

//highlight, let owner know what page they are in
//function initNavigation() {
//     cards = Array.from(document.querySelectorAll(".page-card"));
//     highlightCard();
// }
// function highlightCard() {
//     cards.forEach((card, i) => {
//         if (i === currentIndex) {
//             card.style.display = "flex";
//             card.classList.add("active");
//         } else {
//             card.style.display = "none";
//             card.classList.remove("active");
//         }
//     });
// }

// //MASSIVE keyboard shortcute (bro is dragging low taper fade in the grand '26)
// window.addEventListener("keydown", (e) => {
//     if (addModal.classList.contains("hidden")) { //if modal opens DO NOT do anything
//         switch (e.key) {
//             case "ArrowRight": //go right!
//                 if (currentIndex < cards.length - 1) currentIndex++;
//                 highlightCard();
//                 break;
//             case "ArrowLeft": //go left!
//                 if (currentIndex > 0) currentIndex--;
//                 highlightCard();
//                 break;
            
//             case "Enter": //edit if in a page create if in last page
//                 const activeCard = cards[currentIndex];
//                 if (currentIndex === cards.length - 1) {
//                     createNewPage();
//                 } else {
//                     const id = activeCard.dataset.id;
//                     editPage(id);
//                 }
//                 break;
//             case "Delete": //delete if in a page do nothing if in last page
//                 const cardToDelete = cards[currentIndex];
//                 if (!cardToDelete.dataset.add) {
//                     const id = cardToDelete.dataset.id;
//                     deletePage(id, cardToDelete);
//                 }
//                 break;
//             case "F1": //back to kiosk view
//                 window.location.href = "/";
//                 break;
//     }} else {
//         switch (e.key) {
//             case "Escape":
//                 addModal.classList.add("hidden");
//                 addForm.reset();
//         }
//     }
// });

//Create Update Delete trio
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
        cards = Array.from(container.querySelectorAll(".page-card"));
        if (currentIndex >= cards.length) currentIndex = cards.length - 1;
        highlightCard();
    } catch (error) {
        console.error(error);
        alert("Server error")
    }
}

//form event listener or something something my tummy hurts
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

//call the whole 180 lines of code
loadPages();