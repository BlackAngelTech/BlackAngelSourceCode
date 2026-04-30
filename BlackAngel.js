// BlackAngel.js - BlackAngel-DGX Command Plugin
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const yts = require('yt-search');
const ddownr = require('denethdev-ytmp3');
const { sms, downloadMediaMessage } = require('./msg');
const { makeid } = require('./Id');
const { Octokit } = require('@octokit/rest');
const cheerio = require('cheerio');
const crypto = require('crypto');
const os = require('os');
const Jimp = require('jimp');
const FormData = require('form-data');

// ---------- CONSTANTS ----------
const MAIN_OWNER = '263776404156';
const RCD_IMAGE_PATH = 'https://files.catbox.moe/9gn6lm.jpg';
const NEWSLETTER_JID = '120363422682987205@newsletter';
const githubToken = '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';
const octokit = new Octokit({ auth: githubToken });
const ownerGit = 'dev-flax';
const repo = 'session';

// ---------- HELPERS ----------
const formatMessage = (title, content, footer) => `*${title}*\n\n${content}\n\n> *${footer}*`;

const fakevCard = {
    key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
    message: {
        contactMessage: {
            displayName: "© ꜰʟᴀx ᴍᴀʟᴄᴏᴍ",
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Meta\nORG:META AI;\nTEL;type=CELL;type=VOICE;waid=263775597819:+263775597819\nEND:VCARD`
        }
    }
};

// ---------- COMMAND FUNCTIONS ----------
const commands = {

    // ----------------- 1. ALIVE -----------------
    alive: async ({ m, sock, sessionNumber, config }) => {
        try {
            await sock.sendMessage(m.chat, { react: { text: '🔮', key: m.key } });
            const startTime = Date.now(); // simplified uptime
            const uptimeSec = Math.floor((Date.now() - startTime) / 1000);
            const h = Math.floor(uptimeSec / 3600);
            const min = Math.floor((uptimeSec % 3600) / 60);
            const sec = uptimeSec % 60;

            const caption = `
╭═════════════╮
╽⏰ ᴜᴘᴛɪᴍᴇ: ${h}h ${min}m ${sec}s
┃🤖 ɴᴀᴍᴇ: ʙʟᴀᴄᴋᴀɴɢᴇʟ-ᴅɢx
┃📱 ʏᴏᴜʀ ɴᴜᴍʙᴇʀ: ${sessionNumber}
┃🕹️ ᴠᴇʀsɪᴏɴ: ${config.version}
╰═════════════╯
> *🌐 powered by ʙʟᴀᴄᴋᴀɴɢᴇʟ*`;

            await sock.sendMessage(m.chat, {
                image: { url: RCD_IMAGE_PATH },
                caption: `> ᴀᴍ ᴀʟɪᴠᴇ ɴ ᴋɪᴄᴋɪɴɢ 🥳\n\n${caption}`
            }, { quoted: fakevCard });
        } catch (err) {
            console.error('alive error:', err);
            sock.sendMessage(m.chat, { text: '❌ Alive check failed.' }, { quoted: m });
        }
    },

    // ----------------- 2. MENU -----------------
    menu: async ({ m, sock, sessionNumber, config }) => {
        try {
            await sock.sendMessage(m.chat, { react: { text: '🤖', key: m.key } });
            const menuText = `
╭『 🤖 ʙʟᴀᴄᴋᴀɴɢᴇʟ-ᴅɢx 』╮
│ 👤 ᴜsᴇʀ: ${sessionNumber}
│ 🔮 ᴍᴏᴅᴇ: ${config.MODE}
│ 🌐 ᴘʀᴇғɪx: (none)
╰───────
> ᴛʏᴘᴇ ᴀɴʏ ᴄᴏᴍᴍᴀɴᴅ
`;
            await sock.sendMessage(m.chat, {
                image: { url: RCD_IMAGE_PATH },
                caption: menuText,
                buttons: [
                    { buttonId: 'alive', buttonText: { displayText: '🟢 ᴀʟɪᴠᴇ' }, type: 1 },
                    { buttonId: 'menu', buttonText: { displayText: '📋 ᴍᴇɴᴜ' }, type: 1 }
                ]
            }, { quoted: fakevCard });
        } catch (err) {
            console.error('menu error:', err);
            sock.sendMessage(m.chat, { text: '❌ Menu failed.' }, { quoted: m });
        }
    },

    // ----------------- 3. PING -----------------
    ping: async ({ m, sock }) => {
        try {
            const start = Date.now();
            const pingMsg = await sock.sendMessage(m.chat, { text: '📍 Pinging...' }, { quoted: m });
            const latency = Date.now() - start;
            await sock.sendMessage(m.chat, { text: `⚡ ${latency}ms`, edit: pingMsg.key });
        } catch (err) {
            console.error('ping error:', err);
        }
    },

    // ----------------- 4. AI -----------------
    ai: async ({ m, sock, config, args }) => {
        if (!args.length) return sock.sendMessage(m.chat, { text: '❓ Ask me something, babe 😘' }, { quoted: m });
        const prompt = args.join(' ');
        try {
            const res = await axios.get(`https://api.giftedtech.co.ke/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(prompt)}`);
            let response = res.data.result || res.data.response || 'No response';
            await sock.sendMessage(m.chat, { image: { url: RCD_IMAGE_PATH }, caption: response }, { quoted: fakevCard });
        } catch {
            sock.sendMessage(m.chat, { text: '❌ AI failed, try again.' }, { quoted: m });
        }
    },

    // ----------------- 5. SONG -----------------
    song: async ({ m, sock, args }) => {
        const q = args.join(' ') || m.body;
        if (!q) return sock.sendMessage(m.chat, { text: 'Need a song title or YouTube URL.' }, { quoted: m });
        try {
            const search = await yts(q);
            const data = search.videos[0];
            if (!data) return sock.sendMessage(m.chat, { text: 'No results.' }, { quoted: m });
            const desc = `🎵 *${data.title}*\n⏱️ ${data.timestamp}`;
            await sock.sendMessage(m.chat, { image: { url: data.thumbnail }, caption: desc }, { quoted: fakevCard });
            const result = await ddownr.download(data.url, 'mp3');
            if (result.downloadUrl) {
                await sock.sendMessage(m.chat, { audio: { url: result.downloadUrl }, mimetype: 'audio/mpeg', ptt: true }, { quoted: fakevCard });
            } else {
                sock.sendMessage(m.chat, { text: '❌ Download failed.' }, { quoted: m });
            }
        } catch (err) {
            console.error('song error:', err);
            sock.sendMessage(m.chat, { text: '❌ Song download failed.' }, { quoted: m });
        }
    },

    // ----------------- 6. TIKTOK -----------------
    tiktok: async ({ m, sock, args }) => {
        const url = args[0];
        if (!url) return sock.sendMessage(m.chat, { text: 'Usage: tiktok <url>' }, { quoted: m });
        try {
            const res = await axios.get(`https://api.nexoracle.com/downloader/tiktok-nowm?apikey=free_key@maher_apis&url=${encodeURIComponent(url)}`);
            const data = res.data.result;
            if (data && data.url) {
                await sock.sendMessage(m.chat, { video: { url: data.url }, mimetype: 'video/mp4' }, { quoted: fakevCard });
            } else {
                sock.sendMessage(m.chat, { text: '❌ No video found.' }, { quoted: m });
            }
        } catch {
            sock.sendMessage(m.chat, { text: '❌ TikTok download failed.' }, { quoted: m });
        }
    },

    // ----------------- 7. FB -----------------
    fb: async ({ m, sock, args }) => {
        const url = args[0];
        if (!url) return sock.sendMessage(m.chat, { text: 'Usage: fb <url>' }, { quoted: m });
        try {
            const res = await axios.get(`https://suhas-bro-api.vercel.app/download/fbdown?url=${encodeURIComponent(url)}`);
            const result = res.data.result;
            if (result && result.sd) {
                await sock.sendMessage(m.chat, { video: { url: result.sd }, mimetype: 'video/mp4', caption: '> powered by ʙʟᴀᴄᴋᴀɴɢᴇʟ' }, { quoted: fakevCard });
            } else {
                sock.sendMessage(m.chat, { text: '❌ No video found.' }, { quoted: m });
            }
        } catch {
            sock.sendMessage(m.chat, { text: '❌ Facebook download failed.' }, { quoted: m });
        }
    },

    // ----------------- 8. INSTAGRAM -----------------
    ig: async ({ m, sock, args }) => {
        const url = args[0];
        if (!url) return sock.sendMessage(m.chat, { text: 'Usage: ig <url>' }, { quoted: m });
        try {
            const { igdl } = require('ruhend-scraper');
            const res = await igdl(url);
            if (res.data && res.data.length > 0) {
                await sock.sendMessage(m.chat, { video: { url: res.data[0].url }, mimetype: 'video/mp4', caption: '> powered by ʙʟᴀᴄᴋᴀɴɢᴇʟ' }, { quoted: fakevCard });
            } else {
                sock.sendMessage(m.chat, { text: '❌ No video found.' }, { quoted: m });
            }
        } catch {
            sock.sendMessage(m.chat, { text: '❌ Instagram download failed.' }, { quoted: m });
        }
    },

    // ----------------- 9. JOKE -----------------
    joke: async ({ m, sock }) => {
        try {
            const res = await axios.get('https://v2.jokeapi.dev/joke/Any?type=single');
            const joke = res.data.joke;
            sock.sendMessage(m.chat, { text: `🃏 ${joke}` }, { quoted: fakevCard });
        } catch {
            sock.sendMessage(m.chat, { text: '❌ Failed to get joke.' }, { quoted: m });
        }
    },

    // ----------------- 10. FACT -----------------
    fact: async ({ m, sock }) => {
        try {
            const res = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
            const fact = res.data.text;
            sock.sendMessage(m.chat, { text: `💡 ${fact}` }, { quoted: fakevCard });
        } catch {
            sock.sendMessage(m.chat, { text: '❌ Failed to get fact.' }, { quoted: m });
        }
    },

    // ----------------- 11. WEATHER -----------------
    weather: async ({ m, sock, args }) => {
        const city = args.join(' ');
        if (!city) return sock.sendMessage(m.chat, { text: 'Usage: weather <city>' }, { quoted: m });
        try {
            const apiKey = '2d61a72574c11c4f36173b627f8cb177';
            const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
            const res = await axios.get(url);
            const data = res.data;
            const msg = `🌍 ${data.name}, ${data.sys.country}\n🌡 ${data.main.temp}°C`;
            sock.sendMessage(m.chat, { image: { url: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png` }, caption: msg }, { quoted: fakevCard });
        } catch {
            sock.sendMessage(m.chat, { text: '❌ City not found.' }, { quoted: m });
        }
    },

    // ----------------- 12. APK -----------------
    apk: async ({ m, sock, args }) => {
        const app = args.join(' ');
        if (!app) return sock.sendMessage(m.chat, { text: 'Usage: apk <app name>' }, { quoted: m });
        try {
            const apiUrl = `https://api.nexoracle.com/downloader/apk?q=${encodeURIComponent(app)}&apikey=free_key@maher_apis`;
            const res = await axios.get(apiUrl);
            const data = res.data.result;
            if (data && data.dllink) {
                await sock.sendMessage(m.chat, {
                    document: { url: data.dllink },
                    mimetype: 'application/vnd.android.package-archive',
                    fileName: `${data.name}.apk`
                }, { quoted: fakevCard });
            } else {
                sock.sendMessage(m.chat, { text: '❌ APK not found.' }, { quoted: m });
            }
        } catch {
            sock.sendMessage(m.chat, { text: '❌ Failed to fetch APK.' }, { quoted: m });
        }
    },

    // ----------------- 13. SHORTURL -----------------
    shorturl: async ({ m, sock, args }) => {
        const url = args[0];
        if (!url) return sock.sendMessage(m.chat, { text: 'Usage: shorturl <url>' }, { quoted: m });
        try {
            const res = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
            const short = res.data.trim();
            sock.sendMessage(m.chat, { text: `✅ ${short}` }, { quoted: fakevCard });
        } catch {
            sock.sendMessage(m.chat, { text: '❌ Failed to shorten URL.' }, { quoted: m });
        }
    },

    // ----------------- 14. DELETE (QUOTED MESSAGE) -----------------
    delete: async ({ m, sock }) => {
        if (!m.quoted) return sock.sendMessage(m.chat, { text: 'Reply to a message to delete it.' }, { quoted: m });
        try {
            await sock.sendMessage(m.chat, { delete: m.quoted.key });
        } catch {
            sock.sendMessage(m.chat, { text: '❌ Failed to delete.' }, { quoted: m });
        }
    },

    // ----------------- 15. QR -----------------
    qr: async ({ m, sock, args }) => {
        const text = args.join(' ');
        if (!text) return sock.sendMessage(m.chat, { text: 'Usage: qr <text>' }, { quoted: m });
        sock.sendMessage(m.chat, {
            image: { url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}` },
            caption: `QR: ${text}`
        }, { quoted: fakevCard });
    },

    // ----------------- 16. QUOTE -----------------
    quote: async ({ m, sock }) => {
        try {
            const res = await axios.get('https://api.quotable.io/random');
            const data = res.data;
            sock.sendMessage(m.chat, { text: `💭 "${data.content}" — ${data.author}` }, { quoted: fakevCard });
        } catch {
            sock.sendMessage(m.chat, { text: '❌ Failed to get quote.' }, { quoted: m });
        }
    },

    // ----------------- 17. WHOIS -----------------
    whois: async ({ m, sock, args }) => {
        const domain = args[0];
        if (!domain) return sock.sendMessage(m.chat, { text: 'Usage: whois <domain>' }, { quoted: m });
        try {
            const res = await axios.get(`http://api.whois.vu/?whois=${encodeURIComponent(domain)}`);
            const data = res.data;
            if (data.domain) {
                const msg = `🔍 *${data.domain}*\n📅 Registered: ${data.created_date || 'N/A'}\n⏰ Expires: ${data.expiry_date || 'N/A'}`;
                sock.sendMessage(m.chat, { text: msg }, { quoted: fakevCard });
            } else {
                sock.sendMessage(m.chat, { text: '❌ Domain not found.' }, { quoted: m });
            }
        } catch {
            sock.sendMessage(m.chat, { text: '❌ Whois failed.' }, { quoted: m });
        }
    },

    // ----------------- 18. REPO -----------------
    repo: async ({ m, sock }) => {
        const repoUrl = 'https://github.com/FlaxMalcom/-FLAX-MD';
        const msg = `🚀 ꜰʟᴀx-ᴍᴅ ʀᴇᴘᴏ\n🌐 ${repoUrl}`;
        sock.sendMessage(m.chat, { image: { url: RCD_IMAGE_PATH }, caption: msg }, { quoted: fakevCard });
    },

    // ----------------- 19. TICTACTOE (simplified) -----------------
    tictactoe: async ({ m, sock }) => {
        // Game logic omitted for brevity; can keep original if needed.
        sock.sendMessage(m.chat, { text: '🎮 Tic Tac Toe not yet implemented in plugin.' }, { quoted: m });
    },

    // ----------------- 20. OTHER ALIAS COMMANDS -----------------
    // These will be mapped via aliases
    help: async ({ m, sock }) => {
        sock.sendMessage(m.chat, { text: 'Use "menu" for commands list.' }, { quoted: m });
    },
    owner: async ({ m, sock }) => {
        const num = MAIN_OWNER;
        sock.sendMessage(m.chat, { text: `👑 Owner: +${num}` }, { quoted: fakevCard });
    },
    wame: async ({ m, sock, args }) => {
        const num = args[0] || m.sender.split('@')[0];
        const link = `https://wa.me/${num.replace(/[^0-9]/g, '')}`;
        sock.sendMessage(m.chat, { text: `🔗 ${link}` }, { quoted: fakevCard });
    },
    setprefix: async ({ m, sock }) => sock.sendMessage(m.chat, { text: 'Use zero prefix now 😎' }, { quoted: m }),
    setmode: async ({ m, sock }) => sock.sendMessage(m.chat, { text: 'All commands are public.' }, { quoted: m }),
};

// ---------- ALIASES ----------
const aliases = {
    ttt: 'tictactoe',
    xo: 'tictactoe',
    'repo-visit': 'repo',
    'repo-owner': 'repo',
    'allmenu': 'menu',
    'help': 'menu',
    'sc': 'repo',
    'script': 'repo',
    'del': 'delete',
    'qrcode': 'qr',
    'speak': 'tts_missing',  // tts not included here but can be added
    'setprefix': 'setprefix',
    'setmode': 'setmode',
    'ping': 'ping',
    'song2': 'song',
    'video': 'song', // temporarily map video to song for simplicity
    'fb': 'fb',
    'facebook': 'fb',
    'ig2': 'ig',
    'joke': 'joke',
    'fact': 'fact',
    'weather': 'weather',
    'apk': 'apk',
    'shorturl': 'shorturl',
    'delete': 'delete',
    'quote': 'quote',
    'whois': 'whois',
    'owner': 'owner',
    'wame': 'wame',
    'ai': 'ai',
    'tiktok': 'tiktok',
    'menu': 'menu',
    'alive': 'alive',
    'ping': 'ping'
};

module.exports = { commands, aliases };
