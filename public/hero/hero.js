const descModal = document.getElementById("description");
const descButton = document.getElementById("desc-button");

descButton.onclick = () => descModal.classList.remove("hidden");

document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", e => {
        const modal = e.target.closest(".modal");
        if (modal) modal.classList.add("hidden");
        modal.querySelector("form")?.reset();
    });
});