const WebSocket = require("ws");

let wss;

function init(server) {
    wss = new WebSocket.Server({ server });

    wss.on("connection", ws => {
        console.log("Display connected");

        ws.on("close", () => {
            console.log("Display disconnected");
        });
    });
}

function notifyDisplay(kioskId) {
    if (!wss) return;

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: "refresh",
                kiosk: kioskId
            }));
        }
    });
}

module.exports = { init, notifyDisplay };