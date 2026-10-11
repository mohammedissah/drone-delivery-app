# 🚁 AeroDrop — Autonomous Drone Delivery Platform

> **Next-Generation Autonomous Airspace Logistics connecting E-Commerce Stores directly to Autonomous Drone Fleets.**

A full-stack, enterprise-grade drone delivery platform featuring **Fleet Ground Control (GCS)**, **Airspace Tactical Maps**, **Real-Time Telemetry via WebSockets**, **E-Commerce Webhook Automation**, and a zero-friction **Customer Live Radar Tracking Portal**.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                    E-COMMERCE STORE (Shopify / Woo / API)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Webhook (POST /api/webhooks/orders)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 BACKEND SERVER (Node.js + Express + ws)                │
│                         Running on Port 3001                           │
│                                                                        │
│  • Automated Payload Mass Validation (< 2.5 kg)                        │
│  • Airspace Corridor & FAA No-Fly Geofence Engine                      │
│  • Authoritative Flight Physics & Telemetry Engine                     │
│  • High-Frequency WebSocket Broadcaster (ws://localhost:3001)          │
│  • REST API: /api/fleet, /api/missions/*, /api/health                  │
└────────────┬─────────────────────────────────────────────┬─────────────┘
             │                                             │
             │ WebSockets (Real-time telemetry)            │ WebSockets
             ▼                                             ▼
┌────────────────────────────────────────┐   ┌───────────────────────────┐
│     FLEET MISSION CONTROL (Desktop)    │   │   CUSTOMER LIVE RADAR     │
│   • Multi-Drone Airspace Radar Map     │   │   • Instant Mobile Tracking   │
│   • HTML5 Canvas Attitude Horizon      │   │   • Drop Zone Safety Check    │
│   • 4K Downlink Camera (RGB/Thermal)   │   │   • Tether Winch Release      │
│   • RTH, Hold & Abort Flight Commands  │   │   • Confetti & POD Receipt    │
└────────────────────────────────────────┘   └───────────────────────────┘
```

---

## 🌟 Key Features

### 1. 🛰️ Fleet Mission Control (Operator Ground Control Station)
* **Interactive Tactical Airspace Map:** Built with Leaflet, featuring animated SVG hexacopter markers, heading rotation, flight corridors, and **FAA No-Fly Geofenced Zones** (hospitals, radio towers, high-rises).
* **Multi-Layer Map Switcher:** Toggle between **RADAR** (tactical dark mode), **SATELLITE** (high-res aerial photography), and **STREETS** (street-level roads).
* **Avionics & Artificial Horizon:** Real-time HTML5 Canvas **Attitude Indicator** showing aircraft pitch and roll angles as the drone maneuvers.
* **Flight Telemetry HUD:** Live telemetry monitoring for altitude (AGL meters), ground speed (km/h), battery voltage/health, RTK GNSS centimeter fix (22 satellites), and tether winch extension.
* **4K Gimbal Downlink Simulator:** Simulated downward camera feed with HUD reticles and toggleable **RGB, Thermal, and Night Vision** vision modes.
* **Autonomous Command Controls:** Launch, Hover Hold, Return to Home (RTH), and Emergency Abort with parachute deployment.

### 2. 📱 Customer Live Radar (Recipient Tracking Experience)
* **Zero-Friction Access:** Simulates the mobile web link a customer opens directly from an SMS or order receipt without downloading an app.
* **Embedded Flight Map:** Watch the drone fly across the city directly to your backyard in real time.
* **Designated Drop Zone Selector:** Choose between **Backyard Lawn**, **Driveway Pad**, or **Rooftop Deck**.
* **Pre-Drop Safety Checklist:** Interactive toggles (pets inside, 3m perimeter clear, no wires) required before package release.
* **Precision Winch Release:** Electric tether unspools package from 25m hover down to touchdown with celebratory confetti and digital proof of delivery.

### 3. 🛒 E-Commerce Checkout Simulator
* Test incoming store orders with urgent and high-value payloads (Emergency Medical Kits, Tech Flagships, Fresh Gourmet Food, Cold-Chain Lab Specimens).
* Select **AeroDrop Autonomous Air Express (< 15 mins)** to dispatch flights directly to the drone fleet via webhooks.

### 4. ⚡ Authoritative Backend & WebSockets
* **Node.js + Express** REST API handling order ingestion and flight commands.
* **Native WebSockets (`ws`)** streaming synchronized telemetry across all connected screens simultaneously.

---

## 📂 Repository Structure

```text
├── backend/
│   ├── server.js              # Express REST API, WebSockets & Flight Engine
│   └── package.json           # Backend dependencies (express, cors, ws)
│
├── frontend/
│   ├── index.html             # Entry HTML & Google Fonts
│   ├── vite.config.js         # Vite configuration
│   ├── package.json           # Frontend dependencies (react, leaflet, lucide)
│   └── src/
│       ├── App.jsx            # Main app & view controller
│       ├── components/
│       │   ├── FleetMissionControl.jsx      # Ground Control Station
│       │   ├── FlightRadarMap.jsx           # Multi-layer tactical map
│       │   ├── AttitudeIndicator.jsx        # Canvas artificial horizon
│       │   ├── DroneCameraFPV.jsx           # Gimbal camera downlink
│       │   ├── CustomerLiveTracker.jsx      # Customer tracking portal
│       │   ├── EcommerceStoreSimulator.jsx  # Store checkout simulator
│       │   └── Navbar.jsx                   # Status bar & UTC clock
│       └── utils/
│           ├── backendApi.js                # WebSocket & REST API client
│           ├── droneSimulator.js            # Physics, waypoints & geofences
│           └── soundEffects.js              # Web Audio HUD synthesizer
│
└── package.json               # Root orchestrator (starts both via concurrently)
```

---

## 🚀 Quickstart Guide

### Prerequisites
* **Node.js** v18+ installed

### 1. Clone the repository
```bash
git clone https://github.com/mohammedissah/drone-delivery-app.git
cd drone-delivery-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start Frontend & Backend together
```bash
npm run dev
```

* **Frontend:** `http://localhost:5173`
* **Backend API:** `http://localhost:3001/api/health`
* **WebSocket Stream:** `ws://localhost:3001`

---

## 📡 E-Commerce Webhook Integration API

To connect an external storefront (Shopify, WooCommerce, custom checkout), send a `POST` request to:

```http
POST http://localhost:3001/api/webhooks/orders
Content-Type: application/json

{
  "orderId": "ORD-9482-GH",
  "recipient": "Kwame Mensah",
  "address": "14 Lagos Avenue, East Legon, Accra, Ghana",
  "item": "Emergency Medical Kit & Vaccine Cooler",
  "weightKg: 1.45,
  "lat": 5.6360,
  "lng": -0.1550,
  "dropZoneType": "Residential Courtyard"
}
```

**Response (201 Created):**
```json
{
  "status": "DISPATCHED",
  "assignedDrone": "AERO-X1",
  "callsign": "Falcon-One",
  "orderId": "ORD-9482-EXP",
  "estimatedFlightMinutes": 4.2
}
```

---

## 🛡️ License
MIT License. Built by [Mohammed Issah](https://github.com/mohammedissah).
