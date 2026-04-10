# SkillSwap AI — Agentic Build Prompt
## First 10 Features | MERN Stack | Professional Grade

---

## 🎯 PROJECT OVERVIEW

Build **SkillSwap AI** — a campus-focused peer-to-peer skill barter web application where university students exchange skills using a **time-credit wallet** (no money involved). Users offer skills, declare needs, get algorithmically matched, and complete exchanges earning/spending time credits.

**Tech Stack:** MongoDB + Express.js + React.js (Vite) + Node.js  
**Styling:** Tailwind CSS (dark mode from day 1)  
**State Management:** Redux Toolkit + React Query (TanStack Query v5)  
**Auth:** JWT (access token 15min) + HttpOnly refresh token (7 days)  
**Real-time:** Socket.io (scaffolded, fully wired in later sprints)  
**File Storage:** Cloudinary  
**Email:** Nodemailer + SendGrid  
**Job Queue:** Bull + Redis  
**Database:** MongoDB Atlas (replica set — required for transactions)

---

## 📁 PROFESSIONAL FILE STRUCTURE

```
skillswap-ai/
├── client/                          # React Frontend (Vite)
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api/                     # Axios instance + API call functions
│   │   │   ├── axiosInstance.js     # Base axios with interceptors
│   │   │   ├── authApi.js
│   │   │   ├── profileApi.js
│   │   │   ├── skillsApi.js
│   │   │   ├── matchApi.js
│   │   │   └── walletApi.js
│   │   ├── assets/
│   │   │   ├── fonts/
│   │   │   └── images/
│   │   ├── components/
│   │   │   ├── common/              # Shared UI components
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Avatar.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── SkeletonLoader.jsx
│   │   │   │   ├── Toast.jsx
│   │   │   │   └── ProgressBar.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── PageWrapper.jsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   └── EmailVerifyBanner.jsx
│   │   │   ├── profile/
│   │   │   │   ├── ProfileCard.jsx
│   │   │   │   ├── ProfileWizard.jsx
│   │   │   │   ├── AvatarUpload.jsx
│   │   │   │   └── ProfileCompleteness.jsx
│   │   │   ├── skills/
│   │   │   │   ├── SkillOfferForm.jsx
│   │   │   │   ├── SkillNeedForm.jsx
│   │   │   │   ├── SkillCard.jsx
│   │   │   │   ├── SkillBadge.jsx
│   │   │   │   └── SkillTabs.jsx
│   │   │   ├── availability/
│   │   │   │   ├── WeeklyCalendarGrid.jsx
│   │   │   │   └── TimeSlotPicker.jsx
│   │   │   ├── discovery/
│   │   │   │   ├── SearchBar.jsx
│   │   │   │   ├── FilterSidebar.jsx
│   │   │   │   └── SkillDiscoveryCard.jsx
│   │   │   ├── wallet/
│   │   │   │   ├── WalletBadge.jsx
│   │   │   │   └── TransactionItem.jsx
│   │   │   └── notifications/
│   │   │       ├── NotificationBell.jsx
│   │   │       └── NotificationItem.jsx
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useProfile.js
│   │   │   ├── useSkills.js
│   │   │   ├── useDebounce.js
│   │   │   └── useSocket.js
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   ├── VerifyEmailPage.jsx
│   │   │   │   └── ForgotPasswordPage.jsx
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.jsx
│   │   │   ├── profile/
│   │   │   │   ├── MyProfilePage.jsx
│   │   │   │   └── PublicProfilePage.jsx
│   │   │   ├── skills/
│   │   │   │   └── MySkillsPage.jsx
│   │   │   ├── availability/
│   │   │   │   └── AvailabilityPage.jsx
│   │   │   ├── discovery/
│   │   │   │   └── DiscoveryPage.jsx
│   │   │   ├── wallet/
│   │   │   │   └── WalletPage.jsx
│   │   │   └── notifications/
│   │   │       └── NotificationsPage.jsx
│   │   ├── routes/
│   │   │   ├── AppRouter.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── PublicOnlyRoute.jsx
│   │   ├── store/                   # Redux Toolkit
│   │   │   ├── index.js
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── profileSlice.js
│   │   │   │   └── notificationSlice.js
│   │   │   └── middleware/
│   │   │       └── socketMiddleware.js
│   │   ├── utils/
│   │   │   ├── validators.js
│   │   │   ├── formatters.js
│   │   │   ├── constants.js
│   │   │   └── tokenUtils.js
│   │   ├── styles/
│   │   │   ├── index.css            # Tailwind directives + CSS variables
│   │   │   └── animations.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                          # Express Backend
│   ├── config/
│   │   ├── db.js                    # MongoDB Atlas connection
│   │   ├── redis.js                 # ioredis client
│   │   ├── cloudinary.js
│   │   ├── mailer.js                # Nodemailer + SendGrid
│   │   └── env.js                   # Validated env vars (Joi/Zod)
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── profile.controller.js
│   │   ├── skill.controller.js
│   │   ├── availability.controller.js
│   │   ├── discovery.controller.js
│   │   ├── wallet.controller.js
│   │   └── notification.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT verify + attach req.user
│   │   ├── verified.middleware.js   # isVerified gate
│   │   ├── roles.middleware.js      # role-based access
│   │   ├── rateLimit.middleware.js  # express-rate-limit configs
│   │   ├── validate.middleware.js   # Zod schema validation
│   │   ├── upload.middleware.js     # Multer config
│   │   └── errorHandler.middleware.js
│   ├── models/
│   │   ├── User.model.js
│   │   ├── SkillOffer.model.js
│   │   ├── SkillNeed.model.js
│   │   ├── SkillTaxonomy.model.js
│   │   ├── Availability.model.js
│   │   ├── Notification.model.js
│   │   └── TransactionLedger.model.js
│   ├── routes/
│   │   ├── index.js                 # Route aggregator
│   │   ├── auth.routes.js
│   │   ├── profile.routes.js
│   │   ├── skill.routes.js
│   │   ├── availability.routes.js
│   │   ├── discovery.routes.js
│   │   ├── wallet.routes.js
│   │   └── notification.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── email.service.js
│   │   ├── skill.service.js
│   │   ├── notification.service.js
│   │   └── wallet.service.js
│   ├── queues/
│   │   ├── emailQueue.js
│   │   └── notificationQueue.js
│   ├── socket/
│   │   ├── index.js                 # Socket.io server setup
│   │   └── handlers/
│   │       └── notificationHandler.js
│   ├── utils/
│   │   ├── ApiError.js              # Custom error class
│   │   ├── ApiResponse.js           # Standard response wrapper
│   │   ├── asyncHandler.js          # Try-catch wrapper
│   │   ├── skillNormalizer.js
│   │   └── tokenGenerator.js
│   ├── validators/                  # Zod schemas
│   │   ├── auth.validator.js
│   │   ├── profile.validator.js
│   │   └── skill.validator.js
│   ├── app.js                       # Express app setup
│   ├── server.js                    # HTTP + Socket.io server entry
│   └── package.json
│
├── .env.example
├── .gitignore
├── docker-compose.yml               # MongoDB + Redis local dev
└── README.md
```

---

## 🔐 ENVIRONMENT VARIABLES (.env.example)

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas (MUST be replica set for transactions)
MONGO_URI=mongodb+srv://...

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your_access_secret_min_64_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_64_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@skillswap.ai

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Frontend URL (for email links)
CLIENT_URL=http://localhost:5173
```

---

## 📋 THE 10 FEATURES TO BUILD

### FEATURE 1 — Email Verification (F1) `[CRITICAL]`

**Backend:**
- `POST /api/auth/register` — accepts `{ name, email, university, password }`
  - Hash password with bcrypt (saltRounds: 12)
  - Generate token: `crypto.randomBytes(32).toString('hex')`
  - Store **hashed** token in DB with TTL (24h using MongoDB TTL index on `tokenExpiresAt`)
  - Queue email via Bull job (do NOT send inline — async via `emailQueue`)
  - Return `201` with message only — no JWT yet (account unverified)
- `GET /api/auth/verify-email?token=xxx` — verifies token hash match, sets `user.isVerified = true`, deletes token
- `POST /api/auth/resend-verification` — rate limited: max 3/hour per email
- `POST /api/auth/login` — returns JWT access token + sets HttpOnly refresh token cookie. **Block login if `!isVerified`** with a clear error message pointing to resend endpoint.
- `POST /api/auth/refresh` — reads HttpOnly cookie, issues new access token
- `POST /api/auth/logout` — clears HttpOnly cookie
- `POST /api/auth/forgot-password` — sends reset link (same token pattern, 1h TTL)
- `POST /api/auth/reset-password` — validates token, updates password

**Frontend:**
- `/register` page — multi-field form with real-time Zod validation
- After register: redirect to `/verify-email-sent` page (show email address, resend button with 60s cooldown UI)
- `/verify-email?token=xxx` page — auto-triggers verification on mount, shows success/error state
- `/login` page — email + password, show "Email not verified" banner with resend link if blocked
- `/forgot-password` and `/reset-password/:token` pages
- Store JWT access token in memory (Redux state), NOT localStorage
- Axios interceptor: on 401, auto-call refresh endpoint, retry original request

**Security requirements:**
- Passwords: bcrypt saltRounds 12
- Tokens: always store SHA256 hash, compare hash
- Rate limit registration: 5 per IP per hour
- Rate limit login: 10 per IP per 15 minutes

---

### FEATURE 2 — User Profile Management (F2) `[HIGH]`

**Backend:**
- `GET /api/profile/me` — returns authenticated user's full profile
- `PUT /api/profile/me` — update bio, university, department, contactPreference
- `POST /api/profile/avatar` — Multer → stream to Cloudinary → store `cloudinaryPublicId`
- `GET /api/profile/:userId` — public profile view (limited fields)
- Profile completeness score computed server-side: `(filledFields / totalFields) * 100`
- Fields tracked: name, bio, university, department, avatar, availability, minOneSkillOffer, minOneSkillNeed

**User Model** (`User.model.js`):
```js
{
  name, email, password (hashed), university, department,
  bio, avatar { cloudinaryPublicId, url }, contactPreference,
  isVerified, role: ['student','moderator','admin'],
  trustScore: { default: 50 },
  currentBalance: { default: 5 },  // starter credits
  profileCompleteness: Number,
  createdAt, updatedAt
}
```

**Frontend:**
- First-login **Profile Wizard** (3 steps):
  - Step 1: Basic info (name, university, department)
  - Step 2: Avatar upload with crop preview
  - Step 3: Bio + contact preference
- Profile completeness progress bar (always visible on dashboard)
- Warn user if completeness < 60%: "Your profile needs more detail to appear in match results"
- Public profile view page `/profile/:userId`

---

### FEATURE 3 — Availability Schedule Manager (F3) `[HIGH]`

**Backend:**
- Store as array: `[{ dayOfWeek: 0-6, startMinute: 0-1439, endMinute: 0-1439 }]` in user document
- `PUT /api/availability` — replace entire availability schedule
- `GET /api/availability/me` — get own schedule
- Store user's `timezone` (IANA string, e.g., `Asia/Dhaka`) — convert to UTC before storing
- Compute and store a `availabilityBitfield` (10080-bit representation) for match engine O(1) overlap comparison

**Frontend:**
- Visual **weekly grid** (7 columns × 24 rows) — click/drag to select time blocks
- Each cell = 1 hour (can be refined to 30min)
- "Copy to all weekdays" shortcut button
- Timezone selector (default: auto-detect from browser `Intl.DateTimeFormat().resolvedOptions().timeZone`)
- Show total available hours per week summary
- Color: selected slots in brand accent color, hover state clearly visible

---

### FEATURE 4 — Skill Offer Management (F4) `[HIGH]`

**Backend:**
- `POST /api/skills/offer` — create skill offer
- `GET /api/skills/offer/me` — list own offers
- `PUT /api/skills/offer/:id` — update
- `DELETE /api/skills/offer/:id` — soft delete (set `isActive: false`)
- `GET /api/skills/taxonomy` — return all skill categories + names for autocomplete

**SkillOffer Model:**
```js
{
  userId, skillName (normalized), skillTaxonomyId (ref),
  category, proficiencyLevel: { 1: Beginner, 2: Intermediate, 3: Expert },
  description, isActive, endorsementCount,
  portfolioItems: [{ type, url, cloudinaryId, caption }],
  createdAt
}
```

**Skill Taxonomy Model** (seed on startup):
```js
{ canonicalName, aliases: [], category, slug }
```
Seed with at least 50 skills across categories: Programming, Design, Music, Languages, Math/Science, Video/Media, Writing, Business.

**Normalization**: On save, run `skillNormalizer.js` — lowercase, trim, map alias → canonical name.

**Frontend:**
- "My Skills" page with two tabs: **Offering** / **Seeking**
- Offering tab: list of current offer cards + "Add Skill" button
- Add Skill form:
  - Skill name with **autocomplete** dropdown (debounced 300ms, backed by taxonomy API)
  - Category (auto-filled from taxonomy)
  - Proficiency level (3-step selector: Beginner / Intermediate / Expert with visual indicator)
  - Description textarea
- Max 10 offered skills per user (show count badge)
- Each skill card: name, category badge, proficiency pill, endorsement count, edit/delete actions

---

### FEATURE 5 — Skill Need Management (F5) `[HIGH]`

**Backend:**
- `POST /api/skills/need` — create skill need
- `GET /api/skills/need/me`
- `PUT /api/skills/need/:id`
- `DELETE /api/skills/need/:id` (soft delete)

**SkillNeed Model:**
```js
{
  userId, skillName (normalized), skillTaxonomyId (ref),
  category, urgency: { 1: Low, 2: Medium, 3: High },
  description, isActive, createdAt
}
```

**Frontend:**
- "Seeking" tab on "My Skills" page (same page as F4, different tab)
- Same autocomplete + category as offers
- Urgency selector instead of proficiency: Low / Medium / High (color coded: gray / yellow / red)
- Max 10 needed skills per user
- Build F4 + F5 in a unified `MySkillsPage.jsx` — they share `SkillForm` component

---

### FEATURE 6 — Skill Discovery & Search (F7) `[HIGH]`

**Backend:**
- `GET /api/discovery/skills?q=&category=&level=&page=` 
- Use **MongoDB Atlas Search** (Lucene) for full-text — configure search index on `skillName` + `description`
- Pipeline: `$search` → `$match` (filters) → `$lookup` (user profile) → `$sort` → cursor-based pagination
- Facet counts: return `{ results, facets: { categories: [{name, count}], levels: [{name, count}] }, nextCursor }`
- Add compound indexes: `skillName (text), category, proficiencyLevel, isActive`

**Frontend:**
- `/discover` page — full-width search experience
- Sticky search bar at top with debounced input (300ms)
- Left sidebar: filter panel (category checkboxes, proficiency level, minimum rating)
- Facet counts shown next to each filter option: "Python (14)"
- Main area: skill cards grid (3 col desktop, 2 col tablet, 1 col mobile)
- **SkillDiscoveryCard** shows: avatar, name, university, skill name, proficiency badge, trust score badge, "Send Request" CTA
- Skeleton loaders on search (not spinner — skeleton matches card shape)
- Infinite scroll — load next page when user reaches 80% of page bottom
- Empty state: illustration + "No skills found for '[query]' — try a different search"

---

### FEATURE 7 — Time-Credit Wallet Dashboard (F14 + F15) `[HIGH]`

**Backend:**
- On verified registration: auto-credit 5 starter credits via `wallet.service.js` — write to `TransactionLedger`
- `GET /api/wallet/me` — returns `{ currentBalance, recentTransactions (last 10), monthlyStats }`
- `GET /api/wallet/transactions?cursor=&limit=20` — paginated transaction history
- `GET /api/wallet/transactions/export` — CSV export (streams response)

**TransactionLedger Model** (IMMUTABLE — no `updatedAt`, no DELETE/UPDATE allowed at app layer):
```js
{
  userId, type: enum['exchange_credit','exchange_debit','gift_sent','gift_received','starter_bonus'],
  amount, counterpartyId, exchangeId (optional), note, createdAt
}
// Index: { userId: 1, createdAt: -1 }
```

**Frontend:**
- Wallet page `/wallet`:
  - **Hero section**: Large credit balance display (animated number on first load)
  - Monthly summary: "You earned X | You spent Y this month"
  - Bar chart (Recharts): credits earned vs spent per month (last 6 months)
  - Transaction list: each item shows type icon, description, counterparty, amount (+/-), date
  - "Export CSV" button
- Wallet badge in **Navbar**: coin icon + current balance — always visible
- If balance = 0: show yellow warning banner "You have 0 credits. Complete exchanges to earn more."

---

### FEATURE 8 — In-App Notification System (F19) `[CRITICAL]`

**Backend:**
- Socket.io server: on connect, user joins private room `user:${userId}`
- `Notification` Model:
  ```js
  {
    userId, type: enum['new_match','exchange_request','message','exchange_complete','review_reminder','dispute'],
    payload: {}, read: false, createdAt
  }
  // Index: { userId: 1, createdAt: -1, read: 1 }
  ```
- `GET /api/notifications?limit=20&cursor=` — paginated
- `PUT /api/notifications/read-all` — mark all as read
- `PUT /api/notifications/:id/read` — mark single as read
- Email fallback: if notification not read within 2 hours, Bull job sends email digest
- `notificationService.send(userId, type, payload)` — unified function used by all features: persists to DB + emits via Socket.io

**Frontend:**
- **NotificationBell** in navbar: bell icon + unread count badge (red dot if > 0)
- Click opens dropdown panel: last 20 notifications
- Each notification: icon (type-specific), description text, relative time ("2 minutes ago"), unread dot
- "Mark all read" button
- On reconnect: fetch latest from DB and merge with socket events
- Notification **types with icons**: 🔔 match, 📨 request, 💬 message, ✅ complete, ⭐ review, ⚠️ dispute

---

### FEATURE 9 — Exchange Request System (F11) `[HIGH]`

**Backend:**
- `POST /api/exchanges/request` — create exchange request
  - Validate: skills belong to correct users, no existing pending request between same pair
  - Rate limit: max 5 pending outgoing requests per user
  - Notify receiver via `notificationService`
- `GET /api/exchanges/requests/incoming` — pending requests received
- `GET /api/exchanges/requests/outgoing` — pending requests sent
- `PUT /api/exchanges/requests/:id/accept` — accept (creates Exchange document, status: 'scheduled')
- `PUT /api/exchanges/requests/:id/decline` — decline with optional reason
- Auto-expire pending requests after 7 days (Bull cron job)

**ExchangeRequest Model:**
```js
{
  requesterId, receiverId,
  offeredSkillId, requestedSkillId,
  proposedTime: Date, message,
  status: enum['pending','accepted','declined','expired','counter'],
  declineReason, parentRequestId, negotiationRound: { default: 0, max: 3 },
  createdAt, expiresAt
}
```

**Frontend:**
- "Send Request" button on discovery card opens modal:
  - Shows: "You offer [X] ↔ They offer [Y]" skill swap preview
  - Proposed time picker (datetime-local, constrained to both users' availability)
  - Optional message textarea (max 300 chars)
- **Incoming requests** section in dashboard: card with Accept (green) / Decline (red) / Counter (blue) buttons
- Outgoing requests tab: show status pill for each

---

### FEATURE 10 — Exchange Accept/Decline Flow (F12) `[HIGH]`

**Backend:**
- On Accept: transition request → 'accepted', create Exchange document (`status: 'scheduled'`), notify requester, create conversation (scaffold for F20 Chat)
- On Decline: transition → 'declined', store reason, notify
- On Counter: create new ExchangeRequest linked via `parentRequestId`, increment `negotiationRound` (reject if >= 3)

**Exchange Model:**
```js
{
  requesterId, receiverId,
  offeredSkillId, requestedSkillId,
  scheduledTime: Date, conversationId,
  status: enum['scheduled','in_progress','awaiting_completion','completed','disputed'],
  requesterConfirmed: false, receiverConfirmed: false,
  disputeDeadline, completedAt, createdAt
}
```

**Frontend:**
- Accept triggers: success toast + conversation thread opens (scaffolded, chat UI in later sprint)
- Counter-proposal: opens time picker modal showing BOTH users' available slots side by side
- Decline: optional reason dropdown (pre-set options: "Schedule conflict", "Skill mismatch", "Not interested", "Other")
- My Exchanges page `/exchanges`: tabs for Scheduled / Pending / Completed / Disputed

---

## 🎨 UI/UX DESIGN SYSTEM

### Visual Identity
**Theme:** Dark-first, refined dark mode as default. Campus-tech aesthetic — sharp, professional, modern without being cold.

**Color Palette (CSS Variables):**
```css
:root {
  --color-bg-primary: #0d0f14;
  --color-bg-secondary: #141720;
  --color-bg-card: #1a1e2b;
  --color-bg-elevated: #1f2435;
  --color-border: #2a2f40;
  --color-border-subtle: #1e2230;
  
  --color-brand: #6c8eff;        /* Electric blue — primary actions */
  --color-brand-hover: #8aa0ff;
  --color-brand-dim: rgba(108,142,255,0.15);
  
  --color-accent: #00d4aa;       /* Teal — success, credits earned */
  --color-accent-dim: rgba(0,212,170,0.15);
  
  --color-warning: #ffb830;      /* Amber — medium urgency, alerts */
  --color-danger: #ff4d6d;       /* Red — decline, errors, high urgency */
  --color-success: #22c77a;      /* Green — accept, verified */
  
  --color-text-primary: #e8eaf0;
  --color-text-secondary: #9197a8;
  --color-text-muted: #5c6275;
  
  /* Trust score gradient */
  --trust-low: #ff4d6d;
  --trust-mid: #ffb830;
  --trust-high: #22c77a;
}
```

**Typography:**
```
Display / Headings: "Clash Display" or "Cabinet Grotesk" (from Fontshare — free)
Body: "Satoshi" (from Fontshare — free)
Monospace (credits, numbers): "JetBrains Mono" (Google Fonts)
```

**Component Standards:**
- **Cards:** `bg-[var(--color-bg-card)]` with `border border-[var(--color-border)]`, `rounded-xl`, subtle `shadow-lg`
- **Buttons:** Primary = brand blue with glow on hover; Ghost = transparent with border; Danger = red
- **Inputs:** Dark background, focus ring in brand blue, error state in red, helper text below
- **Badges:** Proficiency (Beginner: gray, Intermediate: blue, Expert: purple), Trust (color from CSS var by score range)
- **Hover states:** `transition-all duration-200` on all interactive elements
- **Focus states:** `focus:ring-2 focus:ring-[var(--color-brand)] focus:outline-none`

**Layout:**
- Navbar: fixed top, height 64px, glassmorphism `backdrop-blur-md bg-[var(--color-bg-primary)]/80`
- Sidebar (dashboard): 240px fixed left, collapses to icon-only on mobile
- Main content: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Card grids: CSS Grid, responsive (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)

**Animations:**
```css
/* Page entry animation */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-enter { animation: fadeSlideUp 0.3s ease-out; }

/* Stagger children */
.stagger-children > * { animation: fadeSlideUp 0.3s ease-out both; }
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 60ms; }
.stagger-children > *:nth-child(3) { animation-delay: 120ms; }
/* ...etc */

/* Skeleton pulse */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## 🔒 API RESPONSE STANDARD

All API responses must follow this format:

```js
// ApiResponse.js
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

// Usage:
res.status(200).json(new ApiResponse(200, { user }, "Profile fetched successfully"));
```

```js
// ApiError.js
class ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    if (stack) this.stack = stack;
    else Error.captureStackTrace(this, this.constructor);
  }
}
```

---

## 🗃️ DATABASE INDEXES (apply in db.js on startup)

```js
// Critical indexes for performance
User: email (unique), trustScore (-1)
SkillOffer: userId, skillTaxonomyId, category, proficiencyLevel, isActive
SkillNeed: userId, skillTaxonomyId, category
ExchangeRequest: requesterId, receiverId, status, createdAt
Notification: { userId, createdAt: -1, read }
TransactionLedger: { userId, createdAt: -1 }
```

---

## ✅ ACCEPTANCE CRITERIA CHECKLIST

Before marking any feature complete, verify:

**Auth (F1):**
- [ ] Register sends verification email within 5 seconds
- [ ] Unverified users cannot access protected routes (returns 403)
- [ ] Tokens expire and resend is rate-limited
- [ ] Password reset works end-to-end
- [ ] Refresh token rotates on use

**Profile (F2):**
- [ ] Avatar uploads to Cloudinary, stores public_id not URL
- [ ] Profile completeness % updates on every save
- [ ] Public profile shows limited fields only

**Availability (F3):**
- [ ] Times stored in UTC
- [ ] Bitfield computed correctly for 10080 minutes/week
- [ ] Copy-to-weekdays works

**Skills (F4+F5):**
- [ ] Skill name normalization prevents duplicates (Python vs python)
- [ ] Autocomplete returns taxonomy results, not free text
- [ ] Max 10 skills enforced per type

**Discovery (F7):**
- [ ] Atlas Search returns relevant results with typo tolerance
- [ ] Filters narrow results correctly
- [ ] Cursor pagination works without duplicates
- [ ] Skeleton loaders appear before data

**Wallet (F14+F15):**
- [ ] 5 starter credits auto-credited on verification
- [ ] Ledger records are immutable (no update/delete endpoints exist)
- [ ] CSV export downloads correctly

**Notifications (F19):**
- [ ] Socket.io room joins on login, leaves on logout
- [ ] Notifications persist to DB and load on reconnect
- [ ] Unread count updates in real time
- [ ] Email fallback queued after 2h unread

**Exchanges (F11+F12):**
- [ ] Cannot create duplicate pending request for same pair
- [ ] Rate limit of 5 outgoing pending requests enforced
- [ ] Counter-proposal capped at 3 rounds
- [ ] All state transitions emit notifications

