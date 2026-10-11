import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, isDbConnected } from './config/db.js';
import { Order } from './models/Order.js';
import { FlightLog } from './models/FlightLog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas Cloud
connectDB();

// Global SkyPort Central Hub Coordinates & Pads
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

// Active Autonomous Drone Fleet
let drones = [
  {
    id: "AERO-X1",
    callsign: "Falcon-One",
    model: "AeroDrop Hexacopter Mk-IV",
    status: "READY",
    dockPad: "PAD-ALPHA (Fast Induction)",
    isCharging: false,
    maxPayloadKg: 2.5,
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
    status: "DOCKED",
    dockPad: "PAD-BRAVO (Fast Induction)",
    isCharging: true,
    maxPayloadKg: 1.8,
    battery: 72,
    voltage: 24.1,
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
    status: "DOCKED",
    dockPad: "PAD-GAMMA (Solar Induction)",
    isCharging: true,
    maxPayloadKg: 3.2,
    battery: 88,
    voltage: 24.8,
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

// Multi-Order Autonomous Dispatch Queue
let orderQueue = [];

let flightLogs = [
  { timestamp: new Date().toISOString().slice(11, 19) + ' UTC', text: 'Backend MAVLink & Telemetry Gateway online on Port 3001', type: 'info' },
  { timestamp: new Date().toISOString().slice(11, 19) + ' UTC', text: 'WebSocket server broadcast channel active', type: 'info' },
  { timestamp: new Date().toISOString().slice(11, 19) + ' UTC', text: 'Multi-Drone Dispatch Queue & Induction Charger system online', type: 'success' }
];

async function addLog(text, type = 'info', droneId = null) {
  const timestamp = new Date().toISOString().slice(11, 19) + ' UTC';
  flightLogs.unshift({ timestamp, text, type });
  if (flightLogs.length > 50) flightLogs.pop();

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
    orderQueue,
    flightLogs,
    noFlyZones: NO_FLY_ZONES,
    skyport: SKYPORT_COORDINATES,
    mongoConnected: isDbConnected()
  }));
});

// Authoritative Backend Simulation Loop (Synchronizes All Drones Simultaneously)
setInterval(() => {
  let hasStateChanged = false;

  drones = drones.map(drone => {
    let updated = { ...drone };

    // 1. Launch Pad Induction Recharging Simulation
    if (updated.phase === 'IDLE' || updated.phase === 'DELIVERED') {
      updated.isCharging = true;
      if (updated.battery < 100) {
        hasStateChanged = true;
        updated.battery = Math.min(100, parseFloat((updated.battery + 0.35).toFixed(1)));
        updated.voltage = parseFloat((21.0 + (updated.battery / 100) * 4.4).toFixed(1));
      }

      // Check if there are orders waiting in the queue & drone has sufficient battery (>= 50%)
      if (orderQueue.length > 0 && updated.battery >= 50 && (!updated.order || updated.phase === 'DELIVERED')) {
        const nextOrder = orderQueue.shift();
        updated.order = nextOrder;
        updated.phase = 'TAKEOFF';
        updated.progress = 5;
        updated.isCharging = false;
        updated.lat = SKYPORT_COORDINATES.lat;
        updated.lng = SKYPORT_COORDINATES.lng;
        updated.altitudeMeters = 0;
        updated.speedKmh = 0;
        hasStateChanged = true;

        addLog(`Automated Scheduler assigned queued order ${nextOrder.orderId} to ${updated.callsign}. Drone departing ${updated.dockPad}!`, 'success', updated.id);

        if (isDbConnected()) {
          Order.findOneAndUpdate(
            { orderId: nextOrder.orderId },
            { status: 'AIRBORNE', assignedDrone: updated.id }
          ).catch(() => {});
        }
      }
    } else {
      updated.isCharging = false;
    }

    // 2. Flight Dynamics Loop
    switch (updated.phase) {
      case 'TAKEOFF': {
        hasStateChanged = true;
        if (updated.altitudeMeters < updated.targetAltitude) {
          updated.altitudeMeters += 2.5;
          updated.pitchDeg = 4.5;
          updated.rollDeg = (Math.random() - 0.5) * 1.5;
          updated.speedKmh = 14;
          updated.battery = Math.max(0, parseFloat((updated.battery - 0.05).toFixed(2)));
        } else {
          updated.altitudeMeters = updated.targetAltitude;
          updated.phase = 'EN_ROUTE';
          updated.pitchDeg = 1.0;
          addLog(`${updated.callsign} reached cruising altitude 65m. Transiting flight corridor.`, 'success', updated.id);
        }
        break;
      }

      case 'EN_ROUTE': {
        hasStateChanged = true;
        if (!updated.order) break;
        const dest = updated.order;
        const dist = calculateDistanceMeters(updated.lat, updated.lng, dest.lat, dest.lng);

        if (dist > 40) {
          const step = 0.00016;
          const latDiff = dest.lat - updated.lat;
          const lngDiff = dest.lng - updated.lng;
          const angle = Math.atan2(lngDiff, latDiff);

          updated.lat += Math.cos(angle) * step;
          updated.lng += Math.sin(angle) * step;
          updated.speedKmh = 48 + (Math.random() - 0.5) * 3;
          updated.headingDeg = calculateBearing(updated.lat, updated.lng, dest.lat, dest.lng);
          updated.pitchDeg = 1.2;
          updated.rollDeg = Math.sin(Date.now() / 1500) * 3.5;
          updated.battery = Math.max(0, parseFloat((updated.battery - 0.08).toFixed(2)));

          const totalDist = calculateDistanceMeters(SKYPORT_COORDINATES.lat, SKYPORT_COORDINATES.lng, dest.lat, dest.lng);
          updated.progress = Math.min(85, Math.max(10, ((totalDist - dist) / totalDist) * 85));
        } else {
          updated.speedKmh = 0;
          updated.phase = 'HOVER_DROPZONE';
          updated.pitchDeg = 0;
          updated.rollDeg = 0;
          updated.progress = 85;
          addLog(`${updated.callsign} arrived over drop zone (${dest.address}). Hovering at 25m.`, 'success', updated.id);
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
          addLog(`Ground sensors detected touchdown! Smart-latch released payload safely.`, 'success', updated.id);

          setTimeout(() => {
            const d = drones.find(item => item.id === updated.id);
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
          addLog(`Tether retracted to belly. Auto Return-to-Home trajectory active.`, 'info', updated.id);
        }
        break;
      }

      case 'RETURN_TO_HOME': {
        hasStateChanged = true;
        const dist = calculateDistanceMeters(updated.lat, updated.lng, SKYPORT_COORDINATES.lat, SKYPORT_COORDINATES.lng);

        if (dist > 30) {
          const step = 0.00018;
          const latDiff = SKYPORT_COORDINATES.lat - updated.lat;
          const lngDiff = SKYPORT_COORDINATES.lng - updated.lng;
          const angle = Math.atan2(lngDiff, latDiff);

          updated.lat += Math.cos(angle) * step;
          updated.lng += Math.sin(angle) * step;
          updated.speedKmh = 52 + (Math.random() - 0.5) * 2;
          updated.headingDeg = calculateBearing(updated.lat, updated.lng, SKYPORT_COORDINATES.lat, SKYPORT_COORDINATES.lng);
          updated.altitudeMeters = 65;
          updated.pitchDeg = -1.5;
          updated.rollDeg = Math.sin(Date.now() / 1500) * 3;
          updated.battery = Math.max(0, parseFloat((updated.battery - 0.08).toFixed(2)));
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
            addLog(`${updated.callsign} touchdown on ${updated.dockPad}. Auto-docked with induction charger.`, 'success', updated.id);

            // Update order status in MongoDB
            if (updated.order && isDbConnected()) {
              Order.findOneAndUpdate(
                { orderId: updated.order.orderId },
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
      orderQueue,
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

// 2. Get Fleet Telemetry & Queue
app.get('/api/fleet', (req, res) => {
  res.json({
    drones,
    orderQueue,
    flightLogs,
    skyport: SKYPORT_COORDINATES,
    mongoConnected: isDbConnected()
  });
});

// 3. E-Commerce Order Webhook Endpoint
app.post('/api/webhooks/orders', async (req, res) => {
  const { orderId, recipient, address, item, weightKg, lat, lng, dropZoneType } = req.body;

  if (!orderId || !item || !lat || !lng) {
    return res.status(400).json({ error: 'Missing mandatory order fields (orderId, item, lat, lng)' });
  }

  if (weightKg > 3.2) {
    return res.status(400).json({ error: `Payload mass (${weightKg}kg) exceeds maximum fleet limit of 3.2kg` });
  }

  const orderPayload = {
    orderId,
    recipient: recipient || 'Valued Customer',
    address: address || 'Destination Drop Zone',
    item,
    weightKg: weightKg || 1.0,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    dropZoneType: dropZoneType || 'Backyard Lawn',
    status: 'PENDING',
    assignedDrone: null
  };

  // Find an available idle drone with sufficient battery (>= 45%) and matching payload capacity
  const availableDrone = drones.find(d => 
    (d.phase === 'IDLE' || d.phase === 'DELIVERED') && 
    d.battery >= 45 && 
    d.maxPayloadKg >= orderPayload.weightKg
  );

  if (availableDrone) {
    availableDrone.order = orderPayload;
    availableDrone.phase = 'TAKEOFF';
    availableDrone.progress = 5;
    availableDrone.isCharging = false;
    availableDrone.lat = SKYPORT_COORDINATES.lat;
    availableDrone.lng = SKYPORT_COORDINATES.lng;
    availableDrone.altitudeMeters = 0;
    availableDrone.speedKmh = 0;
    orderPayload.status = 'AIRBORNE';
    orderPayload.assignedDrone = availableDrone.id;

    addLog(`Order ${orderId} assigned to ${availableDrone.callsign}. Departing ${availableDrone.dockPad}.`, 'success', availableDrone.id);
  } else {
    // Add to automated dispatch queue
    orderQueue.push(orderPayload);
    addLog(`All drones busy or charging. Order ${orderId} added to Dispatch Queue (Position #${orderQueue.length}).`, 'info');
  }

  // Persist to MongoDB
  if (isDbConnected()) {
    try {
      await Order.findOneAndUpdate(
        { orderId },
        orderPayload,
        { upsert: true, new: true }
      );
    } catch (err) {
      console.warn('MongoDB save warning:', err.message);
    }
  }

  broadcast({
    type: 'ORDER_DISPATCHED',
    drones,
    orderQueue,
    flightLogs,
    mongoConnected: isDbConnected()
  });

  res.status(201).json({
    status: availableDrone ? 'DISPATCHED' : 'QUEUED',
    assignedDrone: availableDrone ? availableDrone.id : null,
    queuePosition: availableDrone ? null : orderQueue.length,
    orderId,
    estimatedFlightMinutes: 4.2
  });
});

// 4. Multi-Drone Batch Order Simulator (Demonstrates Simultaneous Multi-Flight)
app.post('/api/fleet/simulate-batch', async (req, res) => {
  const batchOrders = [
    {
      orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}-EMERG`,
      recipient: "Dr. Sarah Lin (Bay Clinic)",
      address: "1301 Mission St, Emergency Wing",
      item: "Automated External Defibrillator & Adrenaline",
      weightKg: 1.8,
      lat: 37.7760,
      lng: -122.4150,
      dropZoneType: "Driveway Pad"
    },
    {
      orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}-TECH`,
      recipient: "Marcus Vance (SOMA Towers)",
      address: "555 California St, Suite 22",
      item: "Flagship Drone Sensor & Battery Spares",
      weightKg: 1.2,
      lat: 37.7925,
      lng: -122.4035,
      dropZoneType: "Rooftop Deck"
    },
    {
      orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}-MED`,
      recipient: "Elena Rostova (Residential)",
      address: "742 Evergreen Terr, Sector 4",
      item: "Insulated Vaccine Cooler Box",
      weightKg: 2.1,
      lat: 37.7865,
      lng: -122.4055,
      dropZoneType: "Backyard Lawn"
    }
  ];

  // Dispatch orders to drones or queue
  batchOrders.forEach((orderData, index) => {
    const drone = drones[index % drones.length];
    drone.order = orderData;
    drone.phase = 'TAKEOFF';
    drone.progress = 5;
    drone.isCharging = false;
    drone.lat = SKYPORT_COORDINATES.lat;
    drone.lng = SKYPORT_COORDINATES.lng;
    drone.altitudeMeters = 0;
    drone.speedKmh = 0;

    addLog(`Batch Dispatch: ${drone.callsign} launched for ${orderData.orderId} (${orderData.item})`, 'success', drone.id);

    if (isDbConnected()) {
      Order.findOneAndUpdate(
        { orderId: orderData.orderId },
        { ...orderData, status: 'AIRBORNE', assignedDrone: drone.id },
        { upsert: true }
      ).catch(() => {});
    }
  });

  broadcast({
    type: 'BATCH_DISPATCHED',
    drones,
    orderQueue,
    flightLogs,
    mongoConnected: isDbConnected()
  });

  res.json({
    success: true,
    message: "Batch fleet dispatch triggered for all 3 autonomous drones!",
    orders: batchOrders
  });
});

// 5. Mission Flight Commands
app.post('/api/missions/launch', (req, res) => {
  const { droneId = 'AERO-X1' } = req.body;
  const drone = drones.find(d => d.id === droneId);
  if (!drone) return res.status(404).json({ error: 'Drone not found' });

  drone.phase = 'TAKEOFF';
  drone.progress = 5;
  drone.isCharging = false;
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
  drone.isCharging = true;
  addLog(`${drone.callsign} reset to ${drone.dockPad}. Docked for charging.`, 'info', drone.id);
  broadcast({ type: 'COMMAND_ACK', drones, flightLogs });
  res.json({ success: true, drone });
});

// 6. MongoDB Query Endpoints
app.get('/api/db/status', async (req, res) => {
  try {
    const connected = isDbConnected();
    const orderCount = connected ? await Order.countDocuments() : 0;
    const logCount = connected ? await FlightLog.countDocuments() : 0;
    res.json({
      connected,
      database: 'aerodrop',
      host: 'MongoDB Atlas Cloud',
      counts: { orders: orderCount, flightLogs: logCount, queue: orderQueue.length }
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
