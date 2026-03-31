//Song for this file: 
const express = require("express");
const pool = require("../db");
const path = require("path");
const multer = require("multer");
const { authenticate } = require("../middleware/auth");
const { requireOwner } = require("../middleware/roles");
const { notifyDisplay } = require("../websocket");

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, "..", "public", "uploads") });

//need authenticate and balls
router.use(authenticate);
router.use(requireOwner);

//middleware
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

//contents routes
router.get("/kiosk/:kioskId/contents", async (req, res) => {
    const { kioskId } = req.params;
    const [contents] = await pool.query("SELECT * FROM contents WHERE kiosk_id = ?", [kioskId]);
    res.json(contents);
});

router.get("/kiosk/:kioskId/info", async (req, res) => {
    const { kioskId } = req.params;
    const [rows] = await pool.query(
        `SELECT k.name AS kioskName, u.username AS ownerName
         FROM kiosks k
         LEFT JOIN users u ON k.owner_id = u.id
         WHERE k.id = ?`,
        [kioskId]
    );
    if (!rows.length) return res.status(404).json({ error: "Kiosk tidak ditemukan" });
    res.json(rows[0]);
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


//mou routes
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

//decoration routes
router.get("/kiosk/:kioskId/decorations", async (req, res) => {
    const { kioskId } = req.params;
    const [decos] = await pool.query("SELECT * FROM decorations WHERE kiosk_id = ?", [kioskId]);
    res.json(decos);
})
router.put("/kiosk/:kioskId/decorations", upload.single("kl"), async (req, res) => {
    const { kioskId } = req.params;
    const { cp = "", pi = "", mou = "1", tc = "" } = req.body;
    const kioskLogo = req.file ? req.file.filename : null;
    const [existing] = await pool.query("SELECT id, kiosk_logo FROM decorations WHERE kiosk_id = ?", [kioskId]);

    if (existing.length > 0) {
        const currentLogo = existing[0].kiosk_logo;
        await pool.query(`UPDATE decorations SET
            color_palette = ?,
            page_interval = ?,
            mou_option = ?,
            kiosk_logo = ?,
            text_content = ?
            WHERE kiosk_id = ?`,
            [cp, pi, mou, kioskLogo || currentLogo, tc, kioskId]
        );
    } else {
        await pool.query(`INSERT INTO decorations (
            kiosk_id,
            color_palette,
            page_interval,
            mou_option,
            kiosk_logo,
            text_content
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [kioskId, cp, pi, mou, kioskLogo, tc]
        );
    }

    notifyDisplay(kioskId);
    return res.status(200).json({ success: true });
});

//upload location
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