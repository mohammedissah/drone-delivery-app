import React, { useState, useEffect } from 'react';
import { Plane, Radio, Smartphone, ShoppingBag, BarChart3, Volume2, VolumeX, ShieldCheck, Zap } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function Navbar({ currentView, setCurrentView, droneStatus, activeDrone }) {
  const [time, setTime] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().slice(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const newState = sounds.toggleSound();
    setSoundEnabled(newState);
    if (newState) {
      sounds.playRadarPing();
    }
  };

  return (
    <header style={{
      background: 'rgba(7, 11, 18, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      {/* Brand & Callout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(99, 102, 241, 0.2))',
          border: '1px solid var(--border-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)'
        }}>
          <Plane size={22} color="#00f2fe" style={{ transform: 'rotate(-45deg)' }} />
        </div>

        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.15rem',
            letterSpacing: '0.04em',
            background: 'linear-gradient(90deg, #ffffff, #00f2fe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            AERODROP
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(0, 242, 254, 0.15)',
              color: '#00f2fe',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              WebkitTextFillColor: '#00f2fe'
            }}>
              AUTONOMOUS v2.4
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
            NEXT-GEN E-COMMERCE DRONE LOGISTICS
          </div>
        </div>
      </div>

      {/* Main View Switcher Tabs */}
      <nav style={{
        display: 'flex',
        background: 'rgba(12, 20, 32, 0.8)',
        padding: '4px',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)',
        gap: 4
      }}>
        <button
          onClick={() => {
            setCurrentView('mission_control');
            sounds.playRadarPing();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: currentView === 'mission_control' ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.25), rgba(56, 189, 248, 0.1))' : 'transparent',
            color: currentView === 'mission_control' ? '#00f2fe' : 'var(--text-muted)',
            boxShadow: currentView === 'mission_control' ? 'var(--glow-cyan)' : 'none'
          }}
        >
          <Radio size={16} />
          <span>Fleet Mission Control</span>
          <span style={{
            fontSize: '0.65rem',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            padding: '1px 5px',
            borderRadius: 9999
          }}>LIVE</span>
        </button>

        <button
          onClick={() => {
            setCurrentView('customer_view');
            sounds.playRadarPing();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: currentView === 'customer_view' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.1))' : 'transparent',
            color: currentView === 'customer_view' ? '#a5b4fc' : 'var(--text-muted)',
            boxShadow: currentView === 'customer_view' ? '0 0 15px rgba(99, 102, 241, 0.35)' : 'none'
          }}
        >
          <Smartphone size={16} />
          <span>Customer Live Radar</span>
        </button>

        <button
          onClick={() => {
            setCurrentView('ecommerce_store');
            sounds.playRadarPing();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: currentView === 'ecommerce_store' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.1))' : 'transparent',
            color: currentView === 'ecommerce_store' ? '#6ee7b7' : 'var(--text-muted)',
            boxShadow: currentView === 'ecommerce_store' ? 'var(--glow-emerald)' : 'none'
          }}
        >
          <ShoppingBag size={16} />
          <span>E-Commerce Storefront</span>
        </button>

        <button
          onClick={() => {
            setCurrentView('analytics');
            sounds.playRadarPing();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: currentView === 'analytics' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.1))' : 'transparent',
            color: currentView === 'analytics' ? '#fbbf24' : 'var(--text-muted)',
            boxShadow: currentView === 'analytics' ? '0 0 15px rgba(245, 158, 11, 0.35)' : 'none'
          }}
        >
          <BarChart3 size={16} />
          <span>Fleet Analytics & ESG</span>
        </button>
      </nav>

      {/* Telemetry Status & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* GNSS Link */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid var(--border-subtle)'
        }}>
          <Zap size={14} color="#10b981" />
          <span>RTK FIX: <strong style={{ color: '#10b981' }}>±1.5cm</strong></span>
        </div>

        {/* UTC Clock */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--accent-cyan)',
          letterSpacing: '0.05em',
          background: 'rgba(0, 242, 254, 0.08)',
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid rgba(0, 242, 254, 0.2)'
        }}>
          {time || '00:00:00 UTC'}
        </div>

        {/* Audio Mute/Unmute */}
        <button
          onClick={handleToggleSound}
          title={soundEnabled ? 'Mute HUD Audio' : 'Enable HUD Audio'}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            padding: 6,
            cursor: 'pointer',
            color: soundEnabled ? 'var(--accent-cyan)' : 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>
    </header>
  );
}
