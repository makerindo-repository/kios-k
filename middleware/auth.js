//Song for this file: Brain Rot by Tokyo Manaka
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "himommy";

function authenticate(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "Tidak ada token" });
    
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Tidak ada token" });

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        console.log(payload, req.originalUrl);
        req.user = payload;
        next();
    } catch(error) {
        return res.status(403).json({ error: "Token invalid" });
    }
}
module.exports = { authenticate };