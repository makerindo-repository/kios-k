const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const upload = multer({ dest: path.join(__dirname, "..", "public", "uploads") });
const { randomUUID } = require("crypto");

const router = express.Router();
const DATA_FILE = path.join(__dirname, "..", "data", "mou.json");

function readMou() {
    return JSON.parse(fs.readFileSync(DATA_FILE));
}
function writeMou(pages) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(pages, null, 2));
}

router.get("/", (req, res) => {
    res.json(readMou());
});
router.post("/", upload.single("logo"), (req, res) => {
    const mou = readMou();
    const newMoU = {
        id: randomUUID(),
        logo: req.file.logo
    };
    mou.push(newMoU);
    writeMou(mou);
    res.status(201).json(newMoU);
});
router.put("/:id", upload.single("logo"), (req, res) => {
    const mou = readMou();
    const index = mou.findIndex(p => p.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found"});
    
    if (req.file) {
        mou[index].filename = req.file.logo
    }

    writeMou(mou);
    res.json(mou[index]);
});
router.delete("/:id", (req, res) => {
    const mou = readMou().filter(l => l.id !== req.params.id);
    writeMou(pages);
    res.json({ success: true });
});

module.exports = router;