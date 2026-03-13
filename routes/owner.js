// owner.js
const express = require("express");
const pool = require("../db");
const path = require("path");
const multer = require("multer");
const { authenticate } = require("../middleware/auth");
const { requireOwner } = require("../middleware/roles");
const { notifyDisplay } = require("../websocket");

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, "..", "public", "uploads") });

// --- Enforce authentication and owner role for all routes ---
router.use(authenticate);
router.use(requireOwner);

// --- Middleware: authenticate & verify kiosk ownership ---
router.use("/kiosk/:kioskId", async (req, res, next) => {
    const { kioskId } = req.params;
    const { userId, name } = req.user;

    // check if kiosk belongs to this owner
    const [rows] = await pool.query(
        "SELECT id FROM kiosks WHERE id = ? AND owner_id = ? AND status = 'active'",
        [kioskId, userId]
    );
    if (rows.length === 0) return res.status(403).json({ error: `Akses ditolak: kiosk ini bukan milik ${name}` });

    next();
});

// ---------------- Contents Routes ----------------
router.get("/kiosk/:kioskId/contents", async (req, res) => {
    const { kioskId } = req.params;
    const [contents] = await pool.query("SELECT * FROM contents WHERE kiosk_id = ?", [kioskId]);
    res.json(contents);
});

router.post("/kiosk/:kioskId/contents", upload.array("photos", 5), async (req, res) => {
    const { kioskId } = req.params;
    const files = req.files.map(f => f.filename);
    const { heading = "", title = "", description = "", page_type = "single" } = req.body;

    const [result] = await pool.query(
        `INSERT INTO contents (kiosk_id, heading, title, description, photos, page_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [kioskId, heading, title, description, JSON.stringify(files), page_type]
    );
    notifyDisplay(kioskId);
    res.status(201).json({ id: result.insertId });
});

router.put("/kiosk/:kioskId/contents/:id", upload.array("photos", 5), async (req, res) => {
    const { kioskId, id } = req.params;
    const files = (req.files || []).map(f => f.filename);

    await pool.query(
        `UPDATE contents SET
            heading = COALESCE(?, heading),
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            page_type = COALESCE(?, page_type)
        WHERE id = ? AND kiosk_id = ?`,
        [req.body.heading, req.body.title, req.body.description, req.body.page_type, id, kioskId]
    );

    if (files.length > 0) {
        await pool.query("UPDATE contents SET photos = ? WHERE id = ? AND kiosk_id = ?", [JSON.stringify(files), id, kioskId]);
    }
    notifyDisplay(kioskId);
    res.json({ success: true });
});

router.delete("/kiosk/:kioskId/contents/:id", async (req, res) => {
    const { kioskId, id } = req.params;
    await pool.query("DELETE FROM contents WHERE id = ? AND kiosk_id = ?", [id, kioskId]);
    notifyDisplay(kioskId);
    res.json({ success: true });
});


// ---------------- MoU Routes ----------------
router.get("/kiosk/:kioskId/mous", async (req, res) => {
    const { kioskId } = req.params;
    const [rows] = await pool.query("SELECT * FROM mous WHERE kiosk_id = ?", [kioskId]);
    res.json(rows);
});

router.post("/kiosk/:kioskId/mous", upload.single("image"), async (req, res) => {
    const { kioskId } = req.params;
    const filename = req.file ? req.file.filename : null;
    const [result] = await pool.query("INSERT INTO mous (kiosk_id, photo) VALUES (?, ?)", [kioskId, filename]);
    res.status(201).json({ id: result.insertId, photo: filename });
});

router.put("/kiosk/:kioskId/mous/:id", upload.single("image"), async (req, res) => {
    const { kioskId, id } = req.params;
    if (req.file) {
        await pool.query("UPDATE mous SET photo = ? WHERE id = ? AND kiosk_id = ?", [req.file.filename, id, kioskId]);
    }
    res.json({ success: true });
});

router.delete("/kiosk/:kioskId/mous/:id", async (req, res) => {
    const { kioskId, id } = req.params;
    await pool.query("DELETE FROM mous WHERE id = ? AND kiosk_id = ?", [id, kioskId]);
    res.json({ success: true });
});


router.put("/kiosk/:kioskId/location", async (req, res) => {
    const { kioskId } = req.params;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: "Latitude and longitude required" });
    }

    try {
        const [rows] = await pool.query(
            "SELECT id FROM kiosks WHERE id = ?",
            [kioskId]
        );

        if (rows.length === 0) {
            return res.status(403).json({ error: "Not allowed to update this kiosk" });
        }

        await pool.query(
            "UPDATE kiosks SET latitude = ?, longitude = ? WHERE id = ?",
            [latitude, longitude, kioskId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Update failed" });
    }
});

module.exports = router;