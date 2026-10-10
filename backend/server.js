import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isDbConnected } from './config/db.js';
import { Order } from './models/Order.js';
import { FlightLog } from './models/FlightLog.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// In-Memory Database & State (Syncs with MongoDB)
const SKYPORT_COORDINATES = {
  name: "SkyPort Hub Alpha (Central Depot)",
  lat: 37.7749,
  lng: -122.4194,
  alt: 12.0
};

const NO_FLY_ZONES = [
  { id: "NFZ-01", name: "St. Luke Heliport Corridor", lat: 37.7680, lng: -122.4140, radius: 350 },
  { id: "NFZ-02", name: "City Hall Radio Tower", lat: 37.7792, lng: -122.4191, radius: 280 },
  { id: "NFZ-03", name: "Embarcadero High-Rise Air Corridor", lat: 37.7940, lng: -122.4000, radius: 400 }
];

let drones = [
  {
    id: "AERO-X1",
    callsign: "Falcon-One",
    model: "AeroDrop Hexacopter Mk-IV",
    status: "READY",
    battery: 98,
    voltage: 25.2,
    speedKmh: 0,
    targetSpeed: 48,
    altitudeMeters: 0,
    targetAltitude: 65,
    headingDeg: 42,
    pitchDeg: 0,
    rollDeg: 0,
    lat: SKYPORT_COORDINATES.lat,
    lng: SKYPORT_COORDINATES.lng,
    gpsSats: 22,
    rtkFix: "RTK FIXED (±1.5cm)",
    tetherLengthM: 0,
    windVector: { speed: 12, direction: "NW" },
    phase: "IDLE",
    progress: 0,
    order: {
      orderId: "ORD-9482-EXP",
      recipient: "Elena Rostova",
      address: "742 Evergreen Terr, Sector 4",
      item: "Emergency Medical Kit & Sensor",
      weightKg: 1.45,
      lat: 37.7865,
      lng: -122.4055,
      dropZoneType: "Backyard Lawn"
    }
  },
  {
    id: "AERO-X2",
    callsign: "Valkyrie-Two",
    model: "AeroDrop VTOL Cruiser",
    status: "STANDBY",
    battery: 88,
    voltage: 24.8,
    speedKmh: 0,
    targetSpeed: 55,
    altitudeMeters: 0,
    targetAltitude: 70,
    headingDeg: 180,
    pitchDeg: 0,
    rollDeg: 0,
    lat: 37.7745,
    lng: -122.4188,
    gpsSats: 20,
    rtkFix: "RTK FIXED (±1.8cm)",
    tetherLengthM: 0,
    windVector: { speed: 14, direction: "NW" },
    phase: "IDLE",
    progress: 0,
    order: null
  },
  {
    id: "AERO-X3",
    callsign: "Peregrine-Three",
    model: "AeroDrop Heavy-Lift Octo",
    status: "STANDBY",
    battery: 100,
    voltage: 25.4,
    speedKmh: 0,
    targetSpeed: 40,
    altitudeMeters: 0,
    targetAltitude: 60,
    headingDeg: 0,
    pitchDeg: 0,
    rollDeg: 0,
    lat: 37.7752,
    lng: -122.4200,
    gpsSats: 24,
    rtkFix: "RTK FIXED (±1.2cm)",
    tetherLengthM: 0,
    windVector: { speed: 11, direction: "NW" },
    phase: "IDLE",
    progress: 0,
    order: null
  }
];

let flightLogs = [
  { timestamp: new Date().toISOString().slice(11, 19) + ' UTC', text: 'Backend MAVLink & Telemetry Gateway online on Port 3001', type: 'info' },
  { timestamp: new Date().toISOString().slice(11, 19) + ' UTC', text: 'WebSocket server broadcast channel active', type: 'info' },
  { timestamp: new Date().toISOString().slice(11, 19) + ' UTC', text: 'MongoDB connection manager initialized', type: 'success' }
];

async function addLog(text, type = 'info', droneId = null) {
  const timestamp = new Date().toISOString().slice(11, 19) + ' UTC';
  flightLogs.unshift({ timestamp, text, type });
  if (flightLogs.length > 50) flightLogs.pop();

  // Persist to MongoDB
  if (isDbConnected()) {
    try {
      await FlightLog.create({ timestamp, text, type, droneId });
    } catch {
      // Ignore background log error
    }
  }
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.cos(φ1) * Math.sin(φ2) * Math.cos(Δλ);
  return ((toDeg(Math.atan2(y, x)) + 360) % 360);
}

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = deg => (deg * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Create HTTP and WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected (Mission Control or Customer Tracker)');
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    drones,
    flightLogs,
    noFlyZones: NO_FLY_ZONES,
    skyport: SKYPORT_COORDINATES,
    mongoConnected: isDbConnected()
  }));
});

// Authoritative Backend Simulation Loop
setInterval(() => {
  let hasStateChanged = false;

  drones = drones.map(drone => {
    let updated = { ...drone };

    switch (drone.phase) {
      case 'TAKEOFF': {
        hasStateChanged = true;
        if (updated.altitudeMeters < updated.targetAltitude) {
          updated.altitudeMeters += 2.5;
          updated.pitchDeg = 4.5;
          updated.rollDeg = (Math.random() - 0.5) * 1.5;
          updated.speedKmh = 14;
          updated.battery = Math.max(0, updated.battery - 0.05);
        } else {
          updated.altitudeMeters = updated.targetAltitude;
          updated.phase = 'EN_ROUTE';
          updated.pitchDeg = 1.0;
          addLog(`${drone.callsign} reached cruising altitude 65m. Transiting flight corridor.`, 'success', drone.id);
        }
        break;
      }

      case 'EN_ROUTE': {
        hasStateChanged = true;
        if (!drone.order) break;
        const dest = drone.order;
        const dist = calculateDistanceMeters(drone.lat, drone.lng, dest.lat, dest.lng);

        if (dist > 40) {
          const step = 0.00016;
          const latDiff = dest.lat - drone.lat;
          const lngDiff = dest.lng - drone.lng;
          const angle = Math.atan2(lngDiff, latDiff);

          updated.lat += Math.cos(angle) * step;
          updated.lng += Math.sin(angle) * step;
          updated.speedKmh = 48 + (Math.random() - 0.5) * 3;
          updated.headingDeg = calculateBearing(drone.lat, drone.lng, dest.lat, dest.lng);
          updated.pitchDeg = 1.2;
          updated.rollDeg = Math.sin(Date.now() / 1500) * 3.5;
          updated.battery = Math.max(0, updated.battery - 0.08);

          const totalDist = calculateDistanceMeters(SKYPORT_COORDINATES.lat, SKYPORT_COORDINATES.lng, dest.lat, dest.lng);
          updated.progress = Math.min(85, Math.max(10, ((totalDist - dist) / totalDist) * 85));
        } else {
          updated.speedKmh = 0;
          updated.phase = 'HOVER_DROPZONE';
          updated.pitchDeg = 0;
          updated.rollDeg = 0;
          updated.progress = 85;
          addLog(`${drone.callsign} arrived over drop zone (${dest.address}). Hovering at 25m.`, 'success', drone.id);
        }
        break;
      }

      case 'HOVER_DROPZONE': {
        hasStateChanged = true;
        updated.speedKmh = 0;
        updated.pitchDeg = (Math.random() - 0.5) * 0.8;
        updated.rollDeg = (Math.random() - 0.5) * 0.8;
        break;
      }

      case 'WINCH_DROP': {
        hasStateChanged = true;
        if (updated.tetherLengthM < 21) {
          updated.tetherLengthM += 1.2;
          updated.progress = 85 + (updated.tetherLengthM / 21) * 10;
        } else {
          updated.tetherLengthM = 22;
          updated.phase = 'PACKAGE_RELEASED';
          updated.progress = 96;
          addLog(`Ground sensors detected touchdown! Smart-latch released payload safely.`, 'success', drone.id);

          setTimeout(() => {
            const d = drones.find(item => item.id === drone.id);
            if (d && d.phase === 'PACKAGE_RELEASED') {
              d.phase = 'WINCH_RETRACT';
            }
          }, 1500);
        }
        break;
      }

      case 'WINCH_RETRACT': {
        hasStateChanged = true;
        if (updated.tetherLengthM > 0) {
          updated.tetherLengthM = Math.max(0, updated.tetherLengthM - 2.0);
        } else {
          updated.tetherLengthM = 0;
          updated.phase = 'RETURN_TO_HOME';
          addLog(`Tether retracted to belly. Auto Return-to-Home trajectory active.`, 'info', drone.id);
        }
        break;
      }

      case 'RETURN_TO_HOME': {
        hasStateChanged = true;
        const dist = calculateDistanceMeters(drone.lat, drone.lng, SKYPORT_COORDINATES.lat, SKYPORT_COORDINATES.lng);

        if (dist > 30) {
          const step = 0.00018;
          const latDiff = SKYPORT_COORDINATES.lat - drone.lat;
          const lngDiff = SKYPORT_COORDINATES.lng - drone.lng;
          const angle = Math.atan2(lngDiff, latDiff);

          updated.lat += Math.cos(angle) * step;
          updated.lng += Math.sin(angle) * step;
          updated.speedKmh = 52 + (Math.random() - 0.5) * 2;
          updated.headingDeg = calculateBearing(drone.lat, drone.lng, SKYPORT_COORDINATES.lat, SKYPORT_COORDINATES.lng);
          updated.altitudeMeters = 65;
          updated.pitchDeg = -1.5;
          updated.rollDeg = Math.sin(Date.now() / 1500) * 3;
          updated.battery = Math.max(0, updated.battery - 0.08);
          updated.progress = 98;
        } else {
          if (updated.altitudeMeters > 0.5) {
            updated.altitudeMeters -= 3.0;
            updated.speedKmh = 6;
          } else {
            updated.altitudeMeters = 0;
            updated.speedKmh = 0;
            updated.phase = 'DELIVERED';
            updated.progress = 100;
            addLog(`${drone.callsign} touchdown on SkyPort Launch Pad Alpha.`, 'success', drone.id);

            // Update order status in MongoDB
            if (drone.order && isDbConnected()) {
              Order.findOneAndUpdate(
                { orderId: drone.order.orderId },
                { status: 'DELIVERED', deliveredAt: new Date() }
              ).catch(() => {});
            }
          }
        }
        break;
      }

      default:
        break;
    }

    return updated;
  });

  if (hasStateChanged) {
    broadcast({
      type: 'TELEMETRY_UPDATE',
      drones,
      flightLogs,
      mongoConnected: isDbConnected()
    });
  }
}, 300);

// --- REST API Endpoints ---

// 1. Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AeroDrop Fleet Telemetry Engine',
    database: isDbConnected() ? 'MongoDB Connected' : 'In-Memory Fallback',
    timestamp: new Date().toISOString()
  });
});

// 2. Get Fleet Telemetry
app.get('/api/fleet', (req, res) => {
  res.json({ drones, flightLogs, skyport: SKYPORT_COORDINATES, mongoConnected: isDbConnected() });
});

// 3. E-Commerce Order Webhook Endpoint (Persists to MongoDB)
app.post('/api/webhooks/orders', async (req, res) => {
  const { orderId, recipient, address, item, weightKg, lat, lng, dropZoneType } = req.body;

  if (!orderId || !item || !lat || !lng) {
    return res.status(400).json({ error: 'Missing mandatory order fields (orderId, item, lat, lng)' });
  }

  if (weightKg > 2.5) {
    return res.status(400).json({ error: `Payload mass (${weightKg}kg) exceeds drone payload limit of 2.5kg` });
  }

  const drone = drones.find(d => d.phase === 'IDLE' || d.phase === 'DELIVERED') || drones[0];

  const orderPayload = {
    orderId,
    recipient: recipient || 'Valued Customer',
    address: address || 'Destination Drop Zone',
    item,
    weightKg: weightKg || 1.0,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    dropZoneType: dropZoneType || 'Backyard Lawn',
    status: 'AIRBORNE',
    assignedDrone: drone.id
  };

  drone.order = orderPayload;
  drone.phase = 'TAKEOFF';
  drone.progress = 5;
  drone.lat = SKYPORT_COORDINATES.lat;
  drone.lng = SKYPORT_COORDINATES.lng;
  drone.altitudeMeters = 0;
  drone.speedKmh = 0;

  // Save to MongoDB if connected
  if (isDbConnected()) {
    try {
      await Order.findOneAndUpdate(
        { orderId },
        orderPayload,
        { upsert: true, new: true }
      );
      console.log(`🍃 Order ${orderId} saved to MongoDB collection 'orders'`);
    } catch (err) {
      console.warn('MongoDB save warning:', err.message);
    }
  }

  addLog(`E-Commerce Webhook: Order ${orderId} assigned to ${drone.callsign}. Payload: ${item} (${weightKg} kg). Takeoff initiated.`, 'success', drone.id);

  broadcast({
    type: 'ORDER_DISPATCHED',
    droneId: drone.id,
    order: drone.order,
    drones,
    flightLogs,
    mongoConnected: isDbConnected()
  });

  res.status(201).json({
    status: 'DISPATCHED',
    assignedDrone: drone.id,
    callsign: drone.callsign,
    orderId,
    estimatedFlightMinutes: 4.2,
    database: isDbConnected() ? 'MongoDB Persisted' : 'Memory'
  });
});

// 4. Mission Flight Commands
app.post('/api/missions/launch', (req, res) => {
  const { droneId = 'AERO-X1' } = req.body;
  const drone = drones.find(d => d.id === droneId);
  if (!drone) return res.status(404).json({ error: 'Drone not found' });

  drone.phase = 'TAKEOFF';
  drone.progress = 5;
  addLog(`Operator launched ${drone.callsign}. Ascending to flight corridor.`, 'info', drone.id);
  broadcast({ type: 'COMMAND_ACK', drones, flightLogs });
  res.json({ success: true, drone });
});

app.post('/api/missions/hold', (req, res) => {
  const { droneId = 'AERO-X1' } = req.body;
  const drone = drones.find(d => d.id === droneId);
  if (!drone) return res.status(404).json({ error: 'Drone not found' });

  drone.phase = 'HOLD';
  drone.speedKmh = 0;
  addLog(`Operator commanded ${drone.callsign} to HOVER HOLD.`, 'alert', drone.id);
  broadcast({ type: 'COMMAND_ACK', drones, flightLogs });
  res.json({ success: true, drone });
});

app.post('/api/missions/rth', (req, res) => {
  const { droneId = 'AERO-X1' } = req.body;
  const drone = drones.find(d => d.id === droneId);
  if (!drone) return res.status(404).json({ error: 'Drone not found' });

  drone.phase = 'RETURN_TO_HOME';
  drone.tetherLengthM = 0;
  addLog(`RTH command issued. ${drone.callsign} returning to SkyPort.`, 'alert', drone.id);
  broadcast({ type: 'COMMAND_ACK', drones, flightLogs });
  res.json({ success: true, drone });
});

app.post('/api/missions/abort', (req, res) => {
  const { droneId = 'AERO-X1' } = req.body;
  const drone = drones.find(d => d.id === droneId);
  if (!drone) return res.status(404).json({ error: 'Drone not found' });

  drone.phase = 'ABORT';
  drone.speedKmh = 0;
  addLog(`EMERGENCY ABORT COMMANDED for ${drone.callsign}. Parachute deploy signal sent.`, 'alert', drone.id);
  broadcast({ type: 'COMMAND_ACK', drones, flightLogs });
  res.json({ success: true, drone });
});

app.post('/api/missions/authorize-drop', (req, res) => {
  const { droneId = 'AERO-X1' } = req.body;
  const drone = drones.find(d => d.id === droneId);
  if (!drone) return res.status(404).json({ error: 'Drone not found' });

  drone.phase = 'WINCH_DROP';
  addLog(`Recipient confirmed drop clearance! Winch tether unspooling...`, 'success', drone.id);
  broadcast({ type: 'COMMAND_ACK', drones, flightLogs });
  res.json({ success: true, drone });
});

app.post('/api/missions/reset', (req, res) => {
  const { droneId = 'AERO-X1' } = req.body;
  const drone = drones.find(d => d.id === droneId);
  if (!drone) return res.status(404).json({ error: 'Drone not found' });

  drone.phase = 'IDLE';
  drone.lat = SKYPORT_COORDINATES.lat;
  drone.lng = SKYPORT_COORDINATES.lng;
  drone.altitudeMeters = 0;
  drone.speedKmh = 0;
  drone.battery = 98;
  drone.progress = 0;
  drone.tetherLengthM = 0;
  addLog(`${drone.callsign} reset to SkyPort Launch Pad Alpha.`, 'info', drone.id);
  broadcast({ type: 'COMMAND_ACK', drones, flightLogs });
  res.json({ success: true, drone });
});

// 5. MongoDB Query Endpoints
app.get('/api/db/status', async (req, res) => {
  try {
    const connected = isDbConnected();
    const orderCount = connected ? await Order.countDocuments() : 0;
    const logCount = connected ? await FlightLog.countDocuments() : 0;
    res.json({
      connected,
      database: 'aerodrop',
      host: '127.0.0.1:27017',
      counts: { orders: orderCount, flightLogs: logCount }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/db/orders', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({ source: 'in-memory', orders: drones.map(d => d.order).filter(Boolean) });
    }
    const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
    res.json({ source: 'mongodb', count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/db/logs', async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({ source: 'in-memory', logs: flightLogs });
    }
    const logs = await FlightLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ source: 'mongodb', count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 AeroDrop Drone Backend Server listening on http://localhost:${PORT}`);
  console.log(`🛰️ WebSocket stream active on ws://localhost:${PORT}`);
});
