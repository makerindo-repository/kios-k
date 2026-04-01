//Song for this file: Sell A Friend by Azari
function requireAdmin(req, res, next) {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
        return res.status(403).json({ error: "Hanya untuk admin"});
    }
    next();
}
function requireOwner(req, res, next) {
    if (req.user.role !== "owner") {
        return res.status(403).json({ error: "Hanya untuk pengguna" });
    }
    next();
}
module.exports = { requireAdmin, requireOwner };