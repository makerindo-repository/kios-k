//Song for this file: BUTCHER VANITY by Vane Lily

//carousel state
let pageData = [];
let currentIndex = 0;
let pageInterval = null;
let carouselInterval = null;

const PAGE_INTERVAL = 7000; // how long each page stays visible
const CAROUSEL_INTERVAL = 2000; // fallback carousel speed
const container = document.getElementById('page-container');

//find way to load all the pages related the kioskId, then turn it into carousel
//for multi page, each picture has a show time of INTERVAL / amount of pictures (7 / 4 = 1.75 seconds each)

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
function updateLocation() {
  const kioskId = new URLSearchParams(window.location.search).get("kiosk") || window.location.pathname.split("/")[2];
  if (!navigator.geolocation || !kioskId) return;
  
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const deltaLat = pos.coords.latitude + 0.134346;
      const deltaLong = pos.coords.longitude + -2.773102
      console.log(deltaLat, deltaLong);
      await apiFetch(`/api/owner/kiosk/${kioskId}/location`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: deltaLat, longitude: deltaLong})
      });
    } catch (err) {
      console.error("Location update failed", err);
    }
  }, (err) => {
    console.warn("User denied or unavailable location", err);
  });
}
function startWebSocket(kioskId) {
  const ws = new WebSocket(`ws://${location.host}`);
  ws.onopen = () => {
    console.log("[WS] connected");
  };
  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch (err) {
      console.warn("Non-JSON WS message:", event.data);
      return;
    }
    if (msg.type === "refresh" && msg.kiosk == kioskId) {
      console.log("[WS] refresh received for kiosk", kioskId);

      loadContents();
      loadMoUs();
    }
  };

  ws.onclose = () => {
    console.log("[WS] disconnected, retrying...");
    setTimeout(() => startWebSocket(kioskId), 3000); // auto reconnect
  };
}

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

// load contents for this kiosk and start the carousel
async function loadContents() {
  if (pageInterval) {
    clearInterval(pageInterval);
    pageInterval = null;
  }
  if (carouselInterval) {
    clearInterval(carouselInterval);
    carouselInterval = null;
  }
  
  const params = new URLSearchParams(window.location.search);
  let kioskId = params.get("kiosk");
  if (!kioskId) {
    const parts = window.location.pathname.split("/");
    kioskId = parts[2] || null;
  }

  if (!kioskId) {
    console.warn("No kiosk id provided in URL");
    return;
  }

  try {
    console.log("[kiosk] loading contents for kioskId=", kioskId);
    const res = await apiFetch(`/api/owner/kiosk/${kioskId}/contents`);
    if (!res.ok) {
      console.error("Failed to load contents", res.status);
      return;
    }
    const pages = await res.json();
    console.log("[kiosk] pages returned:", pages);
    pageData = pages;
    currentIndex = 0;
    showPage(currentIndex);
    pageInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % pageData.length;
      showPage(currentIndex);
    }, PAGE_INTERVAL);
  } catch (err) {
    console.error("Error fetching contents:", err);
  }
}

// helpers for photos parsing (shared by renderers)
function parsePhotosField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "string") return [parsed];
    } catch (e) {
      return [val];
    }
  }
  return [];
}

// display a specific page, handle multi-image carousel
function showPage(index) {
  const page = pageData[index];
  if (!page) return;
  if (carouselInterval) {
    clearInterval(carouselInterval);
    carouselInterval = null;
  }

  container.classList.add('fade-out');
  setTimeout(() => {
    if (page.page_type === "welcome") renderWelcomePage(page);
    else if (page.page_type === "multi") renderMultiPage(page);
    else renderSinglePage(page);
    container.classList.remove('fade-out');
  }, 500);
}

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

function renderSinglePage(page) {
  const photos = parsePhotosField(page.photos);
  const photo = photos[0] || "placeholder.png";
  container.innerHTML = `
    <section class="page active">
      <h2>${page.heading}</h2>
      <div class="content-template">
        <img src="/assets/techline.webp" id="lefttech">
        <img src="/uploads/${photo}" alt="" class="single-image">
        <img src="/assets/techline.webp" id="righttech">
      </div>
      <h1>${page.title}</h1>
      <div class="description"><p>${page.description || page.desc || ""}</p></div>
    </section>
  `;
}
function renderMultiPage(page) {
  const photos = parsePhotosField(page.photos);

  container.innerHTML = `
    <section class="page active">
      <h2>${page.heading}</h2>
      <div class="content-template">
        <img src="/assets/techline.webp" id="lefttech">
        <div class="carousel">${photos.map((img, i) => `<img src="/uploads/${img}" class="carousel-image ${i === 0 ? "visible" : ""}">`).join("")}</div>
        <img src="/assets/techline.webp" id="righttech">
      </div>
      <h1>${page.title}</h1>
      <div class="description"><p>${page.description || page.desc || ""}</p></div>
    </section>
  `;

  startCarousel(PAGE_INTERVAL / (photos.length || 1));
}
function renderWelcomePage(page) {
  const photos = parsePhotosField(page.photos);
  const photo = photos[0] || "placeholder.png";
  container.innerHTML = `
    <section class="page active">
      <h2>${page.heading}</h2>
      <div class="content-template">
        <img src="/assets/techline.webp" id="lefttech">
        <img src="/uploads/${photo}" alt="" class="single-image" id="logo">
        <img src="/assets/techline.webp" id="righttech">
      </div>
      <div class="description"><p>${page.description || page.desc || ""}</p></div>
    </section>
  `;
}

//load the mou carousel (same as old file)
async function loadMoUs() {
  const params = new URLSearchParams(window.location.search);
  let kioskId = params.get("kiosk");
  if (!kioskId) {
    const parts = window.location.pathname.split("/");
    kioskId = parts[2] || null;
  }

  if (!kioskId) {
    console.warn("No kiosk id provided in URL");
    return;
  }

  try {
    const res = await apiFetch(`/api/owner/kiosk/${kioskId}/mous`);
    const moUs = await res.json();
    console.log(moUs);

    // Clear both sets
    const mouSets = document.querySelectorAll(".mou-set");
    mouSets.forEach(set => (set.innerHTML = ""));

    // Create image elements once
    const logos = moUs.map(logo => {
      const img = document.createElement("img");
      img.src = `/uploads/${logo.photo}`;
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

// automatically load contents after clock initialization
// and run Mou carousel using DOMContentLoaded

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  let kioskId = params.get("kiosk");
  if (!kioskId) {
    const parts = window.location.pathname.split("/");
    kioskId = parts[2] || null;
  }
  if (kioskId) {
    startWebSocket(kioskId);
  }

  loadContents();
  loadMoUs();
  updateLocation();
  setInterval(updateLocation, 60000);
});

updateClock();
setInterval(updateClock, 1000);
