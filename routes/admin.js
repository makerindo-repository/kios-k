const express = require("express");
const pool = require("../db");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roles");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// --- Enforce authentication and admin role for all routes ---
router.use(authenticate);
router.use(requireAdmin);

// ---------------- Kiosks Routes ----------------
router.get("/kiosks", async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT k.id, k.name, k.status, k.latitude, k.longitude, u.username AS owner FROM kiosks k LEFT JOIN users u ON k.owner_id = u.id`);
        res.json(rows);
    } catch(error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/kiosks", async (req, res) => {
    const conn = await pool.getConnection();

    try {
        const { name, owner_id } = req.body;
        if (!name || !owner_id) {
            return res.status(400).json({ error: "Nama dan pemilik dibutuhkan" });
        }
        const kioskId = crypto.randomUUID();
        await conn.beginTransaction();

        await conn.query(
            `INSERT INTO kiosks (id, name, owner_id, latitude, longitude)
             VALUES (?, ?, ?, 0, 0)`,
            [kioskId, name, owner_id]
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
    const { name, owner_id, status, latitude, longitude } = req.body;

    try {
        const fields = [];
        const values = [];

        if (name !== undefined) {
            fields.push("name = ?");
            values.push(name);
        }

        if (owner_id !== undefined) {
            fields.push("owner_id = ?");
            values.push(owner_id);
        }

        if (status !== undefined) {
            fields.push("status = ?");
            values.push(status);
        }

        if (latitude !== undefined) {
            fields.push("latitude = ?");
            values.push(latitude);
        }
        
        if (longitude !== undefined) {
            fields.push("longitude = ?");
            values.push(longitude);
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

// ---------------- Users Routes ----------------
router.get("/users", async (req, res) => {
    try {
        // include id so caller can edit/delete
        const [rows] = await pool.query(`SELECT id, username, email, role FROM users WHERE role = "owner"`);
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
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: "username,email,password required" });
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const [result] = await pool.query(
            `INSERT INTO users (username,email,password,role) VALUES (?, ?, ?, "owner")`,
            [username, email, hashedPassword]
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
        console.log(values);
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