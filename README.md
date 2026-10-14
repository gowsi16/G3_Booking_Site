# 🚛 G3 Transport — Modern Freight & Booking Management System

<div align="center">

![G3 Transport Logo](frontend/public/logo.png)

### **Salem's Trusted Goods Transport & Fleet Dispatch Platform**
*Fast, Transparent, and Secure Intercity Goods Transport across Tamil Nadu & Bengaluru*

[![React 19](https://img.shields.io/badge/React-19.2.7-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.1.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.2.1-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite3](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JWT 2FA](https://img.shields.io/badge/Security-Gmail_OTP_2FA-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](https://jwt.io/)

---

[Explore Features](#-key-features) •
[Fleet Specifications](#-fleet-specifications) •
[Admin 2FA Security](#-admin-two-factor-authentication-2fa) •
[Quickstart Guide](#-getting-started) •
[API Reference](#-api-endpoints) •
[Contact](#-contact--support)

</div>

---

## 📖 Overview

**G3 Transport** is a full-stack logistics and transport management system built specifically for Salem-based regional and interstate freight operations. It replaces manual telephone dispatching with an automated web booking workflow, real-time highway distance calculations, transparent weight-tiered pricing, and secure fleet scheduling.

The platform provides two portals:
1. **Customer Web Portal:** Client registration, live quotation generator, helper crew selection, consignor/consignee address capture, and real-time shipment status tracking.
2. **Authorized Dispatch Portal (Admin):** Two-factor authentication (Email OTP), vehicle overlap conflict prevention, load capacity validation, pricing controls, driver dispatch, and complete audit trail logging.

---

## 🌟 Key Features

### 👤 1. Customer Authentication & Booking Management
- **Strict Customer Login Gate:** Requires verified customer authentication before accessing or submitting a transport booking.
- **Client Registration:** Fast onboarding with mobile number, business name, and default address.
- **Dynamic Live Fare Estimator:** Real-time road distance matrix between major commercial hubs (Salem, Chennai, Coimbatore, Madurai, Trichy, Bengaluru, Erode, Tiruppur, etc.).
- **Helper Crew Selection:** Transparent loading helper pricing at strictly **₹800 per helper**.
- **Consignment Details:** Captures pickup address, destination delivery address, load category (Sugarcane, Jaggery, Machinery, Textiles, Agricultural Produce, etc.), and special handling instructions.

### 📦 2. Real-Time Consignment Tracking
- **Booking ID Search:** Track consignment status anytime using booking references (e.g., `BK202600001`).
- **Interactive Visual Timeline:** 
  - `Booked & Pending Review` $\rightarrow$ `Confirmed & Vehicle Assigned` $\rightarrow$ `In Transit (On Highway)` $\rightarrow$ `Completed & Delivered`
- **Driver & Vehicle Details:** Real-time display of assigned lorry registration number, vehicle payload capacity, and driver contact info.

### 🔐 3. Admin Two-Factor Authentication (Email OTP 2FA)
- **Two-Step Verification:** Master credentials verification triggers a cryptographically secure 6-digit OTP sent via **Nodemailer + Gmail SMTP**.
- **Time-Limited Security:** OTP codes expire after **5 minutes** (with a live countdown clock).
- **Brute-Force Protection:** Maximum of **5 incorrect attempts** allowed before session invalidation.
- **Resend Cooldown:** Integrated **60-second cooldown timer** on the resend button to prevent mail server abuse.
- **Hashed Memory Storage:** Plaintext OTPs are never stored; only cryptographic SHA-256 hashes are verified in memory.
- **Signed Admin JWT:** Successful OTP verification grants a secure 8-hour Admin JSON Web Token (`role: 'admin'`).

### 🚚 4. Fleet Dispatch & Smart Scheduling Constraints
- **Schedule Overlap Prevention (HTTP 409):** Automated conflict engine prevents assigning the same vehicle to multiple active bookings on the same date.
- **Safe Payload Capacity Enforcement (HTTP 400):** System calculates consignment weight (converting Tons to kg) and blocks assignment if load exceeds the lorry's safe payload limit.
- **Live Dispatch Controls:** Instant status updates, one-click cancellation with reason logging, and driver status toggling.
- **Audit Trail:** Immutable logging of all admin assignments, fare overrides, status transitions, and pricing updates.

---

## 🚛 Fleet Specifications

| Vehicle Registration | Lorry Type | Safe Payload Capacity | Default Assigned Driver | Primary Commercial Route |
| :--- | :--- | :--- | :--- | :--- |
| **TN 77AY 3006** | Heavy Cargo Lorry (6-Wheeler) | **8,000 kg (8.0 Tons)** | **Senthil** | Salem $\leftrightarrow$ Chennai / Bengaluru |
| **TN28 BF 1256** | Medium Freight Lorry | **3,500 kg (3.5 Tons)** | **Chithiraj** | Salem $\leftrightarrow$ Coimbatore / Madurai / Erode |

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19 (Hooks, Context API)
- **Build Tool:** Vite 8 (Ultra-fast HMR and bundle optimization)
- **Styling:** Vanilla CSS + Modern Tailwind CSS v4 (Glassmorphism, custom micro-interactions)
- **Typography:** *Space Grotesk* (Display/Headings) + *IBM Plex Sans* (Body/Data)
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (v18+)
- **Web Server:** Express.js 5
- **Authentication:** JSON Web Tokens (JWT) + Cryptographic SHA-256 OTP sessions
- **Email Service:** Nodemailer with Gmail SMTP (Google App Password)
- **Database:** SQLite3 (`backend/g3transport.db`) + PostgreSQL schema ready for production

---

## 📁 Repository Structure

```
G3-BookingSite/
├── backend/
│   ├── .env.example              # Template configuration for environment secrets
│   ├── database.js               # SQLite database connection & schema bootstrapping
│   ├── emailService.js           # Nodemailer Gmail SMTP OTP service & HTML template
│   ├── package.json              # Backend dependencies (express, nodemailer, jwt, sqlite3)
│   ├── pricingConfig.js          # Tiered transport pricing rules & helper cost engine
│   ├── server.js                 # Express API server, routes & JWT middleware
│   ├── test_suite.js             # Automated test suite (100% test coverage)
│   └── postgres/                 # PostgreSQL migration scripts & schema dumps
├── frontend/
│   ├── public/                   # Static assets (logo.png, favicon)
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Client authentication context (localStorage session)
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Hero section, feature overview & instant quote
│   │   │   ├── Booking.jsx       # Multi-step customer booking wizard
│   │   │   ├── Tracking.jsx      # Live consignment tracking timeline
│   │   │   ├── Login.jsx         # Customer sign-in & registration
│   │   │   ├── AdminLogin.jsx    # Admin 2-step credentials & 6-digit OTP verification
│   │   │   ├── AdminDashboard.jsx# Dispatch operations, fleet schedules, pricing & audit
│   │   │   └── About.jsx         # Company background, fleet specs & contact info
│   │   ├── App.jsx               # Navigation, routing, and layout shell
│   │   ├── index.css             # TailwindCSS & custom aesthetic tokens
│   │   └── main.jsx              # React DOM entry point
│   ├── package.json              # Frontend dependencies (React 19, Vite, Tailwind v4)
│   └── vite.config.js            # Vite configuration
├── Screenshots/                  # UI design and feature walkthrough captures
├── .gitignore                    # Prevents credentials (.env) and databases from being pushed
└── README.md                     # Comprehensive project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [Git](https://git-scm.com/)
- A Google Account with an **App Password** for sending OTP emails

---

### 2. Clone the Repository
```bash
git clone https://github.com/gowsi16/G3_Booking_Site.git
cd G3_Booking_Site
```

---

### 3. Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   npm install
   ```

2. Create your environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Open `backend/.env` and configure your credentials:
   ```env
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key_here

   # Admin Login Credentials
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_secure_admin_password
   ADMIN_EMAIL=your_admin_gmail@gmail.com

   # Gmail SMTP Configuration (Google App Password)
   GMAIL_USER=your_admin_gmail@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```
   > **How to create a Google App Password:**
   > 1. Visit [Google Security Settings](https://myaccount.google.com/security).
   > 2. Ensure **2-Step Verification** is turned ON.
   > 3. Navigate to [App Passwords](https://myaccount.google.com/apppasswords).
   > 4. Create an app named `G3 Transport` and copy the 16-character code into `GMAIL_APP_PASSWORD`.

4. Start the backend server:
   ```bash
   node server.js
   ```
   *The API server will listen on `http://localhost:5000` and automatically initialize `g3transport.db`.*

---

### 4. Frontend Setup

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will be live at `http://localhost:5173`.*

---

## 🧪 Automated Testing

G3 Transport includes an end-to-end automated test suite verifying all critical business and security rules:

```bash
cd backend
node test_suite.js
```

### Verified Test Suites:
- ✅ **Weight Normalization:** Accurate conversion of string/Tons/kg (`1 Ton = 1000 kg`).
- ✅ **Weight Tier Differentiation:** Validates that 500 kg and 7.0 Tons receive distinct, accurate tier rates.
- ✅ **Helper Pricing Constraint:** Strictly ₹800 per helper ($helpers \times 800$).
- ✅ **Customer Auth Protection:** Blocks unauthenticated requests from booking a lorry (HTTP 401).
- ✅ **Admin Email OTP Flow:** Credential verification, email dispatch via Nodemailer, 5-minute expiry, and attempt counting.
- ✅ **JWT Token Security:** Rejects unauthenticated requests to `/api/admin/*` (HTTP 401).
- ✅ **Vehicle Schedule Overlap Prevention:** Rejects double-booking the same lorry on identical dates (HTTP 409).
- ✅ **Safe Payload Constraint:** Blocks loads exceeding vehicle payload limits (HTTP 400).

---

## 📡 API Endpoints

### Public & Customer Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/status` | Health check & database connection | No |
| `GET` | `/api/pricing-rules` | Active pricing configuration & weight tiers | No |
| `POST` | `/api/calculate-price` | Computes road fare based on distance & weight | No |
| `POST` | `/api/auth/register` | Register a new customer account | No |
| `POST` | `/api/auth/login` | Authenticate customer with phone & password | No |
| `POST` | `/api/bookings` | Submit a new transport consignment booking | **Customer Session** |
| `GET` | `/api/bookings/:id` | Live tracking status for a booking ID | No |

### Protected Admin Endpoints
*Requires header: `Authorization: Bearer <ADMIN_JWT_TOKEN>`*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/admin/auth/login` | Verifies admin credentials and sends 6-digit email OTP |
| `POST` | `/api/admin/auth/verify-otp` | Verifies OTP, checks expiry/attempts, and issues JWT |
| `POST` | `/api/admin/auth/resend-otp` | Resends OTP with 60-second cooldown |
| `GET` | `/api/admin/overview` | Summary KPI metrics (revenue, active trips, pending bookings) |
| `GET` | `/api/admin/bookings` | Filterable list of all customer consignment bookings |
| `PUT` | `/api/bookings/:id/assign` | Assigns vehicle & driver with conflict & capacity checks |
| `PUT` | `/api/bookings/:id/status` | Updates trip status (`In Transit`, `Completed`, `Cancelled`) |
| `GET` | `/api/admin/vehicles` | Registry of all fleet lorries and status |
| `GET` | `/api/admin/pricing` | Retrieves live pricing and helper cost rules |
| `PUT` | `/api/admin/pricing` | Updates base rate, per-km rate, helper fees, and weight surcharges |
| `GET` | `/api/admin/audit-logs` | Immutable audit trail of dispatch and administrative actions |

---

## 🔒 Security Best Practices

1. **Zero Credential Exposure:** `.env` files are excluded from Git via `.gitignore`.
2. **Hashed Secrets:** Passwords and OTP codes are protected with cryptographic salt hashing (`scryptSync` / `SHA-256`).
3. **Session Replay Prevention:** OTP sessions are immediately purged from memory upon first successful verification.
4. **Backend-First Validation:** Critical business rules (fares, capacity, overlaps) are calculated and enforced strictly on the server, not trusted from client payloads.

---

## 📞 Contact & Support

**G3 Transport**  
📍 **Office:** 3/93, Kalaignar Street, Vellalagundam, Vazhapady Taluk, Salem – 636111, Tamil Nadu  
📞 **Phone:** `+91 9488289991` &bull; `+91 9080942982`  
✉️ **Email:** `gthreetransport@gmail.com` &bull; `gowsilan16@gmail.com`  

---

<div align="center">
  <sub>&copy; 2026 G3 Transport. All rights reserved. Developed with modern full-stack web standards.</sub>
</div>
