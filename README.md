<br>
<p align="center">
  <img src="[https://files.catbox.moe/9gn6lm.jpg](https://i.ibb.co/fG2rYZyP/RD323736333531383931303040732e77686174736170702e6e6574-596866.jpg)" width="150" height="150" style="border-radius:50%; border:3px solid #d4af37; box-shadow:0 0 30px #d4af37;" />
</p>

<h1 align="center">BLACKANGEL-DGX</h1>
<h3 align="center">ιѕ αℓρнα</h3>

<p align="center">
  The most refined zero‑prefix WhatsApp mini bot.<br>
  Pair once, stay Alpha forever.
</p>

<p align="center">
  <a href="https://whatsapp.com/channel/0029Vb7tTMb9mrGWo7uroI3e">
    <img src="https://img.shields.io/badge/Channel-Join%20Now-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Channel" />
  </a>
  <a href="https://github.com/BlackAngelTech/BlackAngelSourceCode">
    <img src="https://img.shields.io/github/stars/BlackAngelTech/BlackAngelSourceCode?style=for-the-badge&logo=github&color=d4af37" alt="Stars" />
  </a>
  <img src="https://img.shields.io/badge/version-2.0.0-d4af37?style=for-the-badge" alt="Version" />
</p>

<br>

---

## 🖤 What is BlackAngel-DGX?

BlackAngel-DGX is a **zero‑prefix WhatsApp automation bot** built on the latest **Baileys v6+**.  
No command prefixes. No nonsense. Just type your command and the Angel obeys.

- **Zero‑prefix** – `menu`, `alive`, `song Believer` … just type.
- **Auto‑second‑owner** – the number you connect becomes the bot’s master.  
- **Alpha notification** – the main owner (`+263776404156`) always knows who connected.  
- **Hot‑reload** – add new features to `BlackAngel.js` without restarting.  
- **Session store** – all credentials live in `./BlackAngel/` (auto‑created).

<br>

---

## ⚡ Core Commands

| Category        | Commands                                                                     |
|-----------------|------------------------------------------------------------------------------|
| General         | `menu`, `alive`, `ping`, `help`                                             |
| Media Download  | `song`, `video`, `tiktok`, `fb`, `ig`, `apk`                                |
| AI & Fun        | `ai`, `joke`, `fact`, `quote`, `weather`                                    |
| Utilities       | `shorturl`, `qr`, `whois`, `delete`, `owner`, `wame`                       |
| Group (soon)    | `add`, `kick`, `promote`, `demote`, `tagall`, `join`                       |

Type `menu` to see everything live.

<br>

---

## 🚀 One‑Click Deploy

### Render (Recommended)
Render provides a **persistent disk** – your `BlackAngel/` session folder survives restarts, so you only need to pair once.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/BlackAngelTech/BlackAngelSourceCode)

After clicking the button:
1. Sign in to Render (or create a free account).
2. Give your service a name (e.g., `blackangel-dgx`).
3. The **Start Command** should be set to `npm start`.
4. Under **Advanced → Add Persistent Disk**:
   - Mount Path: `/opt/render/project/src/BlackAngel`
   - Size: 1 GB (the minimum is fine)
5. Click **Apply** and **Create Web Service**.

Your bot will be live in a few minutes at `https://<service-name>.onrender.com`.  
Open that URL, pair your number, and you’re Alpha.

### Heroku
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/BlackAngelTech/BlackAngelSourceCode)

> **Note for Vercel:**  
> Because `BlackAngel-DGX` uses a local file‑based authentication store (`./BlackAngel/`), it is **not fully compatible with Vercel’s serverless, read‑only filesystem**.  
> Use Render or Heroku for the best experience.

---

## 🛠️ Local Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/BlackAngelTech/BlackAngelSourceCode.git
   cd BlackAngelSourceCode
