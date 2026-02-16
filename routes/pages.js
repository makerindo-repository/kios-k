const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const upload = multer({ dest: path.join(__dirname, "..", "public", "uploads") });
const { randomUUID } = require("crypto");

const router = express.Router();
const DATA_FILE = path.join(__dirname, "..", "data", "pages.json");

function readPages() {
    return JSON.parse(fs.readFileSync(DATA_FILE));
}
function writePages(pages) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(pages, null, 2));
}

router.get("/", (req, res) => {
    res.json(readPages());
});
router.post("/", upload.array("photos", 5), (req, res) => {
    const pages = readPages();
    const files = req.files.map(f => f.filename);
    const newPage = {
        id: randomUUID(),
        heading: req.body.heading,
        title: req.body.title,
        desc: req.body.desc,
        page_type: req.body.page_type,
        photo_one: req.body.page_type === "single" ? files[0] : undefined,
        photo_many: req.body.page_type === "multi" ? files : []
    };
    pages.push(newPage);
    writePages(pages);
    res.status(201).json(newPage);
});
router.put("/:id", upload.array("photos", 5), (req, res) => {
    const pages = readPages();
    const index = pages.findIndex(p => p.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found"});
    
    const files = req.files?.map(f => f.filename) || [];
    const existingPage = pages[index];
    const updatedPage = {
        ...existingPage,
        heading: req.body.heading ?? existingPage.heading,
        title: req.body.title ?? existingPage.title,
        desc: req.body.desc ?? existingPage.desc,
        page_type: req.body.page_type ?? existingPage.page_type
    };

    if (updatedPage.page_type === "single") {
        if (files.length > 0) {updatedPage.photo_one = files[0];}
    }
    if (updatedPage.page_type === "multi") {
        if (files.length > 0) {updatedPage.photo_many = files;}
    }

    pages[index] = updatedPage;
    
    writePages(pages);
    res.json(updatedPage);
});
router.delete("/:id", (req, res) => {
    const idToDelete = String(req.params.id).trim()
    console.log("Deleting page: ", idToDelete)
    const pages = readPages().filter(p => p.id !== idToDelete);
    writePages(pages);
    res.json({ success: true });
});

module.exports = router;