//Song for this file: Override by Yoshida Yasei
const express = require("express"); //da backend
const pool = require("../db"); //da database
const router = express.Router(); //da route
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "himommy";

// login endpoint: verify kiosk exists and the supplied credentials match
router.post("/login", async (req, res) => {
    const {useremail, password } = req.body;
    if (!useremail || !password) {
        return res.status(400).json({ error: "Username / email dan password dibutuhkan!" });
    }
    try {
        const [rows] = await pool.query(
            "SELECT id, password, role FROM users WHERE username = ? OR email = ?",
            [useremail, useremail]
        );
        //Check if user exists or nah
        if (rows.length === 0) {
            return res.status(401).json({ error: "Username / email ini tidak terdaftar" });
        }
        const user = rows[0];
        //check if the password is right id user does exists
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Password tidak valid" });
        };
        //generate the ohio impressed token
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "12h" });
        //check if the homeboy that logged in is the GOAT or not
        if (user.role === "superadmin") {
            return res.json({ role: "superadmin", userId: user.id, token });
        }
        //if it's not, just give the list of the kiosks they have
        const [kiosks] = await pool.query(
            "SELECT id, name FROM kiosks WHERE owner_id = ?",
            [user.id]
        );
        res.json({ role: "owner", userId: user.id, kiosks, token });
    } catch (err) {
        //if wrong throw tel aviv impressed instead
        console.error("[login] error", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;