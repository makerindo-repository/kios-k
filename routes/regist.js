//Song for this file:
const express = require("express"); //da backend
const pool = require("../db"); //da database
const router = express.Router(); //da route
const bcrypt = require("bcrypt");
const saltRounds = 10;

//regist endpoint: verify kiosk exists and the supplied credentials match
router.post("/regist", async (req, res) => {
    try {
        const { username, email, no_telp, password } = req.body;
        if (!username || !email || !no_telp || !password) {
            return res.status(400).json({ error: "Data incomplete" });
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const [result] = await pool.query(
            `INSERT INTO users (username, email, no_telp, password, role) VALUES (?, ?, ?, ?, "owner")`,
            [username, email, no_telp, hashedPassword]
        );
        res.status(201).json({ id: result.insertId });
    } catch(error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/regist", async (req, res) => {
    const { regist_id, name, email, password } = req.body;
    if (!regist_id || !name || !email || !password) {
        return res.status(400).json({ error: "regist_id, name, email, password required" });
    }

    try {
        //1. verify registration code exists
        const [reg_ids] = await pool.query("SELECT regist_id FROM kiosks WHERE regist_id = ?", [regist_id]);
        if (reg_ids.length === 0) {
            return res.status(401).json({ error: "Gagal registrasi: Data invalid" });
        }
        
        //2. verify user exists and password matches
        const [users] = await pool.query("SELECT id, password FROM users WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: "Gagal registrasi: Data invalid" });
        }
        const user = users[0];
        const userId = users[0].id;
        const userMatch = await bcrypt.compare(password, user.password);
        if (!userMatch) {
            return res.status(401).json({ error: "Gagal registrasi: Data invalid" });
        }


        //3. verify kiosk is not already activated
        const [kiosks]  = await pool.query("SELECT status FROM kiosks WHERE regist_id = ?", [regist_id]);
        if (kiosks.length === 0) {
            return res.status(401).json( {error: "Gagal registrasi: Data invalid"} );
        }
        const kiosk = kiosks[0];
        if (kiosk.status !== "unregistered") {
            return res.status(401).json({ error: "Batal registrasi: Kiosk sudah diregistrasikan" });
        }

        //4. count the warranty
        const now = new Date();
        const warrantyEnd = new Date();
        warrantyEnd.setFullYear(now.getFullYear() + 1);

        //5. update kiosk status and set the kiosk name from the submitted input
        const {latitude, longitude} = req.body;
        await pool.query(
            `UPDATE kiosks SET
            owner_id = ?, name = ?, status = ?, latitude = ?, longitude = ?, warranty = ?
            WHERE regist_id = ?`,
            [userId, name, 'active', latitude, longitude, warrantyEnd.toISOString().slice(0, 19).replace('T', ' '), regist_id]
        );
        return res.status(200).json({ message: "KIOS-K berhasil diaktifkan" });
    } catch(error) {
        res.status(500).json({ error: error.message });
        console.error("Failed in activating")
    }
});
//this one is for registering kiosk, technically it is an edit since if true, user just change the state
//from unregistered to active lulz :P

module.exports = router;