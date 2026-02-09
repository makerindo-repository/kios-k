//for changing pages
const pages = document.querySelectorAll(".page");
const INTERVAL = 7_000;
let index = 0;

setInterval(() => {
    pages[index].classList.remove("active");
    index = (index + 1) % pages.length;
    pages[index].classList.add("active");
}, INTERVAL);

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
