import React, { useState, useEffect } from 'react';
import { 
  Package, MapPin, ShieldCheck, CheckCircle2, Clock, AlertTriangle, 
  ArrowDownCircle, Sparkles, Navigation, Phone, Check, RefreshCw, Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import FlightRadarMap from './FlightRadarMap';
import { generateFlightPath, SKYPORT_COORDINATES, calculateDistanceMeters } from '../utils/droneSimulator';
import { sounds } from '../utils/soundEffects';

export default function CustomerLiveTracker({ drone, onAuthorizeDrop, onResetMission }) {
  const [selectedZone, setSelectedZone] = useState('Backyard Lawn');
  const [safetyChecks, setSafetyChecks] = useState({
    petsInside: true,
    clearPerimeter: true,
    noWires: true
  });

  const target = drone.order || {
    lat: 37.7865,
    lng: -122.4055,
    address: '742 Evergreen Terr, Sector 4',
    recipient: 'Elena Rostova',
    orderId: 'ORD-9482-EXP',
    item: 'Emergency Medical Kit',
    weightKg: 1.45,
    dropZoneType: selectedZone
  };

  const flightPath = generateFlightPath(SKYPORT_COORDINATES, target);
  const distToCustomer = calculateDistanceMeters(drone.lat, drone.lng, target.lat, target.lng);

  // Confetti trigger upon successful delivery
  useEffect(() => {
    if (drone.phase === 'PACKAGE_RELEASED' || drone.phase === 'DELIVERED') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      sounds.playDeliverySuccess();
    }
  }, [drone.phase]);

  const toggleSafetyCheck = (key) => {
    setSafetyChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allSafetyPassed = safetyChecks.petsInside && safetyChecks.clearPerimeter && safetyChecks.noWires;

  const getPhaseDisplay = () => {
    switch (drone.phase) {
      case 'IDLE':
        return { title: 'Order Awaiting Dispatch', subtitle: 'Drone payload bay loading at SkyPort Alpha', step: 1 };
      case 'TAKEOFF':
        return { title: 'Drone Airborne', subtitle: 'Ascending to 65m cruising flight corridor', step: 2 };
      case 'EN_ROUTE':
        return { title: 'Drone En Route to You', subtitle: `Cruising at ${drone.speedKmh.toFixed(0)} km/h · ETA ~3 mins`, step: 3 };
      case 'HOVER_DROPZONE':
        return { title: 'Arrived at Your Location!', subtitle: 'Hovering 25m overhead · Scanning drop zone', step: 4 };
      case 'WINCH_DROP':
        return { title: 'Descending Tether Winch', subtitle: `Package lowering slowly · Tether: ${drone.tetherLengthM.toFixed(1)}m`, step: 4 };
      case 'PACKAGE_RELEASED':
      case 'WINCH_RETRACT':
        return { title: 'Package Delivered Safely!', subtitle: 'Tether released · Drone returning to base', step: 5 };
      case 'RETURN_TO_HOME':
      case 'DELIVERED':
        return { title: 'Delivery Completed!', subtitle: 'Thank you for choosing autonomous drone delivery!', step: 5 };
      default:
        return { title: 'Autonomous Flight Active', subtitle: 'Monitoring live telemetry', step: 3 };
    }
  };

  const phaseInfo = getPhaseDisplay();

  return (
    <div style={{
      maxWidth: 820,
      margin: '0 auto',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }}>
      {/* Top Welcome & Delivery Status Banner */}
      <div className="glass-panel-glow" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge-status badge-active">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'radar-pulse 1.5s infinite' }}></span>
              LIVE AIRSPACE RADAR
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {target.orderId}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
            <Clock size={14} />
            <span>ETA: <strong>{drone.phase === 'DELIVERED' || drone.phase === 'PACKAGE_RELEASED' ? '00:00' : '02:45'}</strong></span>
          </div>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem',
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: 4
        }}>
          {phaseInfo.title}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {phaseInfo.subtitle}
        </p>

        {/* Real-time Altitude & Speed HUD Bar */}
        <div style={{
          marginTop: 16,
          padding: '10px 14px',
          background: 'rgba(6, 10, 18, 0.7)',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem'
        }}>
          <div>
            <div style={{ color: 'var(--text-dim)' }}>DRONE ALTITUDE</div>
            <div style={{ color: '#00f2fe', fontSize: '1rem', fontWeight: 700 }}>
              {drone.altitudeMeters.toFixed(1)} m
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-dim)' }}>GROUND SPEED</div>
            <div style={{ color: '#38bdf8', fontSize: '1rem', fontWeight: 700 }}>
              {drone.speedKmh.toFixed(1)} km/h
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-dim)' }}>DISTANCE TO YOU</div>
            <div style={{ color: '#a5b4fc', fontSize: '1rem', fontWeight: 700 }}>
              {distToCustomer > 1000 ? `${(distToCustomer / 1000).toFixed(2)} km` : `${distToCustomer.toFixed(0)} m`}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-dim)' }}>PAYLOAD STATUS</div>
            <div style={{ color: drone.phase === 'PACKAGE_RELEASED' ? '#10b981' : '#f59e0b', fontSize: '0.9rem', fontWeight: 700 }}>
              {drone.phase === 'PACKAGE_RELEASED' || drone.phase === 'DELIVERED' ? 'RELEASED' : 'SECURED'}
            </div>
          </div>
        </div>
      </div>

      {/* EMBEDDED LIVE TRACKING MAP */}
      <div className="glass-panel" style={{ overflow: 'hidden', borderRadius: 12, border: '1px solid var(--border-glow)' }}>
        <div style={{
          padding: '10px 16px',
          background: 'rgba(10, 16, 26, 0.9)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#ffffff' }}>
            <MapPin size={16} color="#00f2fe" />
            <span>LIVE FLIGHT MAP // REAL-TIME COURIER POSITION</span>
          </div>
          <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
            ● SATELLITE GPS ACTIVE
          </span>
        </div>

        {/* 360px Interactive Map */}
        <div style={{ height: 360, position: 'relative' }}>
          <FlightRadarMap
            activeDrone={drone}
            flightPath={flightPath}
            customerTarget={target}
            followDrone={true}
            height="100%"
          />
        </div>
      </div>

      {/* Visual Delivery Stepper */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <h2 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          Flight Progress Timeline
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { step: 1, title: 'Package Securely Loaded at SkyPort Hub', desc: 'Weight verified (1.45 kg) & smart-lock engaged' },
            { step: 2, title: 'Autonomous Airspace Clearance', desc: 'FAA Geofence route approved via 5G satellite' },
            { step: 3, title: 'Airborne High-Speed Cruise', desc: 'Hexacopter cruising 65m above traffic' },
            { step: 4, title: 'Precision Tether Descent', desc: 'Whisper-quiet electric winch lowering package' },
            { step: 5, title: 'Touchdown & Contactless Release', desc: 'Sensors detect ground contact & auto-release' }
          ].map((item) => {
            const isCompleted = phaseInfo.step > item.step;
            const isCurrent = phaseInfo.step === item.step;

            return (
              <div key={item.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: isCompleted ? '#10b981' : isCurrent ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: isCompleted ? '2px solid #10b981' : isCurrent ? '2px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isCompleted ? '#060a12' : isCurrent ? '#00f2fe' : 'var(--text-dim)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  boxShadow: isCurrent ? '0 0 10px rgba(0, 242, 254, 0.4)' : 'none',
                  flexShrink: 0
                }}>
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : item.step}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: isCurrent ? '#00f2fe' : isCompleted ? '#ffffff' : 'var(--text-dim)'
                  }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: isCurrent ? 'var(--text-muted)' : 'var(--text-dim)' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Package Information Card */}
      <div className="glass-panel" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Package size={20} color="#00f2fe" />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>Package & Delivery Details</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          fontSize: '0.8rem',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 12
        }}>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block' }}>RECIPIENT</span>
            <strong style={{ color: '#ffffff' }}>{target.recipient}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block' }}>DELIVERY ADDRESS</span>
            <strong style={{ color: '#ffffff' }}>{target.address}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block' }}>ITEM CONTENTS</span>
            <strong style={{ color: '#38bdf8' }}>{target.item}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block' }}>PAYLOAD WEIGHT</span>
            <strong style={{ color: '#ffffff' }}>{target.weightKg} kg</strong>
          </div>
        </div>
      </div>

      {/* Drop Zone Location Selector */}
      <div className="glass-panel" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color="#10b981" />
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>Designated Drop Spot</h2>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: 6 }}>
            GPS TARGET ACTIVE
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { id: 'Backyard Lawn', label: 'Backyard Lawn', desc: 'Soft turf · 4m clear' },
            { id: 'Driveway Pad', label: 'Driveway Pad', desc: 'Paved flat ground' },
            { id: 'Rooftop Deck', label: 'Rooftop Deck', desc: 'Direct sky view' }
          ].map(spot => (
            <button
              key={spot.id}
              onClick={() => setSelectedZone(spot.id)}
              style={{
                background: selectedZone === spot.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                border: selectedZone === spot.id ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: '10px 8px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: selectedZone === spot.id ? '#6ee7b7' : '#ffffff' }}>
                {spot.label}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 2 }}>
                {spot.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Safety Checklist Before Drop */}
      <div className="glass-panel" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ShieldCheck size={18} color="#f59e0b" />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>Autonomous Drop Safety Checklist</h2>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          Please confirm your landing area is clear to authorize automatic winch package delivery:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { key: 'petsInside', text: 'Pets and children are safely indoors' },
            { key: 'clearPerimeter', text: '3-meter radius around drop zone is free of obstacles' },
            { key: 'noWires', text: 'No overhead branches, power cables, or clotheslines' }
          ].map(check => (
            <label
              key={check.key}
              onClick={() => toggleSafetyCheck(check.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: safetyChecks[check.key] ? '#f1f5f9' : 'var(--text-dim)'
              }}
            >
              <input
                type="checkbox"
                checked={safetyChecks[check.key]}
                onChange={() => {}}
                style={{ accentColor: '#10b981', width: 16, height: 16 }}
              />
              <span>{check.text}</span>
            </label>
          ))}
        </div>

        {/* Winch Release Button when in delivery phase */}
        {(drone.phase === 'HOVER_DROPZONE' || drone.phase === 'WINCH_DROP') && (
          <div style={{ marginTop: 18 }}>
            <button
              onClick={() => {
                if (onAuthorizeDrop) {
                  onAuthorizeDrop();
                  sounds.playWinch();
                }
              }}
              disabled={!allSafetyPassed}
              className="btn-aerospace btn-success"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.95rem',
                justifyContent: 'center',
                boxShadow: 'var(--glow-emerald)',
                opacity: allSafetyPassed ? 1 : 0.5,
                cursor: allSafetyPassed ? 'pointer' : 'not-allowed'
              }}
            >
              <ArrowDownCircle size={20} />
              CONFIRM AREA CLEAR & RELEASE WINCH
            </button>
          </div>
        )}

        {(drone.phase === 'PACKAGE_RELEASED' || drone.phase === 'DELIVERED') && (
          <div style={{
            marginTop: 18,
            padding: 16,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <Sparkles size={28} color="#10b981" style={{ margin: '0 auto 8px' }} />
            <h3 style={{ color: '#6ee7b7', fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 4 }}>
              DELIVERY CONFIRMED!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 12 }}>
              Your parcel was delivered safely via autonomous tether winch. You may now retrieve your package!
            </p>
            <button
              onClick={onResetMission}
              className="btn-aerospace"
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              <RefreshCw size={14} /> Simulate Another Delivery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
