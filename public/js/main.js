//for changing pages
const pages = document.querySelectorAll(".page");
const INTERVAL = 7_300;
let index = 0;

setInterval(() => {
    pages[index].classList.remove("active");
    index = (index + 1) % pages.length;
    pages[index].classList.add("active");
}, INTERVAL);

//for the activity page changing
const activities = [
  {
    title: "Ujikom Prodi Teknologi Komputer",
    description: "Uji kompetensi ini dilaksanakan dari 22 Desember sampai 24 Desember 2025 di Politeknik Pajajaran. Bidang kompetensinya di antara lain: Junior Web Programmer / Developer, dan Basic Industrial Internet of Things.",
    images: [
      "assets/activities/ujikom1.jpg",
      "assets/activities/ujikom2.png",
      "assets/activities/ujikom3.png"
    ]
  },
  {
    title: "Ujikom SMK Negeri 1 Katapang",
    description: "Dilaksanakan pada tanggal 9 Desember 2025 di SMK Negeri 1 Katapang. Diikuti oleh seluruh kelas 12 / XII jurusan Rekayasa Perangkat Lunak.",
    images: [
      "assets/activities/katapang1.jpg",
      "assets/activities/katapang2.jpg",
      "assets/activities/katapang3.jpg"
    ]
  }
];
const page = document.querySelector(".activity-page")
const sliderImg = page.querySelector(".activity-slider img");
const titleEl = page.querySelector("#activity-title");
const descEl = page.querySelector("#activity-desc");

let activityIndex = 0;
let imageIndex = 0;
let imageInterval = null;

function startActivity(activity) {
  titleEl.textContent = activity.title;
  descEl.textContent = activity.description;

  imageIndex = 0;
  sliderImg.src = activity.images[0];

  if (imageInterval) {
    clearInterval(imageInterval);
  }

  imageInterval = setInterval(() => {
    imageIndex = (imageIndex + 1) % activity.images.length;
    sliderImg.src = activity.images[imageIndex];
  }, 2500);
}

function startActivityRotation() {
  startActivity(activities[activityIndex]);

  setInterval(() => {
    activityIndex = (activityIndex + 1) % activities.length;
    startActivity(activities[activityIndex]);
  }, 7500)
}

startActivityRotation();

//for date and clock
const timeEl = document.getElementById("time");
const dateEl = document.getElementById("date");
const message = document.getElementById("message");

const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const months = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember"
];

function updateClock() {
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

updateClock();
setInterval(updateClock, 1000);
