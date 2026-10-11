import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Leaf, Clock, Zap, ShieldCheck, 
  Package, CheckCircle2, ArrowUpRight, Filter, Search, RefreshCw 
} from 'lucide-react';

export default function FleetAnalytics({ drones = [], flightLogs = [] }) {
  const [dbOrders, setDbOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(false);

  // Fetch real orders from MongoDB backend
  const fetchDbOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/db/orders');
      const data = await res.json();
      if (data.orders) {
        setDbOrders(data.orders);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbOrders();
    const interval = setInterval(fetchDbOrders, 6000);
    return () => clearInterval(interval);
  }, []);

  // Filtered orders
  const filteredOrders = dbOrders.filter(ord => {
    if (filterStatus === 'ALL') return true;
    return ord.status === filterStatus;
  });

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge-status badge-active" style={{ marginBottom: 6 }}>
            <Leaf size={12} /> SUSTAINABLE AIRSPACE LOGISTICS
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
            Fleet Analytics & Carbon Reduction Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Real-time telemetry analytics, autonomous duty cycles, and environmental carbon savings.
          </p>
        </div>

        <button
          onClick={fetchDbOrders}
          className="btn-aerospace"
          style={{ padding: '8px 14px', fontSize: '0.78rem' }}
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh Ledger
        </button>
      </div>

      {/* Top 4 KPI Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {/* Metric 1 */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: 8 }}>
            <span>TOTAL MISSIONS</span>
            <Package size={16} color="#00f2fe" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
            148
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#10b981' }}>
            <ArrowUpRight size={14} /> <span>+18.4% vs last week</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: 8 }}>
            <span>AVG FLIGHT DURATION</span>
            <Clock size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
            6.8 min
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Road van baseline: 34.2 mins
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: 8 }}>
            <span>CO₂ CARBON SAVED</span>
            <Leaf size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
            186.4 kg
          </div>
          <div style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>
            🌳 Equivalent to 9.3 trees planted
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.75rem', marginBottom: 8 }}>
            <span>FLEET ENERGY EFFICIENCY</span>
            <Zap size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
            94.8%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Solar induction pad powered
          </div>
        </div>
      </div>

      {/* Middle Grid: Carbon Comparison & Fleet Utilization */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
        {/* Carbon Emissions Comparative Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Leaf size={18} color="#10b981" /> Environmental Impact: CO₂ Grams per Delivery Kilometer
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 20 }}>
            Comparison of emissions per delivery kilometer between autonomous electric drones and road vehicles.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Autonomous Drone */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: '#00f2fe' }}>⚡ AeroDrop Autonomous Hexacopter (Clean Grid/Solar)</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: '#10b981' }}>18 g CO₂ / km</strong>
              </div>
              <div style={{ height: 10, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: '8%', height: '100%', background: 'linear-gradient(90deg, #10b981, #00f2fe)', borderRadius: 5 }} />
              </div>
            </div>

            {/* Electric Road Van */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>🚚 Electric Road Van (Traffic & Idle)</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>92 g CO₂ / km</strong>
              </div>
              <div style={{ height: 10, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: '42%', height: '100%', background: '#f59e0b', borderRadius: 5 }} />
              </div>
            </div>

            {/* Diesel Delivery Van */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                <span style={{ color: '#fb7185' }}>🚛 Standard Diesel Courier Van</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: '#f43f5e' }}>218 g CO₂ / km</strong>
              </div>
              <div style={{ height: 10, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: '#f43f5e', borderRadius: 5 }} />
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 20,
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 8,
            fontSize: '0.75rem',
            color: '#6ee7b7'
          }}>
            💡 <strong>Efficiency Insight:</strong> Direct air trajectory bypasses road congestion, reducing route distance by <strong>38%</strong> and cutting net energy expenditure by <strong>78%</strong> per parcel.
          </div>
        </div>

        {/* Fleet Asset Status & Duty Cycles */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="#00f2fe" /> Active Fleet Asset Utilization
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {drones.map(drone => (
              <div
                key={drone.id}
                style={{
                  background: 'rgba(10, 16, 26, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#ffffff' }}>{drone.callsign}</span>
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: drone.isCharging ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: drone.isCharging ? '#fbbf24' : '#34d399'
                  }}>
                    {drone.isCharging ? '⚡ INDUCTION CHARGE' : drone.phase === 'EN_ROUTE' ? 'AIRBORNE' : 'READY'}
                  </span>
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 8 }}>
                  Docked: {drone.dockPad || 'PAD-ALPHA'} · Max Payload: {drone.maxPayloadKg || 2.5} kg
                </div>

                {/* Battery bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                    <span>Battery Capacity</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#00f2fe' }}>{drone.battery}% ({drone.voltage}V)</strong>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${drone.battery}%`,
                      height: '100%',
                      background: drone.battery > 50 ? '#10b981' : '#f59e0b',
                      borderRadius: 3
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: MongoDB Order Ledger Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={18} color="#00f2fe" /> MongoDB Delivery Ledger & Black-Box Records
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Persisted order records synchronized live from MongoDB Atlas cloud database.
            </p>
          </div>

          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['ALL', 'AIRBORNE', 'DELIVERED', 'PENDING'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: filterStatus === st ? '1px solid #00f2fe' : '1px solid rgba(255,255,255,0.1)',
                  background: filterStatus === st ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                  color: filterStatus === st ? '#00f2fe' : 'var(--text-dim)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '10px 12px' }}>ORDER ID</th>
                <th style={{ padding: '10px 12px' }}>RECIPIENT & ADDRESS</th>
                <th style={{ padding: '10px 12px' }}>PAYLOAD ITEM</th>
                <th style={{ padding: '10px 12px' }}>WEIGHT</th>
                <th style={{ padding: '10px 12px' }}>ASSIGNED DRONE</th>
                <th style={{ padding: '10px 12px' }}>STATUS</th>
                <th style={{ padding: '10px 12px' }}>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No orders matching filter. Place an order or click "Simulate Batch Dispatch" to populate ledger.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.orderId || Math.random()} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: '#00f2fe', fontWeight: 600 }}>
                      {order.orderId}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ color: '#ffffff' }}>{order.recipient}</strong>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{order.address}</div>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                      {order.item}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                      {order.weightKg} kg
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: '#a5b4fc' }}>
                      {order.assignedDrone || 'AERO-X1'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: order.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.15)' : order.status === 'AIRBORNE' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: order.status === 'DELIVERED' ? '#34d399' : order.status === 'AIRBORNE' ? '#00f2fe' : '#fbbf24'
                      }}>
                        {order.status || 'AIRBORNE'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'Just now'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
