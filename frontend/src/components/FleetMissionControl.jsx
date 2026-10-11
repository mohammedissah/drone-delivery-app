import React, { useState } from 'react';
import { 
  Play, Pause, Home, AlertOctagon, ShieldAlert, Wind, BatteryCharging, 
  Satellite, Compass, Gauge, Radio, Package, Navigation, Layers, RefreshCw,
  Zap, Plus, CheckCircle2, Clock
} from 'lucide-react';
import FlightRadarMap from './FlightRadarMap';
import AttitudeIndicator from './AttitudeIndicator';
import DroneCameraFPV from './DroneCameraFPV';
import { sounds } from '../utils/soundEffects';

export default function FleetMissionControl({
  drones,
  activeDroneId,
  setActiveDroneId,
  onLaunchMission,
  onHoldMission,
  onReturnToHome,
  onEmergencyAbort,
  onResetDrone,
  flightPath,
  flightLogs,
  orderQueue = [],
  onSimulateBatch,
  onEnqueueOrder
}) {
  const [followDrone, setFollowDrone] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState('avionics'); // 'avionics' | 'queue_docks'
  const activeDrone = drones.find(d => d.id === activeDroneId) || drones[0];
  const otherDrones = drones.filter(d => d.id !== activeDroneId);

  const getStatusBadge = (phase) => {
    switch (phase) {
      case 'EN_ROUTE':
        return <span className="badge-status badge-active"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'radar-pulse 1.5s infinite' }}></span>EN ROUTE</span>;
      case 'TAKEOFF':
        return <span className="badge-status badge-info">TAKEOFF ASCENT</span>;
      case 'HOVER_DROPZONE':
      case 'WINCH_DROP':
        return <span className="badge-status badge-warning">DELIVERY DROP</span>;
      case 'RETURN_TO_HOME':
        return <span className="badge-status badge-info">RETURNING (RTH)</span>;
      case 'PACKAGE_RELEASED':
        return <span className="badge-status badge-active">PAYLOAD RELEASED</span>;
      case 'HOLD':
        return <span className="badge-status badge-warning">HOVER HOLD</span>;
      case 'ABORT':
        return <span className="badge-status badge-danger">MISSION ABORTED</span>;
      default:
        return <span className="badge-status" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>STANDBY PAD</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Top Fleet Selector Bar */}
      <div style={{
        background: 'rgba(10, 16, 26, 0.95)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        {/* Drone Fleet Tabs */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em' }}>
            FLEET ASSETS:
          </span>
          {drones.map(drone => {
            const isSelected = drone.id === activeDrone.id;
            return (
              <button
                key={drone.id}
                onClick={() => {
                  setActiveDroneId(drone.id);
                  sounds.playRadarPing();
                }}
                style={{
                  background: isSelected ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 6,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                  color: isSelected ? '#00f2fe' : 'var(--text-muted)'
                }}
              >
                <Radio size={12} color={isSelected ? '#00f2fe' : '#64748b'} />
                <span style={{ fontWeight: 600, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  {drone.callsign} ({drone.id})
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: drone.isCharging ? 'rgba(245, 158, 11, 0.2)' : drone.phase === 'EN_ROUTE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  color: drone.isCharging ? '#fbbf24' : drone.phase === 'EN_ROUTE' ? '#10b981' : 'var(--text-dim)'
                }}>
                  {drone.isCharging ? `⚡${drone.battery}%` : `${drone.battery}%`}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => {
              if (onSimulateBatch) onSimulateBatch();
              sounds.playLaunch();
            }}
            className="btn-aerospace"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(16, 185, 129, 0.2))',
              border: '1px solid #00f2fe',
              color: '#00f2fe',
              padding: '5px 12px',
              fontSize: '0.73rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 0 10px rgba(0, 242, 254, 0.25)',
              marginLeft: 4
            }}
            title="Simultaneously launch all 3 drones with distinct customer orders"
          >
            <Zap size={13} color="#00f2fe" />
            <span>BATCH LAUNCH (3 DRONES)</span>
          </button>
        </div>

        {/* Global Airspace Telemetry Indicators */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Wind size={13} color="#38bdf8" />
            <span>WIND: <strong style={{ color: '#38bdf8' }}>12 km/h NW</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Satellite size={13} color="#10b981" />
            <span>GNSS RTK: <strong style={{ color: '#10b981' }}>22 SATS (LOCKED)</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <ShieldAlert size={13} color="#00f2fe" />
            <span>GEOFENCE: <strong style={{ color: '#00f2fe' }}>CLEARED</strong></span>
          </div>
        </div>
      </div>

      {/* Main Mission Control Workstation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', flex: 1, overflow: 'hidden' }}>
        {/* Left Column: Tactical Map + Flight Event Console */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
          {/* Map Container */}
          <div style={{ flex: 1, position: 'relative' }}>
            <FlightRadarMap
              activeDrone={activeDrone}
              otherDrones={otherDrones}
              flightPath={flightPath}
              customerTarget={activeDrone.order}
              followDrone={followDrone}
            />

            {/* Quick Map Floating Controls */}
            <div style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              zIndex: 500,
              display: 'flex',
              gap: 8
            }}>
              <button
                onClick={() => setFollowDrone(!followDrone)}
                className="btn-aerospace"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.72rem',
                  background: followDrone ? 'rgba(0, 242, 254, 0.25)' : 'rgba(15, 23, 42, 0.85)'
                }}
              >
                <Navigation size={12} />
                {followDrone ? 'CAMERA: LOCKED TO DRONE' : 'CAMERA: FREE PAN'}
              </button>
            </div>
          </div>

          {/* Bottom Flight Telemetry Event Log */}
          <div style={{
            height: 110,
            background: 'rgba(6, 10, 16, 0.95)',
            borderTop: '1px solid var(--border-subtle)',
            padding: '8px 16px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            flexShrink: 0
          }}>
            <div style={{ color: 'var(--text-dim)', marginBottom: 4, fontWeight: 700, letterSpacing: '0.05em' }}>
              AUTONOMOUS MISSION LOG // MAVLINK TELEMETRY STREAM:
            </div>
            {flightLogs.map((log, idx) => (
              <div key={idx} style={{ color: log.type === 'alert' ? '#fb7185' : log.type === 'success' ? '#34d399' : '#94a3b8', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--text-dim)' }}>[{log.timestamp}]</span> {log.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Avionics, Gimbal Camera & Emergency Commands */}
        <div style={{
          background: 'rgba(8, 14, 24, 0.95)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '12px 14px',
          gap: 12
        }}>
          {/* Workstation Sub-panel Switcher */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: 3,
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            flexShrink: 0
          }}>
            <button
              onClick={() => {
                setRightPanelTab('avionics');
                sounds.playRadarPing();
              }}
              style={{
                padding: '6px 8px',
                borderRadius: 6,
                border: 'none',
                background: rightPanelTab === 'avionics' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                color: rightPanelTab === 'avionics' ? '#00f2fe' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s ease'
              }}
            >
              <Gauge size={13} />
              AVIONICS & FPV
            </button>
            <button
              onClick={() => {
                setRightPanelTab('queue_docks');
                sounds.playRadarPing();
              }}
              style={{
                padding: '6px 8px',
                borderRadius: 6,
                border: 'none',
                background: rightPanelTab === 'queue_docks' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: rightPanelTab === 'queue_docks' ? '#10b981' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s ease'
              }}
            >
              <BatteryCharging size={13} />
              DOCKS & QUEUE ({orderQueue.length})
            </button>
          </div>

          {rightPanelTab === 'avionics' ? (
            <>
              {/* Drone Header Card */}
              <div className="glass-panel" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                      {activeDrone.callsign}
                    </h2>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {activeDrone.model} · ID: {activeDrone.id}
                    </span>
                  </div>
                  {getStatusBadge(activeDrone.phase)}
                </div>

                {/* Mission Progress Bar */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>MISSION TRAJECTORY</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#00f2fe' }}>{activeDrone.progress.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${activeDrone.progress}%`,
                      background: 'linear-gradient(90deg, #00f2fe, #10b981)',
                      borderRadius: 3,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* FPV Camera Downlink */}
              <DroneCameraFPV drone={activeDrone} />

              {/* Artificial Horizon (Attitude Indicator) & Avionics */}
              <div className="glass-panel" style={{ padding: '12px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: 8 }}>
                  AVIONICS & ATTITUDE INDICATOR
                </div>

                <AttitudeIndicator
                  pitch={activeDrone.pitchDeg}
                  roll={activeDrone.rollDeg}
                  heading={activeDrone.headingDeg}
                  altitude={activeDrone.altitudeMeters}
                  speed={activeDrone.speedKmh}
                />

                {/* Primary Flight Telemetry Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                  marginTop: 10,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem', display: 'block' }}>ALTITUDE (AGL)</span>
                    <strong style={{ color: '#00f2fe', fontSize: '0.95rem' }}>{activeDrone.altitudeMeters.toFixed(1)} m</strong>
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem', display: 'block' }}>AIRSPEED</span>
                    <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>{activeDrone.speedKmh.toFixed(1)} km/h</strong>
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem', display: 'block' }}>BATTERY LEVEL</span>
                    <strong style={{ color: activeDrone.battery > 30 ? '#10b981' : '#f59e0b', fontSize: '0.95rem' }}>
                      {activeDrone.battery}% ({activeDrone.voltage.toFixed(1)}V)
                    </strong>
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem', display: 'block' }}>TETHER WINCH</span>
                    <strong style={{ color: '#f59e0b', fontSize: '0.95rem' }}>{activeDrone.tetherLengthM.toFixed(1)} m</strong>
                  </div>
                </div>
              </div>

              {/* Current Payload / Order Card */}
              <div className="glass-panel" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: 6 }}>
                  <Package size={14} color="#00f2fe" />
                  PAYLOAD BAY STATUS: SECURED
                </div>
                <div style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>
                  {activeDrone.order?.item || 'Emergency Medical Supplies'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Weight: <strong style={{ color: '#38bdf8' }}>{activeDrone.order?.weightKg || 1.45} kg</strong> · Drop: {activeDrone.order?.dropZoneType || 'Backyard Lawn'}
                </div>
              </div>

              {/* Autonomous Flight Command Actions */}
              <div className="glass-panel" style={{ padding: '12px', marginTop: 'auto' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: 8 }}>
                  AUTONOMOUS FLIGHT CONTROLS
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {activeDrone.phase === 'IDLE' || activeDrone.phase === 'HOLD' || activeDrone.phase === 'LANDED' ? (
                    <button
                      onClick={() => {
                        onLaunchMission();
                        sounds.playLaunch();
                      }}
                      className="btn-aerospace btn-success"
                      style={{ gridColumn: 'span 2', padding: '10px', justifyContent: 'center' }}
                    >
                      <Play size={16} /> AUTHORIZE & LAUNCH FLIGHT
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onHoldMission();
                        sounds.playWarning();
                      }}
                      className="btn-aerospace"
                      style={{
                        padding: '10px',
                        justifyContent: 'center',
                        background: 'rgba(245, 158, 11, 0.2)',
                        borderColor: '#f59e0b',
                        color: '#fbbf24'
                      }}
                    >
                      <Pause size={16} /> HOLD IN PLACE
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onReturnToHome();
                      sounds.playWarning();
                    }}
                    className="btn-aerospace"
                    style={{ padding: '10px', justifyContent: 'center', fontSize: '0.75rem' }}
                  >
                    <Home size={15} /> RETURN TO BASE (RTH)
                  </button>

                  <button
                    onClick={() => {
                      onEmergencyAbort();
                      sounds.playWarning();
                    }}
                    className="btn-aerospace btn-danger"
                    style={{ padding: '10px', justifyContent: 'center', fontSize: '0.75rem' }}
                  >
                    <AlertOctagon size={15} /> EMERGENCY ABORT
                  </button>
                </div>

                {/* Reset / Simulate New Delivery */}
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  <button
                    onClick={onResetDrone}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <RefreshCw size={12} /> Reset to Launch Pad Alpha
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* TAB: CHARGING DOCKS & QUEUE */
            <>
              {/* Induction Charging Pads Header & Status */}
              <div className="glass-panel" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BatteryCharging size={14} color="#10b981" />
                    INDUCTION CHARGING DOCKS (3 PADS)
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    SOLAR GRID: 12.4 kW
                  </span>
                </div>

                {/* Pad Cards List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {drones.map(d => {
                    const isCurActive = d.id === activeDrone.id;
                    const isCharging = d.isCharging || (d.battery < 100 && (d.phase === 'IDLE' || d.phase === 'DELIVERED'));
                    return (
                      <div
                        key={d.id}
                        style={{
                          background: isCurActive ? 'rgba(0, 242, 254, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                          border: isCurActive ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid var(--border-subtle)',
                          borderRadius: 6,
                          padding: '8px 10px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#ffffff' }}>
                              {d.dockPad || (d.id === 'AERO-X1' ? 'PAD-ALPHA' : d.id === 'AERO-X2' ? 'PAD-BRAVO' : 'PAD-GAMMA')}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                              · {d.callsign}
                            </span>
                          </div>
                          {isCharging ? (
                            <span className="badge-status badge-warning" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                              <Zap size={9} style={{ display: 'inline', marginRight: 2 }} /> CHARGING (+0.35%/s)
                            </span>
                          ) : d.phase === 'EN_ROUTE' ? (
                            <span className="badge-status badge-active" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                              AIRBORNE
                            </span>
                          ) : (
                            <span className="badge-status badge-info" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                              STANDBY (100%)
                            </span>
                          )}
                        </div>

                        {/* Battery bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                          <span>Charge: {d.battery}% ({d.voltage}V)</span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{d.speedKmh > 0 ? `${d.speedKmh.toFixed(0)} km/h` : '3.8 kW Inductive'}</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${d.battery}%`,
                            background: isCharging ? 'linear-gradient(90deg, #f59e0b, #10b981)' : d.battery > 40 ? '#10b981' : '#f43f5e',
                            borderRadius: 2,
                            transition: 'width 0.3s ease'
                          }} />
                        </div>

                        {/* Select / Switch */}
                        {!isCurActive && (
                          <div style={{ marginTop: 6, textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                setActiveDroneId(d.id);
                                sounds.playRadarPing();
                              }}
                              style={{
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'var(--text-muted)',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: '0.65rem',
                                cursor: 'pointer'
                              }}
                            >
                              Inspect Drone Telemetry →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Autonomous Order Dispatch Queue */}
              <div className="glass-panel" style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package size={14} color="#00f2fe" />
                    AUTONOMOUS DISPATCH QUEUE ({orderQueue.length})
                  </div>
                  <button
                    onClick={() => {
                      if (onEnqueueOrder) onEnqueueOrder();
                      sounds.playRadarPing();
                    }}
                    className="btn-aerospace"
                    style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                    title="Add urgent delivery order to queue"
                  >
                    <Plus size={11} /> ENQUEUE ORDER
                  </button>
                </div>

                {/* Queue List */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {orderQueue.length === 0 ? (
                    <div style={{
                      padding: '16px 12px',
                      textAlign: 'center',
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      borderRadius: 6,
                      color: 'var(--text-dim)',
                      fontSize: '0.72rem'
                    }}>
                      <Clock size={18} color="#64748b" style={{ margin: '0 auto 6px', display: 'block' }} />
                      Queue is currently empty.
                      <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                        Incoming orders will queue here when all launch pads are airborne.
                      </div>
                    </div>
                  ) : (
                    orderQueue.map((item, idx) => (
                      <div
                        key={item.orderId || idx}
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 6,
                          padding: '8px 10px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#00f2fe', fontWeight: 700 }}>
                            #{idx + 1} · {item.orderId}
                          </span>
                          <span style={{ fontSize: '0.62rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '1px 5px', borderRadius: 3 }}>
                            PRIORITY QUEUED
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: 600 }}>
                          {item.item}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                          {item.recipient} ({item.weightKg} kg) · {item.dropZoneType || 'Backyard'}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Batch Trigger Button */}
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => {
                      if (onSimulateBatch) onSimulateBatch();
                      sounds.playLaunch();
                    }}
                    className="btn-aerospace btn-success"
                    style={{ width: '100%', padding: '10px', justifyContent: 'center', fontSize: '0.75rem' }}
                  >
                    <Zap size={14} /> LAUNCH ALL 3 DRONES (BATCH FLEET)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
