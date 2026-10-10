import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import FleetMissionControl from './components/FleetMissionControl';
import CustomerLiveTracker from './components/CustomerLiveTracker';
import EcommerceStoreSimulator from './components/EcommerceStoreSimulator';
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
  const [backendConnected, setBackendConnected] = useState(false);
  const [mongoConnected, setMongoConnected] = useState(false);
  const [flightLogs, setFlightLogs] = useState([
    { timestamp: '05:58:12 UTC', text: 'MAVLink telemetry link online via 5G satellite', type: 'info' },
    { timestamp: '05:58:18 UTC', text: 'RTK centimeter positioning fix locked (22 satellites)', type: 'info' },
    { timestamp: '05:58:24 UTC', text: 'Airspace corridor SF-ALPHA approved by FAA automated UTM', type: 'success' },
    { timestamp: '05:58:30 UTC', text: 'Hexacopter AERO-X1 initialized on SkyPort Pad 1', type: 'info' }
  ]);

  const backendClientRef = useRef(null);

  // Initialize Backend WebSocket Client
  useEffect(() => {
    const client = new DroneBackendClient(
      (message) => {
        if (message.type === 'INIT_STATE' || message.type === 'TELEMETRY_UPDATE' || message.type === 'ORDER_DISPATCHED' || message.type === 'COMMAND_ACK') {
          if (message.drones) {
            setDrones(message.drones);
          }
          if (message.flightLogs) {
            setFlightLogs(message.flightLogs);
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
          if (drone.id !== activeDroneId) return drone;

          let updated = { ...drone };

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
                addLog(`Touchdown sensor confirmed ground contact. Smart-latch released payload safely!`, 'success');
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
                addLog(`Tether fully reeled in. Initializing autonomous Return-to-Home trajectory.`, 'info');
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
                  addLog(`${drone.callsign} touchdown on SkyPort Pad Alpha. Docking with high-speed induction charger.`, 'success');
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
  }, [activeDroneId, backendConnected]);

  // Actions connecting to Backend API with fallback
  const handleLaunchMission = () => {
    if (backendConnected && backendClientRef.current) {
      backendClientRef.current.sendLaunch(activeDroneId);
    } else {
      setDrones(prev => prev.map(d => d.id === activeDroneId ? { ...d, phase: 'TAKEOFF', progress: 5, targetAltitude: 65 } : d));
      addLog(`Takeoff authorized by Operator. Ascending to 65m corridor.`, 'info');
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
      addLog(`${activeDrone.callsign} reset to SkyPort Launch Pad Alpha.`, 'info');
    }
  };

  const handleDispatchEcommerceOrder = (newOrder) => {
    if (backendConnected && backendClientRef.current) {
      backendClientRef.current.dispatchEcommerceOrder(newOrder);
    } else {
      setDrones(prev => prev.map(d => d.id === activeDroneId ? {
        ...d,
        order: newOrder,
        phase: 'TAKEOFF',
        progress: 5,
        lat: SKYPORT_COORDINATES.lat,
        lng: SKYPORT_COORDINATES.lng,
        altitudeMeters: 0,
        speedKmh: 0,
        battery: 99
      } : d));
      addLog(`New E-Commerce Order received (${newOrder.orderId})! Dispatched to flight corridor.`, 'success');
    }
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
      </main>
    </div>
  );
}
