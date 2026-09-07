<div align="center">

# MakeLyft

**Enterprise & Corporate Carpooling Platform**

_A modern, intelligent, and secure ride-sharing ecosystem designed for corporate campuses and organizations to streamline daily employee commutes, reduce transportation costs, and minimize carbon footprints._

---

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.x-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Ollama](https://img.shields.io/badge/Ollama-gemma2:2b-black?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.ai/)

</div>

---

## Overview

**MakeLyft** is an enterprise-grade carpooling application engineered to solve intra-organization commuting friction. Unlike public ride-hailing services, MakeLyft connects verified colleagues traveling along intersecting commute routes within an enterprise network.

The platform provides:

- **Zero-trust employee verification** to ensure complete safety and trust.
- **Dynamic spatial matching** using Haversine radial distance and route-corridor intersection algorithms.
- **Real-time collaboration tools** including live vehicle GPS simulation, WebRTC voice communication, and in-ride chat.
- **Internal wallet transactions** for transparent, cashless cost-sharing governed by enterprise fuel policies.
- **An on-premise AI travel assistant** for commute optimization and itinerary advice.

---

## Key Features

### Corporate-Verified Profiles & Roles

- Employee onboarding gated by corporate email OTP verification, employee ID, and designated organization affiliation.
- Role-based permissions across standard **Employees**, verified **Drivers**, and **System Administrators**.

### Driver & Vehicle Onboarding Workflow

- Transparent driver verification process: submission of Driving License (DL), Insurance policy, vehicle model, and seating capacity.
- Administrative review lifecycle (`Unregistered` $\rightarrow$ `Pending Review` $\rightarrow$ `Approved`).

### Intelligent Route & Proximity Discovery

- **Proximity Filter**: Instant dynamic detection of available carpools within a 10 km radius of the passenger's current GPS location.
- **Route Interception ("On My Route")**: Matches passenger pickup and drop-off points against published driver corridors within a 3 km tolerance window.
- Integrated Leaflet / OpenStreetMap mapping with customized route polyline rendering and distinct pickup/drop-off pins.

### Live Booking & Secure Boarding Handshake

- Real-time booking requests sent directly to the driver via Socket.io.
- Driver accept/decline controls with immediate passenger notifications.
- **Cryptographic OTP Handshake**: A 4-digit boarding code generated per booking that the driver must verify before trip commencement.

### Real-Time GPS Tracking & Trip Telemetry

- Driver and passenger live location updates synchronized over persistent Socket.io rooms (`ride_{id}`).
- Visual tracking states for both pickup approach and journey-to-destination phases.

### MakeLyft In-App Wallet System

- Cashless, seamless cost-sharing: fares are calculated according to organization fuel and travel cost coefficients (`org_settings`).
- Automated fare transfer from passenger wallet to driver wallet upon verified trip completion.

### In-Ride Communication & Calling

- **Encrypted In-App Chat**: Live messaging room scoped per active ride with input sanitization.
- **WebRTC Voice Calling**: Driver-passenger peer-to-peer signaling for quick audio contact without exchanging private telephone numbers.

### Local AI Travel Assistant

- Built-in AI trip companion powered locally via [Ollama](https://ollama.com/) running `gemma2:2b`.
- Provides concise, technical commute planning, travel time estimations, and itinerary recommendations without cloud API reliance.

### Enterprise Administration Portal

- Dedicated admin control center to oversee organization fuel pricing per kilometer, review and approve vehicle applications, monitor active rides, and inspect platform analytics.

### Dual-Sided Reputation System

- Independent tracking and aggregation of both `passenger_rating` and `driving_rating` to foster a secure, courteous corporate community.

---

## System Architecture

```
                                  +---------------------------------------+
                                  |         MakeLyft Web Client           |
                                  |    (React 19 + Tailwind CSS v4)       |
                                  +---------------------------------------+
                                         |                         |
                           REST APIs     |                         | WebSocket / WebRTC
                        (Axios / HTTP)   |                         | (Socket.io Client)
                                         v                         v
+------------------+             +---------------------------------------+
|  Ollama Service  | <--(HTTP)-- |          MakeLyft API Gateway         |
|  (gemma2:2b)     |             |       (Express 5 + Node.js HTTP)      |
+------------------+             +---------------------------------------+
                                         |                    |
                                 pg Pool |                    | Nodemailer (SMTP)
                                         v                    v
                                 +---------------+    +--------------------+
                                 |  PostgreSQL   |    | Corporate Email    |
                                 |  Relational   |    | OTP Verification   |
                                 |   Database    |    +--------------------+
                                 +---------------+
```

---

## Tech Stack

### Frontend

- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Mapping & Geodata**: [Leaflet](https://leafletjs.com/) & [React-Leaflet v5](https://react-leaflet.js.org/) with OpenStreetMap tiles
- **Icons**: [Lucide React](https://lucide.dev/)
- **Real-Time Client**: [Socket.io-Client v4](https://socket.io/)

### Backend

- **Runtime**: [Node.js](https://nodejs.org/)
- **Web Framework**: [Express 5](https://expressjs.com/)
- **Real-Time Engine**: [Socket.io v4](https://socket.io/) (Rooms, Tracking, Signaling)
- **Database Driver**: [node-postgres (`pg`)](https://node-postgres.com/)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcrypt` password hashing
- **Security & Utilities**: `express-rate-limit`, `dompurify` + `jsdom` input sanitization, `cors`
- **Mail Service**: [Nodemailer](https://nodemailer.com/) (OTP dispatch)
- **AI Integration**: [Ollama SDK](https://github.com/ollama/ollama-js) (`gemma2:2b`)

### Database

- **Database Engine**: [PostgreSQL](https://www.postgresql.org/) with JSONB geospatial coordinate support

---

## Project Directory Structure

```plaintext
MakeLyft/
├── Carpooling Platform (1).pdf       # Architectural documentation & project report
├── README.md                         # Project documentation
└── MakeLyft/
    ├── backend/                      # Express.js REST API & Socket.io server
    │   ├── database/
    │   │   ├── init.sql              # Database DDL schema
    │   │   ├── run-init.js           # Automated schema initializer
    │   │   └── seed.js               # Comprehensive demo seed data
    │   ├── handlers/
    │   │   ├── GPS_CalcHandler.js    # Haversine distance & spatial calculations
    │   │   ├── middlewareHandler.js  # JWT validation, rate limiters, error handling
    │   │   └── ...
    │   ├── routes/
    │   │   ├── admin.js              # Admin management endpoints
    │   │   ├── auth.js               # Registration, Login, OTP verification
    │   │   ├── bookRide.js           # Booking creation & status lifecycle
    │   │   ├── chat.js               # Ride-level chat endpoints
    │   │   ├── getAiAnswer.js        # Ollama AI Assistant integration
    │   │   ├── publishRide.js        # Driver ride creation & scheduling
    │   │   ├── rides.js              # Ride discovery & GPS distance filtering
    │   │   ├── registerVehicle.js    # Vehicle registration submission
    │   │   ├── wallet.js             # Wallet balance & transactions
    │   │   └── ...
    │   ├── src/
    │   │   └── main.js               # Express application entrypoint & Socket.io server
    │   ├── utils/                    # Data sanitization and helper routines
    │   └── package.json
    │
    └── react-frontend/               # React client application (Vite)
        ├── src/
        │   ├── assets/               # Brand assets and graphics
        │   ├── components/
        │   │   ├── AuthPage.jsx      # Login, Registration & OTP screens
        │   │   ├── Dashboard.jsx     # Primary split-view map & controls dashboard
        │   │   ├── AdminDashboard.jsx# Organization management console
        │   │   ├── SplashScreen.jsx  # Animated entry screen
        │   │   └── Dashboard/        # Specialized ride modals and panels:
        │   │       ├── ActiveTripPanel.jsx
        │   │       ├── BrowseRidesPanel.jsx
        │   │       ├── ChatModal.jsx
        │   │       ├── FeedbackModal.jsx
        │   │       ├── HistoryModal.jsx
        │   │       ├── PublishRideModal.jsx
        │   │       ├── VehicleRegistrationModal.jsx
        │   │       ├── VoiceCallModal.jsx
        │   │       └── WalletModal.jsx
        │   ├── App.jsx               # Top-level application router
        │   ├── main.jsx              # DOM mount point
        │   └── index.css             # Design tokens & global stylesheet
        ├── vite.config.js
        └── package.json
```

---

## 🗄 Database Schema

The core domain model is structured in PostgreSQL as follows:

| Table              | Primary Key  | Description                                                                                |
| ------------------ | ------------ | ------------------------------------------------------------------------------------------ |
| **`users`**        | `emp_id`     | Corporate user profile with role, organization, contact info, ratings, and vehicle status. |
| **`vehicles`**     | `veh_id`     | Driver vehicle metadata, license numbers (`dl_no`, `insurance_no`), capacity, and model.   |
| **`rides`**        | `ride_id`    | Scheduled trips with JSONB origin/destination coordinates, pricing, status, and polyline.  |
| **`bookings`**     | `booking_id` | Passenger reservations containing pickup/drop JSONB coordinates, OTP, and payment status.  |
| **`wallets`**      | `wallet_id`  | Internal user credits tied to `emp_id` for cashless ride settlements.                      |
| **`org_settings`** | `id`         | Enterprise rules defining standard fuel cost per km and maximum rides permitted per day.   |

---

## Prerequisites

Before running MakeLyft locally, ensure you have the following installed:

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: `v14.0` or higher (running locally or accessible via URI)
- **Ollama** _(optional, for AI features)_: Installed with the `gemma2:2b` model pulled

---

## Environment Configuration

Create a `.env` file in `MakeLyft/MakeLyft/backend/.env`:

```env
# Server Port
PORT=3000

# PostgreSQL Connection String
# Format: postgresql://<username>:<password>@<host>:<port>/<database>
DB_URI=postgresql://postgres:postgres@localhost:5432/makelyft

# JWT Authentication Secret
JWT_SECRET=your_super_secret_jwt_key_here

# SMTP Configuration (for employee OTP verification)
EMAIL_USER=your_corporate_email@example.com
EMAIL_PASS=your_email_app_password

# Ollama Host (defaults to http://127.0.0.1:11434 if not specified)
OLLAMA_HOST=http://127.0.0.1:11434
```

---

## Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/devxbhabani/makelyft.git
cd makelyft/MakeLyft
```

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install
```

### 3. Database Initialization & Seeding

Ensure PostgreSQL is running and a database named `makelyft` (or your chosen DB name in `DB_URI`) exists:

```bash
# In PostgreSQL CLI or GUI:
# CREATE DATABASE makelyft;

# Run the schema initialization script
node database/run-init.js

# (Optional) Populate demo corporate data, users, and rides
node database/seed.js
```

Start the backend development server:

```bash
npm start
# Server will start on http://localhost:3000
```

### 4. Frontend Setup

In a new terminal window:

```bash
# Navigate to the frontend directory
cd MakeLyft/react-frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
# Vite will launch on http://localhost:5173
```

Open `http://localhost:5173` in your browser to view the application.

### 5. AI Assistant Setup (Optional)

To enable the local AI Commute Assistant:

```bash
# Install and start Ollama (if not already running)
ollama run gemma2:2b
```

Once running, the in-dashboard assistant will connect to Ollama automatically.

---

## Key User Workflows

```mermaid
sequenceDiagram
    autonumber
    actor Passenger
    participant App as MakeLyft Client
    participant Server as Express & Socket.io
    actor Driver

    Driver->>App: Publish Ride (Origin, Destination, Time, Fare, Seats)
    App->>Server: POST /publish-ride
    Passenger->>App: Open Browse Carpools (Auto-filter by 10km GPS radius)
    App->>Server: GET /rides/browse?lat=...&lng=...&radius=10
    Passenger->>App: Select Ride & Request Booking
    App->>Server: POST /book-ride (Socket notify driver)
    Server-->>Driver: Incoming Booking Notification
    Driver->>App: Accept Booking
    Server-->>Passenger: Booking Confirmed + Generate 4-digit OTP
    Driver->>Passenger: Arrive at Pickup Location
    Passenger->>Driver: Provide Boarding OTP
    Driver->>App: Enter OTP verification
    Server-->>Driver: OTP Validated -> Trip In Progress
    Server->>App: Start Live GPS Room Tracking
    Driver->>App: Complete Trip
    Server->>Server: Deduct Fare from Passenger Wallet -> Credit Driver
    Passenger->>App: Rate Driver & Submit Feedback
```

---

## API Route Overview

| Method | Endpoint                  | Access   | Purpose                                        |
| ------ | ------------------------- | -------- | ---------------------------------------------- |
| `POST` | `/auth/signup`            | Public   | Register new employee account                  |
| `POST` | `/auth/login`             | Public   | Authenticate user & issue JWT                  |
| `POST` | `/auth/verify-otp`        | Public   | Verify corporate email OTP                     |
| `GET`  | `/rides`                  | Verified | Fetch available carpool rides                  |
| `POST` | `/publish-ride`           | Driver   | Publish a new scheduled carpool                |
| `POST` | `/book-ride`              | Verified | Book seat(s) on a published ride               |
| `POST` | `/pickup-ride/verify-otp` | Driver   | Verify passenger boarding OTP                  |
| `POST` | `/register-vehicle`       | Verified | Submit vehicle documents for driver approval   |
| `GET`  | `/wallet`                 | Verified | Check current wallet balance and history       |
| `POST` | `/chat/send`              | Verified | Transmit encrypted message in active ride room |
| `GET`  | `/admin/vehicles`         | Admin    | Review pending driver vehicle applications     |
| `PUT`  | `/admin/settings`         | Admin    | Update organization per-km fuel pricing        |

---

## Contributing

Contributions to MakeLyft are welcome! Please follow these steps:

1. **Fork** the repository.
2. Create a descriptive feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes with clear messages (`git commit -m 'Add amazing feature'`).
4. Push to your branch (`git push origin feature/amazing-feature`).
5. Open a **Pull Request**.

---

## License

This project is licensed under the ISC License. See the [package.json](file:///d:/MakeLyft/MakeLyft/backend/package.json) file for details.

---

<div align="center">
Built with ❤️ for sustainable, smarter corporate commuting with <strong>MakeLyft</strong>.
</div>
