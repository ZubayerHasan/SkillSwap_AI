# ![SkillSwap AI Logo](client/public/favicon.svg) SkillSwap AI

**Exchange Skills. No Money Needed.**

A campus skill-barter platform where students trade expertise using time credits — teach what you know, learn what you need.

![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

[🌐 Live Demo](https://skillswap-ai-project.vercel.app)

---

## 📸 Screenshots

#### GROUP 1 — Public pages (landing + auth)

<table>
<tr>
<td width="45%">
<img src="screenshots/landing-dark.png" alt="Landing page (dark mode) - hero section with Exchange Skills headline and Get Started CTA buttons" />
<br /><strong>Landing page (dark)</strong>
</td>
<td width="10%"></td>
<td width="45%">
<img src="screenshots/login-dark.png" alt="Login page (dark mode) - centered card with email and password fields" />
<br /><strong>Login page (dark)</strong>
</td>
</tr>
</table>

#### GROUP 2 — Core app pages

<table>
<tr>
<td width="45%">
<img src="screenshots/dashboard.png" alt="Main Dashboard (light mode) - Welcome greeting with stat cards for Credits, Profile completion, Requests, and Trust Score" />
<br /><strong>Dashboard overview</strong>
</td>
<td width="10%"></td>
<td width="45%">
<img src="screenshots/discover.png" alt="Discover page (light mode) - skill card grid with category and level filters in left sidebar, full-text search" />
<br /><strong>Skill discovery with filters</strong>
</td>
</tr>
</table>

#### GROUP 3 — Matching and skills

<table>
<tr>
<td width="45%">
<img src="screenshots/matches.png" alt="Smart Match Dashboard (light mode) - match cards showing match score percentage, fit bar, Skill/Reciprocity/Availability/Quality sub-score breakdown chips" />
<br /><strong>Smart Match Dashboard</strong>
</td>
<td width="10%"></td>
<td width="45%">
<img src="screenshots/skills.png" alt="My Skills page (light mode) - Offering and Seeking tabs with skill cards showing name, category, level, description, and endorsement count" />
<br /><strong>My Skills management</strong>
</td>
</tr>
</table>

#### GROUP 4 — Exchange economy

<table>
<tr>
<td width="45%">
<img src="screenshots/exchanges.png" alt="Exchanges page (light mode) - My Exchanges tab with Upcoming/Awaiting/Completed filters, showing skill swap cards with You teach/You learn layout and Mark Complete button" />
<br /><strong>Exchanges with Mark Complete</strong>
</td>
<td width="10%"></td>
<td width="45%">
<img src="screenshots/wallet.png" alt="Wallet page (light mode) - current balance, earned/spent stats for the month, Credits History bar chart with 6-month data, Transaction History list, Send Credits and Export CSV buttons" />
<br /><strong>Time-credit Wallet</strong>
</td>
</tr>
</table>

#### GROUP 5 — Communication and scheduling

<table>
<tr>
<td width="45%">
<img src="screenshots/chat.png" alt="Real-time Chat page (light mode) - split panel with conversations list on the left, active chat on the right, showing Find people button, Attach option, and live message bubbles" />
<br /><strong>Real-time Chat</strong>
</td>
<td width="10%"></td>
<td width="45%">
<img src="screenshots/availability.png" alt="Availability Schedule page (light mode) - full weekly drag-select calendar grid with 30-minute time blocks, timezone selector (Asia/Dhaka), Copy Mon to Tue-Fri shortcut, Save Schedule button" />
<br /><strong>Weekly Availability Schedule</strong>
</td>
</tr>
</table>

---

## ✨ Features

### 🔐 Authentication & Profiles
- Email verification with secure time-limited links
- JWT access tokens (15 min) + HttpOnly refresh tokens (7 days)
- Password reset via email
- Profile with bio, avatar, university, and availability schedule
- Profile completeness score (0–100%)
- Dark mode / Light mode toggle

### 🎯 Smart Matching Engine
- Weighted multi-factor algorithm: Mutual Reciprocity (40%), Skill Level Compatibility (25%), Trust Score (20%), Availability Overlap (15%)
- Pre-computed and cached match results (Redis, 6h TTL)
- Match score breakdown per candidate (Skill / Reciprocity / Availability / Quality chips)
- Skill discovery with full-text search, category, level, and trust score filters

### 🔄 Exchange Economy
- Exchange request → counter-proposal → accept/decline flow
- Dual-confirmation completion: credits transfer only after both parties confirm
- Atomic credit transfer via MongoDB multi-document transactions
- Immutable transaction ledger (no updates/deletes ever)
- 5 starter credits on signup
- Credit gifting/tipping between users
- CSV export of transaction history
- 48-hour dispute window after exchange completion

### 💬 Communication & Trust
- Real-time Socket.io chat (exchange partners only)
- Read receipts and message timestamps
- File attachments in chat
- In-app + email notifications for all platform events
- Trust Score (0–100) per user, computed from rating average, completion rate, response time, endorsements, and account age
- Post-exchange star ratings, reviews, and skill endorsements
- Drag-select weekly availability calendar with timezone support

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, Redux Toolkit, React Query |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (replica set for transactions) |
| Cache & Queues | Redis, Bull |
| Real-time | Socket.io |
| File Storage | Cloudinary |
| Auth | JWT (access + refresh), Email OTP via Nodemailer |
| Deployment | Vercel (client) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas cluster (replica set — required for transactions)
- Redis instance
- Cloudinary account
- SMTP credentials (Brevo/Sendinblue recommended)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/skillswap-ai.git
cd skillswap-ai

# 2. Configure environment variables
cp .env.example server/.env
# Open server/.env and fill in all required values

# 3. Install server dependencies
cd server
npm install

# 4. Seed the skill taxonomy (required for matching to work)
npm run seed

# 5. Start the backend server
npm run dev
# → http://localhost:5000
# → Health check: http://localhost:5000/health

# 6. In a new terminal, install and start the client
cd ../client
npm install
npm run dev
# → http://localhost:5173
```

### (Optional) Run with Docker
```bash
# Starts Redis and MongoDB locally
docker-compose up -d
```

### (Optional) Promote a user to Admin
```bash
cd server
node scripts/makeAdmin.js --email="your@email.com"
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `server/.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string (replica set) |
| `REDIS_URL` | ✅ | Redis connection URL |
| `JWT_ACCESS_SECRET` | ✅ | JWT signing secret (≥32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret (≥32 chars) |
| `SMTP_HOST` | ✅ | SMTP hostname (e.g. smtp-relay.brevo.com) |
| `SMTP_USER` | ✅ | SMTP username |
| `SMTP_PASS` | ✅ | SMTP password |
| `EMAIL_FROM` | ✅ | Sender email address |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `CLIENT_URL` | No | Frontend URL for CORS (default: localhost:5173) |

---

## 👥 Contributors

| Student ID | Name |
|------------|------|
| 22201826 | Md. Zubayer Hasan |
| 23101516 | Araf Hasan |
| 23101095 | Mariya Binta Mazhar |
| 22201484 | Sabah Maryam |
| 22299368 | Anik Rahman |

---

## 📄 License

Built as an academic project at BRAC University, 2026.
