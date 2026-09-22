# HACKTOBER 2026 — Full-Stack Event Management Platform

Official web portal and administrative management system for **HACKTOBER 2026** (3–5 October 2026), organized by the **Department of Computer Science and Engineering, IoT and Cybersecurity including Blockchain Technology** under the **Cyber Samurai Association** at **Guru Nanak Dev Engineering College, Bidar**.

![Hacktober 2026 Logo](/public/logo-circle.png)

> **Motto**: *ज्ञानं रक्षति सर्वदः • Knowledge Protects Always*

---

## 🚀 Key Features

### 1. Public Event Portal
* **High-Contrast Academic Light Theme**: Crisp `#FFFFFF` canvas, surface slate `#F8FAFC`, institutional navy `#1E3A5F`, and cybersecurity teal `#0D9488`.
* **Ambient Cybersecurity Theme**: 48px precision grid with micro-crosshairs, vector circuit traces, telemetry watermarks (`CIPHER: AES-256-GCM`, `PROTOCOL: TLS_1.3`), and soft radial glows.
* **Mokoto Typography**: Futuristic cyberpunk stencil display font (`font-mokoto`) applied to brand headings.
* **Live Countdown Ticker**: Targeted to 3 October 2026, 09:00 AM IST.
* **5 Signature Competitions**:
  1. *Cybersecurity Quiz* (Individual, Max 1)
  2. *Cyber Debate* (Individual, Max 1)
  3. *Mini Hackathon* (Team, Max 4 members)
  4. *Cyber Hunt* (Team, Max 4 members)
  5. *Technical Debugging* (Individual, Max 1)
* **Surprise Prize Announcement**: Clean banner informing participants that prize pools will be revealed during opening ceremonies.

### 2. Multi-Step Registration Wizard (`/register`)
* **Dynamic Pricing Engine**:
  * 1 Event: **₹79** (Confirmed)
  * 3 Events: **₹199** (Confirmed)
  * 5 Events: **₹350** (Confirmed)
  * 2 or 4 Events: **TBD** — dynamically blocks payment submission with an official organizer confirmation notice.
* **Team Roster Management**: Conditional step for *Mini Hackathon* & *Cyber Hunt*. Supports 1 team leader + up to 3 members (maximum 4) with client/server duplicate USN/email protection.
* **Payment Proof Submission**: Displays college UPI ID & QR code. Requires 12-digit UTR/transaction ID and screenshot upload (<5MB, JPG/PNG/WEBP).
* **Printable Participant Accreditation Pass (`/register/confirmation/[id]`)**: Generates non-sequential `HT26-XXXXXX` registration ID and safe HMAC QR code.

### 3. Non-Sequential IDs & Cryptographic QR Codes
* **Format**: `HT26-` followed by 6 cryptographically random alphanumeric characters (e.g., `HT26-W4GTD6`).
* **HMAC-SHA256 Safe QR Token**: QR codes encode `HT26-XXXXXX-<hmac>` instead of raw candidate PII.
* **Public QR Verification (`/verify?token=...`)**: Confirms pass authenticity, college, events, and payment clearance without leaking phone/email.

### 4. Role-Based Admin Operations (`/admin`)
* **RBAC Hierarchy**: `SUPER_ADMIN` > `ADMIN` > `VIEWER`.
* **Live Analytics Dashboard (`/admin/dashboard`)**: 8 real-time metric cards (0 on empty DB, no fake mocks) + event distribution breakdown.
* **Registration Management (`/admin/registrations`)**: Search, multi-filtering, sorting, pagination, detail drawer, and soft-delete/restore.
* **Payment Verification Queue (`/admin/payments`)**: Side-by-side receipt image viewer, UTR verification, approve/reject workflow.
* **Live QR Attendance Scanner (`/admin/attendance`)**: Camera QR scanner (`html5-qrcode`) + manual lookup with duplicate check-in detection.
* **Filter-Aware Data Exports (`/admin/exports`)**: Instant CSV and multi-sheet Excel (`.xlsx`) downloads.
* **Audit Logging & Organizer Management (`/admin/audit-logs` & `/admin/organizers`)**: Immutable audit trail and Super Admin user provisioning.

---

## 🛠️ Technology Stack

* **Framework**: Next.js 16 (App Router, Turbopack, React 19)
* **Styling**: Tailwind CSS v4, Vanilla CSS Design System, Custom SVG Circuit Backgrounds
* **Typography**: Mokoto Display Font, Geist Sans, Geist Mono
* **Authentication**: Stateless HS256 JWT, HttpOnly Cookies (`ht26_admin_token`), Bcrypt password hashing
* **Database Layer**: Dual-mode repository with local JSON fallback (`.data/db.json`) and MongoDB Atlas cloud support
* **QR Codes**: `qrcode` (HMAC-SHA256 signed generation) + `html5-qrcode` (webcam scanning)
* **Data Processing**: `xlsx` (Excel exports), `zod` (runtime schema validation), `sharp` (image processing)

---

## 🏁 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Bennyhinn007/Hacktober2026.git
cd Hacktober2026
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your secrets:
```env
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
QR_SECRET_KEY=your_hmac_secret_key_for_qr_codes
DEFAULT_ADMIN_EMAIL=admin@gndec.ac.in
DEFAULT_ADMIN_PASSWORD=Admin@Hacktober2026
# Optional: connect MongoDB Atlas
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hacktober2026
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Super Admin Credentials

* **URL**: `http://localhost:3000/admin/login`
* **Email**: `admin@gndec.ac.in`
* **Password**: `Admin@Hacktober2026`
* **Role**: `SUPER_ADMIN`

---

## 🧪 Test Suites

### Unit & Business Rules Suite
```bash
npx tsx tests/critical-flows.ts
```
> **31/31 tests passing (100%)**: Dynamic pricing, team limits, duplicate protection, non-sequential IDs, HMAC tokens, payment lifecycle, RBAC, and export queries.

### Full-Stack Live HTTP E2E Suite
```bash
npx tsx tests/e2e-http.ts
```
> **8/8 live HTTP suites passing (100%)**: Public routes, admin authentication, live analytics, registration submission, QR verification pass, payment approval, attendance check-in, and CSV/XLSX exports.

---

## 🌐 Production Deployment (Vercel + MongoDB Atlas)

1. Push this repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Under **Project Settings -> Environment Variables**, configure:
   * `JWT_SECRET`
   * `QR_SECRET_KEY`
   * `DEFAULT_ADMIN_EMAIL`
   * `DEFAULT_ADMIN_PASSWORD`
   * `MONGODB_URI` (from a free [MongoDB Atlas M0 cluster](https://mongodb.com/atlas))
4. Deploy! Next.js will automatically build and host the platform with global SSL.

---

## 🏛️ Institutional Accreditation

* **Institution**: Guru Nanak Dev Engineering College, Mailoor Road, Bidar, Karnataka - 585402
* **Department**: Department of Computer Science and Engineering (IoT and Cybersecurity Including Blockchain Technology)
* **Association**: Cyber Samurai Association
* **Event Dates**: 3–5 October 2026
