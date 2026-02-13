let pageData = [];
let currentIndex = 0;
let pageInterval = null;
let carouselInterval = null;

const PAGE_INTERVAL = 6000;
const CAROUSEL_INTERVAL = 2000;
const container = document.getElementById('page-container');


//load and shoot
async function loadPages() {
  const response = await fetch('/data/pages.json');
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
    

    if (page.page_type === 'multi') {
      renderMultiPage(page);
    } else {
      renderSinglePage(page);
    }
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
      <h2>${page.heading}</h2>
      <div class="content">
          <img src="/uploads/${photo}" class="single-image">
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
    <section class="page multi-page">
      <h2>${page.heading}</h2>
      <div class="content">
        <div class="carousel">
          ${photos.map((img, i) => `<img src="/uploads/${img}" class="carousel-image ${i === 0 ? "visible" : ""}">`).join("")}
        </div>
      </div>
      <h1>${page.title}</h1>
      <div class="description">
        <p>${page.desc}</p>
      </div>
    </section>
  `;
  
  startCarousel(Math.max(PAGE_INTERVAL / photos.length, 1000));
}

document.addEventListener("DOMContentLoaded", loadPages) ;