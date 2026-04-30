const express = require('express');
const app = express();
__path = process.cwd();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
let code = require('./pair');   // this now loads the new pair.js router

require('events').EventEmitter.defaultMaxListeners = 500;

// Serve the web pairing page
app.use('/code', code);
app.use('/pair', async (req, res) => {
    res.sendFile(__path + '/pair.html');
});
app.use('/', async (req, res) => {
    res.sendFile(__path + '/main.html');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════╗
║      🖤  ʙʟᴀᴄᴋᴀɴɢᴇʟ-ᴅɢx  🖤         ║
║      WhatsApp Mini Bot              ║
║      Server running on port ${PORT}   ║
║      Zero‑prefix • Auto‑owner       ║
╚══════════════════════════════════════╝
`);
});

module.exports = app;
