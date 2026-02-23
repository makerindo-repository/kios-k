let pageData = [];
let currentIndex = 0;
let pageInterval = null;
let carouselInterval = null;

const PAGE_INTERVAL = 7000;
const CAROUSEL_INTERVAL = 2000;
const container = document.getElementById('page-container');
const mouSets = document.querySelectorAll('.mou-set')

//load and shoot
async function loadPages() {
  const response = await fetch('/api/pages');
  pageData = await response.json();
  
  showPage(currentIndex);

  pageInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % pageData.length;
    showPage(currentIndex);
  }, PAGE_INTERVAL);
}
function showPage(index) {
    const page = pageData[index];
    if (!page) return;
    if (carouselInterval) {
      clearInterval(carouselInterval);
      carouselInterval = null
    }
    
    container.classList.add('fade-out');

    setTimeout(() => {
      if (page.page_type === "multi") renderMultiPage(page);
      else renderSinglePage(page);
      container.classList.remove('fade-out');
    }, 500);
};

//carousel
function startCarousel(intervalTime) {
  const images = document.querySelectorAll(".carousel-image");
  if (images.length <= 1) return;
  let imageIndex = 0;

  carouselInterval = setInterval(() => {
    images[imageIndex].classList.remove("visible");
    imageIndex = (imageIndex + 1) % images.length;
    images[imageIndex].classList.add("visible");
  }, intervalTime);
}

//page renderers
function renderSinglePage(page) {
  const photo = page.photo_one;
  
  container.innerHTML = `
    <section class="page active">
      <h2>${page.heading}</h2>
      <div class="content-template">
        <img src="/assets/techline.webp" id="lefttech">
        <img src="/uploads/${photo}" alt="" class="single-image">
        <img src="/assets/techline.webp" id="righttech">
      </div>
      <h1>${page.title}</h1>
      <div class="description"><p>${page.desc}</p></div>
    </section>

` ;
}
function renderMultiPage(page) {
  console.log("This page has data: ", page)
  const photos = Array.isArray(page.photo_many) ? page.photo_many : [];

  container.innerHTML = `
    <section class="page active">
      <h2>${page.heading}</h2>
      <div class="content-template">
        <img src="/assets/techline.webp" id="lefttech">
        <div class="carousel">${photos.map((img, i) => `<img src="/uploads/${img}" class="carousel-image ${i === 0 ? "visible" : ""}">`).join("")}</div>
        <img src="/assets/techline.webp" id="righttech">
      </div>
      <h1>${page.title}</h1>
      <div class="description"><p>${page.desc}</p></div>
    </section>
  `;
  
  startCarousel(PAGE_INTERVAL / photos.length);
}

//load the mou carousel
async function loadMoUs() {
  try {
    const res = await fetch("/api/mou");
    const moUs = await res.json();

    // Clear both sets
    const mouSets = document.querySelectorAll(".mou-set");
    mouSets.forEach(set => (set.innerHTML = ""));

    // Create image elements once
    const logos = moUs.map(logo => {
      const img = document.createElement("img");
      img.src = `/uploads/${logo.image}`;
      img.alt = "MoU Logo";
      img.className = "mou-logo";
      return img;
    });

    // Append the same logos to both sets
    mouSets.forEach(set => {
      logos.forEach(img => set.appendChild(img.cloneNode(true)));
    });
  } catch (err) {
    console.error("Failed to load MoUs:", err);
  }
}

//clock and date and message
function updateClock() {
  const timeEl = document.getElementById("time");
  const dateEl = document.getElementById("date");
  const message = document.getElementById("message");

  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
  ];
  const now = new Date();

  //time
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  timeEl.textContent = `${hours}:${minutes}:${seconds}`;

  //date
  const dayName = days[now.getDay()];
  const date = now.getDate();
  const monthName = months[now.getMonth()];
  const year = now.getFullYear();
  dateEl.textContent = `${dayName}, ${date} ${monthName} ${year}`;

  if (hours >= 6 && hours < 12) {
    message.textContent = "Selamat Pagi!"
    if (hours == 9 && minutes == 22) {
      message.textContent = "Selamat Bekerja!"
    }
  }
  else if (hours >= 12 && hours < 15) {
    if (hours == 12 && minutes == 0) {
      message.textContent = "Selamat Makan Siang, Semuanya!"
    }
    message.textContent = "Selamat Siang!"
  }
  else if (hours >= 15 && hours < 18) {
    message.textContent = "Selamat Sore!"
    if (hours == 17 && minutes == 0) {
      if (dayName == "Jumat") {
        message.textContent = "Sampai Jumpa Senin Nanti!"
      }
      else {
        message.textContent = "Sampai Jumpa Esok!"
      }
    }
  }
  else {
    message.textContent = "Selamat Malam!"
  }
  message.style.backgroundColor = "#10507c"
}

document.addEventListener("DOMContentLoaded", () => {
  loadPages(), loadMoUs()
});
updateClock();
setInterval(updateClock, 1000)

//shortcut maker for accessing /manage without typing in URL
window.addEventListener("keydown", (e) => {
  if (e.key === "F2") {
    window.location.href = "/manage";
  }
});