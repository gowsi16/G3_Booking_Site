# 🚚 G3 Transport — Frontend Web Application

<div align="center">

### **Client Web Portal & Operations Dispatch Interface**
*Built with React 19, Vite 8, Tailwind CSS v4, Lucide Icons & React Router 7*

[![React 19](https://img.shields.io/badge/React-19.2.7-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.1.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![React Router](https://img.shields.io/badge/React_Router-7.18-CA4245?style=flat-square&logo=react-router&logoColor=white)](https://reactrouter.com/)

</div>

---

## 📖 Overview

The **G3 Transport Frontend** is a single-page application (SPA) providing an interface for both transport customers and company dispatch managers. It features real-time quotation calculators, multi-step booking workflows, live consignment tracking, and a two-factor authenticated admin operations dashboard.

---

## 🎨 Design System & Aesthetics

- **Typography:**
  - **Display / Brand:** `'Space Grotesk', sans-serif` (Headings, badges, monetary values, vehicle identifiers)
  - **Body / Interface:** `'IBM Plex Sans', sans-serif` (Form controls, descriptions, tabular records)
- **Visual Style:**
  - Glassmorphic panels (`glass-panel`) with subtle backdrop blur.
  - Curated slate and amber color palette matching regional logistics branding.
  - Responsive micro-animations (`animate-slide-up`, smooth button transitions).
  - Clear visual feedback on all user interactions (loaders, error banners, success alerts).

---

## 📱 Page & Route Directory

| Route | Component | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/` | `Home.jsx` | Public | Hero showcase, instant rate calculator, fleet overview, customer reviews, and quick links. |
| `/book` | `Booking.jsx` | **Customer Only** | 3-Step transport booking wizard (Route & Weight $\rightarrow$ Address Details $\rightarrow$ Review & Submit). |
| `/track` | `Tracking.jsx` | Public | Live consignment tracking by Booking ID with animated status progression. |
| `/login` | `Login.jsx` | Public | Customer authentication & new client registration tabs. |
| `/admin` | `AdminLogin.jsx` | Restricted | Two-step administrator login (Credentials $\rightarrow$ 6-digit email OTP verification). |
| `/admin/dashboard` | `AdminDashboard.jsx` | **Admin JWT** | Operations center: booking assignment, fleet schedules, driver toggles, pricing rules, and audit trail. |
| `/about` | `About.jsx` | Public | Company history, vehicle fleet specifications, contact coordinates, and office map. |

---

## 🔐 Client Authentication Architecture

### 1. Customer Authentication (`AuthContext.jsx`)
- Customer session is managed via React Context and persisted in `localStorage`.
- Unauthenticated visitors attempting to access `/book` are greeted by a friendly, gated login screen that redirects back to `/book` upon successful authentication.

### 2. Admin Two-Factor Authentication (`AdminLogin.jsx` & `AdminDashboard.jsx`)
- **Step 1:** Username & master password submission.
- **Step 2:** 6-digit OTP verification screen with countdown clock (5 minutes) and resend cooldown (60 seconds).
- **Session Token:** Verified admin token is securely stored in `sessionStorage` (`g3_admin_token`).
- **Route Guard:** `AdminDashboard` checks the token on mount and immediately redirects unauthorized visitors to `/admin`.
- **API Interceptor:** All operational requests attach `Authorization: Bearer <token>`, with automatic redirect to `/admin` upon receiving HTTP 401.

---

## 🚀 Development Setup

### Prerequisites
- Node.js v18 or higher
- Running backend server at `http://localhost:5000`

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Locally in Development Mode
```bash
npm run dev
```
The application will launch with Vite Hot Module Replacement (HMR) at:
**[http://localhost:5173](http://localhost:5173)**

### 3. Production Build
```bash
npm run build
```
Generates a minified, production-ready bundle in the `dist/` folder.

### 4. Preview Production Bundle Locally
```bash
npm run preview
```

---

## 📂 Source Code Structure

```
frontend/
├── public/
│   ├── logo.png              # G3 Transport official brand logo
│   └── favicon.ico
├── src/
│   ├── context/
│   │   └── AuthContext.jsx   # Global customer auth state provider & hooks
│   ├── pages/
│   │   ├── Home.jsx          # Landing page with instant pricing calculator
│   │   ├── Booking.jsx       # Consignment booking wizard
│   │   ├── Tracking.jsx      # Shipment tracking timeline
│   │   ├── Login.jsx         # Customer login & register form
│   │   ├── AdminLogin.jsx    # 2FA Admin login with 6-digit OTP
│   │   ├── AdminDashboard.jsx# Dispatch & fleet operations management
│   │   └── About.jsx         # Company background & fleet specifications
│   ├── App.jsx               # Main router, navigation bar & footer
│   ├── index.css             # Tailwind v4 import & custom CSS utilities
│   └── main.jsx              # Application bootstrap
├── package.json
└── vite.config.js
```

---

## 📞 Support & Inquiries

For technical assistance or frontend customization requests:  
- **Email:** `gthreetransport@gmail.com`  
- **Phone:** `+91 9488289991`  
- **Address:** 3/93, Kalaignar Street, Vellalagundam, Salem – 636111
