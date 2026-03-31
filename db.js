//Song for this file: Static by FLAVOR FOLEY
const mysql = require("mysql2/promise");
const pool = mysql.createPool({
    host: "localhost",
    user: "kiosk",
    password: "PASSWORD",
    database: "kiosk",
    waitForConnections: true,
    connectionLimit: 10
});
module.exports = pool;