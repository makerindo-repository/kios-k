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

        //1. validate if fields are filled or not
        const missing = !username || !email || !no_telp || !password;
        if (missing) return res.status(400).json({ error: "Data incomplete" });

        //2. hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        //3. insert into database
        const [result] = await pool.query(
            `INSERT INTO users (username, email, no_telp, password, role)
            VALUES (?, ?, ?, ?, "owner")`,
            [username, email, no_telp, hashedPassword]
        );

        //4. return success!
        return res.status(201).json({ id: result.insertId });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            const msg = error.message;

            if (msg.includes("email")) {
                return res.status(409).json({
                    code: "EMAIL_EXISTED",
                    message: "Email already exists"
                });
            }
            if (msg.includes("no_telp")) {
                return res.status(409).json({
                    code: "PHONE_EXISTED",
                    message: "Phone numbers already exists"
                });
            }
            return res.status(409).json({
                code: "DUPLICATE",
                message: "Conflicting data"
            });
        }
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.put("/regist", async (req, res) => {
    const { regist_id, name, email, password, latitude, longitude } = req.body;

    try {
        //1. input validation checks
        if (!regist_id) {
            return res.status(400).json({
                code: "MISSING_REGIST_ID",
                message: "Registration ID is required"
            });
        }
        if (!name || name.trim() === "") {
            return res.status(400).json({
                code: "MISSING_NAME",
                message: "Name is required, cannot be empty"
            });
        }
        if (!email) {
            return res.status(400).json({
                code: "MISSING_EMAIL",
                message: "Email is required"
            });
        }
        if (!password) {
            return res.status(400).json({
                code: "MISSING_PASSWORD",
                message: "Password is required"
            });
        }

        if (!latitude || !longitude) {
            return res.status(400).json({
                code: "MISSING_LOCATION",
                message: "Location must be selected on map"
            });
        }

        //2. kiosk existence check
        const [kiosks] = await pool.query(
            "SELECT owner_id, status FROM kiosks WHERE regist_id = ?",
            [regist_id]
        );

        if (kiosks.length === 0) {
            return res.status(404).json({
                code: "INVALID_REGIST_ID",
                message: "Invalid registration ID"
            });
        }

        const kiosk = kiosks[0];

        //3. registered or not
        if (kiosk.status !== "unregistered") {
            return res.status(409).json({
                code: "KIOSK_ALREADY_ACTIVE",
                message: "Kiosk already activated"
            });
        }

        //4. check if user exists or not and password correct or not
        const [users] = await pool.query(
            "SELECT id, password FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                code: "EMAIL_NOT_FOUND",
                message: "Email does not exist"
            });
        }

        const user = users[0];

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({
                code: "INVALID_PASSWORD",
                message: "Password is incorrect"
            });
        }

        //5. set warranty
        const warrantyEnd = new Date();
        warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 1);

        //6. push query
        const [result] = await pool.query(
            `UPDATE kiosks SET
                owner_id = ?,
                name = ?,
                status = 'active',
                latitude = ?,
                longitude = ?,
                warranty = ?
             WHERE regist_id = ?`,
            [
                user.id,
                name,
                latitude,
                longitude,
                warrantyEnd.toISOString().slice(0, 19).replace("T", " "),
                regist_id
            ]
        );

       //4. return success!
        return res.status(200).json({ id: result.insertId });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: "INTERNAL_ERROR",
            message: "Internal server error"
        });
    }
});
//this one is for registering kiosk, technically it is an edit since if true, user just change the state
//from unregistered to active lulz :P

module.exports = router;