//Song for this file: Tetoris by Kasane Teto
const express = require("express");
const pool = require("../db");
const router = express.Router();

//get contents
router.get("/kiosk/:kioskId/contents", async (req, res) => {
    const { kioskId } = req.params;
    const [contents] = await pool.query("SELECT * FROM contents WHERE kiosk_id = ?", [kioskId]);
    res.json(contents);
});
//get mous
router.get("/kiosk/:kioskId/mous", async (req, res) => {
    const { kioskId } = req.params;
    const [rows] = await pool.query("SELECT * FROM mous WHERE kiosk_id = ?", [kioskId]);
    res.json(rows);
});
//get decos
router.get("/kiosk/:kioskId/decorations", async (req, res) => {
    const { kioskId } = req.params;
    const [rows] = await pool.query("SELECT * FROM decorations WHERE kiosk_id = ?", [kioskId]);
    res.json(rows);
});

module.exports = router;
