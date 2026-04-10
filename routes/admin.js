//Song for this file: AKAGE by Smilybruh
const express = require("express");
const pool = require("../db");
const crypto = require("crypto");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roles");
const bcrypt = require("bcrypt");
const saltRounds = 10;

//enforce auth
router.use(authenticate);
router.use(requireAdmin);

//kiosks' routes
router.get("/kiosks", async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT
            k.id, k.regist_id, k.name, k.status, k.latitude, k.longitude, k.warranty, u.username
            AS owner FROM kiosks k LEFT JOIN users u ON k.owner_id = u.id`);
        res.json(rows);
    } catch(error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/kiosks", async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const kioskId = crypto.randomUUID();
        const [users] = await conn.query("SELECT id FROM users WHERE role = 'superadmin'")
        const adminId = users[0].id;
        await conn.beginTransaction();

       const [result] = await conn.query(
            `INSERT INTO kiosks (id, owner_id, name, latitude, longitude, status, warranty)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [kioskId, adminId, 'N/A', 0, 0, 'unregistered', null]
        );
        const seq = result.insertId;
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, "");
        const paddedSeq = String(seq).padStart(4, "0");
        const regist_id = `MKRKIOSK${date}${paddedSeq}`;

        await conn.query(
            `UPDATE kiosks SET regist_id = ? WHERE id = ?`, [regist_id, kioskId]
        );
        await conn.query(
            `INSERT INTO contents
            (kiosk_id, page_type, heading, title, description, photos)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                kioskId,
                "welcome",
                "Selamat Datang di",
                "",
                "Deskripsi ini bisa diganti, tapi bagian selamat datang tidak bisa dihapus.",
                JSON.stringify([])
            ]
        );
        await conn.query(`
            INSERT INTO decorations
            (kiosk_id, color_palette, page_interval, mou_option, kiosk_logo, text_content)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                kioskId,
                "#10507c",
                5,
                1,
                "",
                ""
            ]
        );
        await conn.commit();
        res.status(201).json({ id: kioskId });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        conn.release();
    }
});
router.put("/kiosks/:id", async (req, res) => {
    const kioskId = req.params.id;
    const { name } = req.body;

    try {
        const fields = [];
        const values = [];

        if (name !== undefined) {
            fields.push("name = ?");
            values.push(name);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        values.push(kioskId);

        await pool.query(
            `UPDATE kiosks SET ${fields.join(", ")} WHERE id = ?`,
            values
        );

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Update failed" });
    }
});
router.delete("/kiosks/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM kiosks WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch(error) {
        res.status(500).json({ error: error.message });
    }
})

//user's route
router.get("/users", async (req, res) => {
    try {
        // include id so caller can edit/delete
        const [rows] = await pool.query(`SELECT * FROM users WHERE role = "owner"`);
        res.json(rows);
    } catch(error) {
        res.status(500).json({ error: error.message });
    }
});
// get specific user (optional - might be useful)
router.get("/users/:id", async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT id, username, email FROM users WHERE id = ?`, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(rows[0]);
    } catch(error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/users", async (req, res) => {
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
router.put("/users/:id", async (req, res) => {
    const { username, email, password } = req.body;
    const id = req.params.id;
    try {
        const fields = [];
        const values = [];
        if (username !== undefined) {
            fields.push("username = ?");
            values.push(username);
        }
        if (email !== undefined) {
            fields.push("email = ?");
            values.push(email);
        }
        if (password !== undefined) {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            fields.push("password = ?");
            values.push(hashedPassword);
        }
        if (fields.length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }
        values.push(id);
        await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
        res.json({ success: true });
    } catch(error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete("/users/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch(error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;