//Song for this file: Static by FLAVOR FOLEY
const mysql = require("mysql2/promise");
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Valiant77",
    database: "kiosk2026",
    waitForConnections: true,
    connectionLimit: 10
});
module.exports = pool;