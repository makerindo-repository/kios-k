const express = require("express");
const path = require("path");
const app = express();
const PORT = 6767;

app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.listen(PORT, () => {
    console.log("Server anda berlari di [http://localhost:6767]")
})