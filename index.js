const pages = document.querySelectorAll(".page");
const INTERVAL = 7_000; // 30 seconds
let index = 0;

setInterval(() => {
    pages[index].classList.remove("active");
    index = (index + 1) % pages.length;
    pages[index].classList.add("active");
}, INTERVAL);