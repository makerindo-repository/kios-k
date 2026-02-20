const express = require("express");
const path = require("path");
const pagesRouter = require("./routes/pages");
const mouRouter = require("./routes/mou")

const app = express();
const PORT = 8000;

app.use(express.json());
app.use("/api/pages", pagesRouter);
app.use("/api/mou", mouRouter);
app.use(express.static("public"));

app.get("/manage", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "manage.html"))
});

app.listen(PORT, () => {
    console.log(`Server berjalan di [http://localhost:${PORT}]`)
});