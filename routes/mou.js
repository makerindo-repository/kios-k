const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { randomUUID } = require("crypto");

const router = express.Router();
const DATA_FILE = path.join(__dirname, "..", "data", "logos.json");

const upload = multer({ dest: path.join(__dirname, "..", "public", "uploads") });

function readMou() {
    return JSON.parse(fs.readFileSync(DATA_FILE));
}
function writeMou(logos) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(logos, null, 2));
}

// GET all logos
router.get("/", (req, res) => {
    res.json(readMou());
});

// POST new logo
router.post("/", upload.single("image"), (req, res) => {
    const logos = readMou();
    const newLogo = {
        id: randomUUID(),
        image: req.file ? req.file.filename : null
    };
    logos.push(newLogo);
    writeMou(logos);
    res.status(201).json(newLogo);
});

// PUT update logo
router.put("/:id", upload.single("image"), (req, res) => {
    const logos = readMou();
    const index = logos.findIndex(l => l.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });

    if (req.file) {
        logos[index].image = req.file.filename;
    }

    writeMou(logos);
    res.json(logos[index]);
});

// DELETE logo
router.delete("/:id", (req, res) => {
    const logos = readMou().filter(l => l.id !== req.params.id);
    writeMou(logos);
    res.json({ success: true });
});

module.exports = router;