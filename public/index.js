let pageData = [];
let currentIndex = 0;
let pageInterval = null;
let carouselInterval = null;

const PAGE_INTERVAL = 5000;
const CAROUSEL_INTERVAL = 2000;
const container = document.getElementById('page-container');


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
    <section class="page single-page">
      <img src="/uploads/${photo}" class="single-image">  
      <div class="content">
        <h2>${page.heading}</h2>
        <h1>${page.title}</h1>
        <div class="description"><p>${page.desc}</p></div>
      </div>
    </section>
` ;
}
function renderMultiPage(page) {
  console.log("This page has data: ", page)
  const photos = Array.isArray(page.photo_many) ? page.photo_many : [];

  container.innerHTML = `
    <section class="page multi-page">
      <div class="carousel">
        ${photos.map((img, i) => `<img src="/uploads/${img}" class="carousel-image ${i === 0 ? "visible" : ""}">`).join("")}
      </div>
      <div class="content">
        <h2>${page.heading}</h2>
        <h1>${page.title}</h1>
        <div class="description"><p>${page.desc}</p></div>
      </div>
    </section>
  `;
  
  startCarousel(PAGE_INTERVAL / photos.length);
}

document.addEventListener("DOMContentLoaded", loadPages) ;