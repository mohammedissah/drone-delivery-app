import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import FleetMissionControl from './components/FleetMissionControl';
import CustomerLiveTracker from './components/CustomerLiveTracker';
import EcommerceStoreSimulator from './components/EcommerceStoreSimulator';
import FleetAnalytics from './components/FleetAnalytics';
import { 
  INITIAL_DRONES, 
  SKYPORT_COORDINATES, 
  DEFAULT_CUSTOMER_DESTINATION, 
  generateFlightPath, 
  calculateBearing, 
  calculateDistanceMeters 
} from './utils/droneSimulator';
import { DroneBackendClient } from './utils/backendApi';
import { sounds } from './utils/soundEffects';

export default function App() {
  const [currentView, setCurrentView] = useState('mission_control');
  const [drones, setDrones] = useState(INITIAL_DRONES);
  const [activeDroneId, setActiveDroneId] = useState('AERO-X1');
  const [orderQueue, setOrderQueue] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [mongoConnected, setMongoConnected] = useState(false);
  const [flightLogs, setFlightLogs] = useState([
    { timestamp: '05:58:12 UTC', text: 'MAVLink telemetry link online via 5G satellite', type: 'info' },
    { timestamp: '05:58:18 UTC', text: 'RTK centimeter positioning fix locked (22 satellites)', type: 'info' },
    { timestamp: '05:58:24 UTC', text: 'Airspace corridor ACCRA-ALPHA approved by GCAA automated UTM', type: 'success' },
    { timestamp: '05:58:30 UTC', text: 'Kotoka SkyPort Induction Docks online (Pads Alpha, Bravo, Gamma)', type: 'info' }
  ]);

  const backendClientRef = useRef(null);

  // Initialize Backend WebSocket Client
  useEffect(() => {
    const client = new DroneBackendClient(
      (message) => {
        if (message.type === 'INIT_STATE' || message.type === 'TELEMETRY_UPDATE' || message.type === 'ORDER_DISPATCHED' || message.type === 'BATCH_DISPATCHED' || message.type === 'COMMAND_ACK') {
          if (message.drones) {
            setDrones(message.drones);
          }
          if (message.flightLogs) {
            setFlightLogs(message.flightLogs);
          }
          if (message.orderQueue) {
            setOrderQueue(message.orderQueue);
          }
          if (typeof message.mongoConnected === 'boolean') {
            setMongoConnected(message.mongoConnected);
          }
        }
      },
      (isConnected) => {
        setBackendConnected(isConnected);
      }
    );

    client.connect();
    backendClientRef.current = client;

    return () => {
      client.disconnect();
    };
  }, []);

  const activeDrone = drones.find(d => d.id === activeDroneId) || drones[0];
  const targetDestination = activeDrone.order || DEFAULT_CUSTOMER_DESTINATION;
  const flightPath = generateFlightPath(SKYPORT_COORDINATES, targetDestination);

  const addLog = (text, type = 'info') => {
    const time = new Date().toISOString().slice(11, 19) + ' UTC';
    setFlightLogs(prev => [{ timestamp: time, text, type }, ...prev.slice(0, 40)]);
  };

  // Local fallback simulation tick loop (active when backend is not connected)
  useEffect(() => {
    if (backendConnected) return; // Backend is authoritatively driving physics!

    const timer = setInterval(() => {
      setDrones(prevDrones => {
        return prevDrones.map(drone => {
          let updated = { ...drone };

          // 1. Launch pad induction charging
          if (updated.phase === 'IDLE' || updated.phase === 'DELIVERED') {
            updated.isCharging = true;
            if (updated.battery < 100) {
              updated.battery = Math.min(100, parseFloat((updated.battery + 0.35).toFixed(1)));
              updated.voltage = parseFloat((21.0 + (updated.battery / 100) * 4.4).toFixed(1));
            }

            // Check if queue has orders and drone is charged >= 50%
            if (orderQueue.length > 0 && updated.battery >= 50 && (!updated.order || updated.phase === 'DELIVERED')) {
              const nextOrder = orderQueue[0];
              setOrderQueue(q => q.slice(1));
              updated.order = nextOrder;
              updated.phase = 'TAKEOFF';
              updated.progress = 5;
              updated.isCharging = false;
              updated.lat = SKYPORT_COORDINATES.lat;
              updated.lng = SKYPORT_COORDINATES.lng;
              updated.altitudeMeters = 0;
              updated.speedKmh = 0;
              addLog(`Automated Scheduler assigned queued order ${nextOrder.orderId} to ${updated.callsign}!`, 'success');
            }
          }

          switch (drone.phase) {
            case 'TAKEOFF': {
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
                addLog(`${drone.callsign} reached cruising altitude 65m AGL. Transiting flight corridor.`, 'success');
              }
              break;
            }

            case 'EN_ROUTE': {
              const dest = drone.order || DEFAULT_CUSTOMER_DESTINATION;
              const dist = calculateDistanceMeters(drone.lat, drone.lng, dest.lat, dest.lng);

              if (dist > 40) {
                const step = 0.00015;
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
                addLog(`${drone.callsign} arrived over designated drop zone (${dest.address}). Hovering at 25m.`, 'success');
                sounds.playRadarPing();
              }
              break;
            }

            case 'HOVER_DROPZONE': {
              updated.speedKmh = 0;
              updated.pitchDeg = (Math.random() - 0.5) * 0.8;
              updated.rollDeg = (Math.random() - 0.5) * 0.8;
              break;
            }

            case 'WINCH_DROP': {
              if (updated.tetherLengthM < 21) {
                updated.tetherLengthM += 1.2;
                updated.progress = 85 + (updated.tetherLengthM / 21) * 10;
              } else {
                updated.tetherLengthM = 22;
                updated.phase = 'PACKAGE_RELEASED';
                updated.progress = 96;
                addLog(`Touchdown sensor confirmed ground contact for ${drone.callsign}. Smart-latch released payload safely!`, 'success');
              }
              break;
            }

            case 'PACKAGE_RELEASED': {
              setTimeout(() => {
                setDrones(currentDrones =>
                  currentDrones.map(d => d.id === drone.id ? { ...d, phase: 'WINCH_RETRACT' } : d)
                );
              }, 1200);
              break;
            }

            case 'WINCH_RETRACT': {
              if (updated.tetherLengthM > 0) {
                updated.tetherLengthM = Math.max(0, updated.tetherLengthM - 2.0);
              } else {
                updated.tetherLengthM = 0;
                updated.phase = 'RETURN_TO_HOME';
                addLog(`${drone.callsign} tether reeled in. Initializing autonomous Return-to-Home trajectory.`, 'info');
              }
              break;
            }

            case 'RETURN_TO_HOME': {
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
                  addLog(`${drone.callsign} touchdown on ${updated.dockPad || 'SkyPort Pad'}. Auto-docked with induction charger.`, 'success');
                }
              }
              break;
            }

            default:
              break;
          }

          return updated;
        });
      });
    }, 300);

    return () => clearInterval(timer);
  }, [backendConnected, orderQueue]);

  // Actions connecting to Backend API with fallback
  const handleLaunchMission = () => {
    if (backendConnected && backendClientRef.current) {
      backendClientRef.current.sendLaunch(activeDroneId);
    } else {
      setDrones(prev => prev.map(d => d.id === activeDroneId ? { ...d, phase: 'TAKEOFF', progress: 5, targetAltitude: 65, isCharging: false } : d));
      addLog(`Takeoff authorized by Operator for ${activeDrone.callsign}. Ascending to 65m corridor.`, 'info');
    }
  };

  const handleHoldMission = () => {
    if (backendConnected && backendClientRef.current) {
      backendClientRef.current.sendHold(activeDroneId);
    } else {
      setDrones(prev => prev.map(d => d.id === activeDroneId ? { ...d, phase: 'HOLD', speedKmh: 0 } : d));
      addLog(`Flight Hold commanded. Drone maintaining stationary hover lock.`, 'alert');
    }
  };

  const handleReturnToHome = () => {
    if (backendConnected && backendClientRef.current) {
      backendClientRef.current.sendRth(activeDroneId);
    } else {
      setDrones(prev => prev.map(d => d.id === activeDroneId ? { ...d, phase: 'RETURN_TO_HOME', tetherLengthM: 0 } : d));
      addLog(`Return-to-Home (RTH) initiated. Drone routing back to SkyPort.`, 'alert');
    }
  };

  const handleEmergencyAbort = () => {
    if (backendConnected && backendClientRef.current) {
      backendClientRef.current.sendAbort(activeDroneId);
    } else {
      setDrones(prev => prev.map(d => d.id === activeDroneId ? { ...d, phase: 'ABORT', speedKmh: 0 } : d));
      addLog(`EMERGENCY ABORT TRIGGERED. Parachute beacon active.`, 'alert');
    }
  };

  const handleAuthorizeDrop = () => {
    if (backendConnected && backendClientRef.current) {
      backendClientRef.current.sendAuthorizeDrop(activeDroneId);
    } else {
      setDrones(prev => prev.map(d => d.id === activeDroneId ? { ...d, phase: 'WINCH_DROP' } : d));
      addLog(`Recipient drop clearance confirmed! Lowering payload winch tether...`, 'success');
    }
  };

  const handleResetDrone = () => {
    if (backendConnected && backendClientRef.current) {
      backendClientRef.current.sendReset(activeDroneId);
    } else {
      setDrones(prev => prev.map(d => d.id === activeDroneId ? {
        ...INITIAL_DRONES.find(i => i.id === activeDroneId),
        lat: SKYPORT_COORDINATES.lat,
        lng: SKYPORT_COORDINATES.lng,
        altitudeMeters: 0,
        speedKmh: 0,
        battery: 98,
        phase: 'IDLE',
        progress: 0,
        tetherLengthM: 0
      } : d));
      addLog(`${activeDrone.callsign} reset to SkyPort Launch Pad.`, 'info');
    }
  };

  const handleDispatchEcommerceOrder = (newOrder) => {
    if (backendConnected && backendClientRef.current) {
      backendClientRef.current.dispatchEcommerceOrder(newOrder);
    } else {
      const freeDrone = drones.find(d => d.phase === 'IDLE' || d.phase === 'DELIVERED');
      if (freeDrone) {
        setDrones(prev => prev.map(d => d.id === freeDrone.id ? {
          ...d,
          order: newOrder,
          phase: 'TAKEOFF',
          progress: 5,
          isCharging: false,
          lat: SKYPORT_COORDINATES.lat,
          lng: SKYPORT_COORDINATES.lng,
          altitudeMeters: 0,
          speedKmh: 0,
          battery: Math.max(80, d.battery)
        } : d));
        addLog(`E-Commerce Order (${newOrder.orderId}) dispatched to ${freeDrone.callsign}!`, 'success');
      } else {
        setOrderQueue(prev => [...prev, newOrder]);
        addLog(`All drones airborne. Order (${newOrder.orderId}) queued for next available launch pad.`, 'info');
      }
    }
  };

  const handleSimulateBatch = async () => {
    if (backendConnected && backendClientRef.current) {
      await backendClientRef.current.simulateBatchOrders();
    } else {
      const sampleOrders = [
        {
          orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}-EMERG`,
          recipient: "Dr. Kojo Boateng (37 Military Hospital)",
          address: "Liberation Road, Neghelli Wing, Accra",
          item: "Automated External Defibrillator & Adrenaline",
          weightKg: 1.8,
          lat: 5.5890,
          lng: -0.1830,
          dropZoneType: "Emergency Heli-Pad Dock"
        },
        {
          orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}-TECH`,
          recipient: "Abena Osei (Cantonments Embassy Hub)",
          address: "8 Switchback Road, Cantonments, Accra",
          item: "Flagship Drone Sensor & Battery Spares",
          weightKg: 1.2,
          lat: 5.5800,
          lng: -0.1780,
          dropZoneType: "Rooftop Helipad"
        },
        {
          orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}-MED`,
          recipient: "Kwame Mensah (Residential Courtyard)",
          address: "14 Lagos Avenue, East Legon, Accra",
          item: "Insulated Vaccine Cooler Box",
          weightKg: 2.1,
          lat: 5.6360,
          lng: -0.1550,
          dropZoneType: "Residential Courtyard"
        }
      ];

      setDrones(prev => prev.map((drone, idx) => ({
        ...drone,
        order: sampleOrders[idx % sampleOrders.length],
        phase: 'TAKEOFF',
        progress: 5,
        isCharging: false,
        lat: SKYPORT_COORDINATES.lat,
        lng: SKYPORT_COORDINATES.lng,
        altitudeMeters: 0,
        speedKmh: 0
      })));
      addLog('Batch Fleet Dispatch: All 3 drones launched concurrently on Accra flight corridors!', 'success');
    }
  };

  const handleEnqueueOrder = (customOrder) => {
    const newOrder = customOrder || {
      orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}-PRIO`,
      recipient: "Ridge Hospital Trauma Care Unit",
      address: "Castle Road, Ridge, Accra, Ghana",
      item: "Emergency Cold-Chain Plasma Units",
      weightKg: 1.6,
      lat: 5.5580,
      lng: -0.1980,
      dropZoneType: "Hospital Emergency Pad"
    };
    setOrderQueue(prev => [...prev, newOrder]);
    addLog(`Order ${newOrder.orderId} enqueued in Autonomous Dispatch Queue.`, 'info');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        droneStatus={activeDrone.phase}
        activeDrone={activeDrone}
      />

      {/* Backend Synchronization Indicator Bar */}
      <div style={{
        background: backendConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
        borderBottom: `1px solid ${backendConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
        padding: '3px 16px',
        fontSize: '0.68rem',
        fontFamily: 'var(--font-mono)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: backendConnected ? '#6ee7b7' : '#fbbf24'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: backendConnected ? '#10b981' : '#f59e0b',
            boxShadow: `0 0 6px ${backendConnected ? '#10b981' : '#f59e0b'}`
          }}></span>
          <span>
            {backendConnected
              ? `BACKEND LIVE: Node.js + Express + WebSockets (Port 3001) | ${mongoConnected ? '🍃 MongoDB Database Connected' : '⚠️ MongoDB In-Memory Fallback'}`
              : 'BACKEND OFFLINE: Running Client-Side Fallback Simulator (Start server with: npm run dev)'}
          </span>
        </div>
        <span>DB: {mongoConnected ? 'mongodb://127.0.0.1:27017' : 'In-Memory'} · API: :3001</span>
      </div>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentView === 'mission_control' && (
          <FleetMissionControl
            drones={drones}
            activeDroneId={activeDroneId}
            setActiveDroneId={setActiveDroneId}
            onLaunchMission={handleLaunchMission}
            onHoldMission={handleHoldMission}
            onReturnToHome={handleReturnToHome}
            onEmergencyAbort={handleEmergencyAbort}
            onResetDrone={handleResetDrone}
            flightPath={flightPath}
            flightLogs={flightLogs}
            orderQueue={orderQueue}
            onSimulateBatch={handleSimulateBatch}
            onEnqueueOrder={handleEnqueueOrder}
          />
        )}

        {currentView === 'customer_view' && (
          <CustomerLiveTracker
            drone={activeDrone}
            onAuthorizeDrop={handleAuthorizeDrop}
            onResetMission={handleResetDrone}
          />
        )}

        {currentView === 'ecommerce_store' && (
          <EcommerceStoreSimulator
            onDispatchOrder={handleDispatchEcommerceOrder}
            onSwitchView={setCurrentView}
          />
        )}

        {currentView === 'analytics' && (
          <FleetAnalytics
            drones={drones}
            flightLogs={flightLogs}
          />
        )}
      </main>
    </div>
  );
}
