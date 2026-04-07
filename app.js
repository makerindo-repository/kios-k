//Song for this file: Mesmerizer by 32ki, Hatsune Miku & Kasane Teto
const express = require("express");
const http = require("http");
const path = require("path");
const { init } = require("./websocket");
const app = express();
const server = http.createServer(app);
init(server);
const PORT = 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const ownerRouter = require("./routes/owner");
const registRouter = require("./routes/regist");
const loginRouter = require("./routes/login");
const adminRouter = require("./routes/admin");
const kioskRouter = require("./routes/kiosk");

app.use("/api", kioskRouter);
app.use("/api", loginRouter);
app.use("/api", registRouter);
app.use("/api/admin", adminRouter);
app.use("/api/owner", ownerRouter);

// serve kiosk UI with kiosk id in URL: /kiosk/:kioskId
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'hero', 'hero.html'));
})
app.get('/kiosk/:kioskId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kiosk', 'kiosk.html'));
});
app.get('/manage/:kioskId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manage', 'manage.html'))
})
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login', 'login.html'))
})
app.get('/regist', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registration', 'registration.html'))
})
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'admin.html'));
})

server.listen(PORT, () => {
    console.log(`Server berjalan di [http://localhost:${PORT}]`)
});