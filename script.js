document.addEventListener('DOMContentLoaded', () => {
    // Hero
    const videos = [
        "asset-video1.mp4",
        "asset-video2.mp4",
        "asset-video3.mp4"
    ];
    const hrText = [
        {
            title: 'Taat Kepada Tuhan Yang Maha Esa',
            description: `Dengan Pengajian yang di lakukan setiap 1 minggu sekali agar pekerjaan yang di kerjakaan selama satu minggu menjadi amal ibadah pribadi masing masing`
        },
        {
            title: 'Menciptakan Produk yang bermanfaat',
            description: `Dengan produk kami yang akan di gunakan untuk mempermudah berbagai pekerjaan`
        },
        {
            title: 'Mengedukasi setiap generasi dan meningkat kan intelektual',
            description: `Dengan pelatihan pelatihan yang kami berikan dan workshop edukasi`
        },
    ]

    const bgVideo = document.getElementById("bg-video");
    const heroText = document.getElementById('hero-text');
    let indexVideo = 0;
    setInterval(() => {
        indexVideo = (indexVideo + 1) % videos.length; // loop array
        bgVideo.src = videos[indexVideo];         // ganti video
        console.log("video url: " + videos[indexVideo])
        bgVideo.play();                      // pastikan langsung play
        console.log("indexVideo video " + indexVideo);

        heroText.innerHTML = `<h2>${hrText[indexVideo].title}</h2>
                    <p>${hrText[indexVideo].description}</p>`
    }, 5000);

    // MoU
    const data = [
        {icon: "icon1.png", name: "Universitas Pendidikan Indonesia"},
        {icon: "icon2.png", name: "Institut Pendidikan Bogor"},
        {icon: "icon3.png", name: "Politeknik Elektro Surabaya"},
        {icon: "icon4.png", name: "Universitas Singaperbangsa Karawang"},
        {icon: "icon5.png", name: "SMKN 3 Banjar"},
        {icon: "icon6.png", name: "SMKN 2 Sukabumi"}
    ]

    const grid = document.getElementById('grid')

    data.forEach(data => {
        const col = document.createElement("div");
        col.className = "column";
        col.innerHTML = `<div class="icon" style="background-image: url('${data.icon}');"></div><p>${data.name}</p>`;
        grid.appendChild(col);
    });

    data.forEach(data => {
        const col = document.createElement("div");
        col.className = "column";
        col.innerHTML = `<div class="icon" style="background-image: url('${data.icon}');"></div><p>${data.name}</p>`;
        grid.appendChild(col);
    });

    // --- 3. Animasi manual ---
    let x = 0;
    function animate() {
        x -= 1; // geser ke kiri per frame
        const halfWidth = grid.scrollWidth / 2;
        if (Math.abs(x) >= halfWidth) x = 0; // reset ke awal jika sudah setengah
        grid.style.transform = `translateX(${x}px)`;
        requestAnimationFrame(animate);
    }

    animate();

    // Card Image
    const front = document.querySelector('#product-image .img-front');
    const back = document.querySelector('#product-image .img-back');
    const product = document.getElementById('product-column')


    const background = [
        'product1.jpeg',
        'product2.jpeg',
        'product3.jpeg',
        'product4.jpg',
    ];
    const prText = [
        {
            name: "Smart Halter",
            description: "Sebuah Halter dengan basis IoT yang bisa di gunakan untuk monitoring kesehatan kuda secara Realtime dan ada versi yang memiliki GPS untuk kuda yang biasa berkeliaran"
        },
        {
            name: "IoT Tracker | Buldozer Subsoil",
            description: "Alat dengan basis IoT yang berguna untuk deteksi progress pekerjaan buldozer di lengkapi dengan sensor ultrasonic dan gps sehingga bisa terdeteksi berapa kedalaman tanah yang di gali di berbagai lokasi"
        },
        {
            name: "Bitanic Lite+",
            description: "Alat dengan basis IoT yang berguna untuk memonitoring kondisi tanaman secara realtime di lengkapi dengan fitur penyiraman sehingga dapat melakukan penyiraman secara remote atau terjadwal secara otomatis"
        },
        {
            name: "Precision Agriculture Trainer Kit",
            description: "Sebuah Trainerkit untuk praktikum fakultas Pertanian, dengan fitur penyiraman otomatis pengecekan unsur basa tanah"
        }
    ]

    let index = 0;
    let next = 1;

    front.style.backgroundImage = `url(${background[index]})`;
    back.style.backgroundImage = `url(${background[next]})`;    

    setInterval(() => {
        front.classList.add('slide-out');
        // 2️⃣ setelah selesai transisi (1 detik)
        product.innerHTML = `<h4>${prText[index].name}</h4>
                        <p>${prText[index].description}</p>`
        setTimeout(() => {
            // swap peran: front ↔ back
            console.log(index);

            index = (index + 1) % background.length;
            next = (index + 1) % background.length;

            // reset posisi front
            front.style.transition = 'none';
            front.classList.remove('slide-out');

            void front.offsetWidth;
            front.style.transition = '';

            // tukar elemen: front menjadi belakang, back menjadi depan
            const temp = front.style.backgroundImage;
            front.style.backgroundImage = back.style.backgroundImage;
            back.style.backgroundImage = `url(${background[next]})`;
        }, 1000);
    }, 7000)
});