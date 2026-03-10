//Song for this file: Mesmerizer by 32ki, Hatsune Miku & Kasane Teto
const express = require("express");
const path = require("path");
const app = express();
const PORT = 8000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ownerRouter = require("./routes/owner");
const loginRouter = require("./routes/login");
const adminRouter = require("./routes/admin");

app.use("/api", loginRouter);
app.use("/api/admin", adminRouter);
app.use("/api/owner", ownerRouter);

// serve kiosk UI with kiosk id in URL: /kiosk/:kioskId
app.get('/kiosk/:kioskId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kiosk', 'index.html'));
});
app.get('/manage/:kioskId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'owner', 'owner.html'))
})
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login', 'login.html'))
})
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'superadmin', 'sadmin.html'));
})

app.listen(PORT, () => {
    console.log(`Server berjalan di [http://localhost:${PORT}]`)
});