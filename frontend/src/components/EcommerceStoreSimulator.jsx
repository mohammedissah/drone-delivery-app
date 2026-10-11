import React, { useState } from 'react';
import { ShoppingBag, Zap, ShieldCheck, Truck, Plane, Sparkles, Check, ArrowRight } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

const SAMPLE_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Emergency Trauma Kit & EpiPen Auto-Injector',
    category: 'Urgent Medical',
    price: '$89.00',
    weightKg: 0.85,
    tag: 'HIGH PRIORITY',
    badgeColor: '#f43f5e',
    imageEmoji: '💊',
    description: 'Sterile hemostatic gauze, adrenaline auto-injector, automated pulse-oximeter sensor.'
  },
  {
    id: 'prod-2',
    name: 'Flagship Smartphone Pro & ANC Earbuds',
    category: 'Consumer Tech',
    price: '$999.00',
    weightKg: 1.10,
    tag: 'SECURE PIN RELEASE',
    badgeColor: '#38bdf8',
    imageEmoji: '📱',
    description: 'Next-gen flagship titanium smartphone and high-fidelity noise cancelling wireless earbuds.'
  },
  {
    id: 'prod-3',
    name: 'Artisan Cold Brew Coffee & Warm Pastry Box',
    category: 'Gourmet Express',
    price: '$24.50',
    weightKg: 0.65,
    tag: 'HOT/COLD INSULATED',
    badgeColor: '#f59e0b',
    imageEmoji: '🥐',
    description: 'Thermal-chamber insulated box delivering piping hot baked croissants and iced cold brew.'
  },
  {
    id: 'prod-4',
    name: 'Cold-Chain Diagnostic Lab Specimens',
    category: 'Medical Logistics',
    price: '$145.00',
    weightKg: 1.35,
    tag: 'TEMPERATURE LOGGED',
    badgeColor: '#10b981',
    imageEmoji: '🧪',
    description: 'Dry-ice temperature regulated bio-container with continuous digital temperature telemetry.'
  }
];

export const SAMPLE_DESTINATIONS = [
  { name: 'Kwame Mensah (East Legon Courtyard)', address: '14 Lagos Avenue, East Legon, Accra', lat: 5.6360, lng: -0.1550, type: 'Residential Courtyard' },
  { name: 'Abena Osei (Cantonments Embassy Hub)', address: '8 Switchback Road, Cantonments, Accra', lat: 5.5800, lng: -0.1780, type: 'Rooftop Helipad' },
  { name: 'Dr. Kojo Boateng (37 Military Hospital)', address: 'Liberation Road, Neghelli Wing, Accra', lat: 5.5890, lng: -0.1830, type: 'Emergency Heli-Pad Dock' }
];

export default function EcommerceStoreSimulator({ onDispatchOrder, onSwitchView }) {
  const [selectedProduct, setSelectedProduct] = useState(SAMPLE_PRODUCTS[0]);
  const [selectedDest, setSelectedDest] = useState(SAMPLE_DESTINATIONS[0]);
  const [shippingMethod, setShippingMethod] = useState('drone'); // 'drone' or 'ground'
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');

  const handleCheckout = (e) => {
    e.preventDefault();
    const newOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}-EXP`;
    setLastOrderId(newOrderId);
    setOrderPlaced(true);
    sounds.playLaunch();

    if (onDispatchOrder) {
      onDispatchOrder({
        orderId: newOrderId,
        recipient: selectedDest.name.split('(')[0].trim(),
        address: selectedDest.address,
        item: selectedProduct.name,
        weightKg: selectedProduct.weightKg,
        lat: selectedDest.lat,
        lng: selectedDest.lng,
        dropZoneType: selectedDest.type
      });
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      {/* Hero header */}
      <div className="glass-panel" style={{ padding: '24px 32px', marginBottom: 24, textAlign: 'center' }}>
        <span className="badge-status badge-info" style={{ marginBottom: 8 }}>
          <Sparkles size={12} /> E-COMMERCE CHECKOUT INTEGRATION
        </span>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: 800,
          color: '#ffffff',
          marginBottom: 8
        }}>
          Simulate Store Order to Drone Launch
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto', fontSize: '0.9rem' }}>
          Test how an online store order triggers automated flight planning, payload weight verification, and autonomous drone launch.
        </p>
      </div>

      {orderPlaced ? (
        /* Order Confirmed Screen */
        <div className="glass-panel-glow" style={{ padding: '36px', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '2px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: 'var(--glow-emerald)'
          }}>
            <Check size={32} color="#10b981" />
          </div>

          <span className="badge-status badge-active" style={{ marginBottom: 12 }}>
            ORDER DISPATCHED TO AIRSPACE
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#ffffff', marginBottom: 6 }}>
            Drone Mission Initialized!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
            Order <strong style={{ color: '#00f2fe', fontFamily: 'var(--font-mono)' }}>{lastOrderId}</strong> has been assigned to <strong style={{ color: '#ffffff' }}>Falcon-One (AERO-X1)</strong>. Airspace corridor is cleared.
          </p>

          <div style={{
            background: 'rgba(10, 16, 26, 0.8)',
            padding: '16px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            marginBottom: 24,
            textAlign: 'left',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-dim)' }}>Payload Item:</span>
              <strong style={{ color: '#ffffff' }}>{selectedProduct.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-dim)' }}>Payload Mass:</span>
              <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{selectedProduct.weightKg} kg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-dim)' }}>Destination:</span>
              <span style={{ color: '#ffffff' }}>{selectedDest.address}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Flight Time Est:</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>4 minutes 12 seconds</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => onSwitchView('mission_control')}
              className="btn-aerospace"
              style={{ padding: '12px 20px', fontSize: '0.85rem' }}
            >
              <Plane size={16} /> Open Fleet Mission Control
            </button>
            <button
              onClick={() => onSwitchView('customer_view')}
              className="btn-aerospace"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.15))',
                borderColor: '#818cf8',
                color: '#c7d2fe',
                padding: '12px 20px',
                fontSize: '0.85rem'
              }}
            >
              Track as Recipient <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* Store Checkout Layout */
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
          {/* Products Column */}
          <div>
            <h2 style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={18} color="#00f2fe" /> 1. Select Store Item for Delivery
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SAMPLE_PRODUCTS.map(product => {
                const isSelected = selectedProduct.id === product.id;
                return (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    style={{
                      background: isSelected ? 'rgba(0, 242, 254, 0.1)' : 'var(--bg-card)',
                      border: isSelected ? '2px solid #00f2fe' : '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      gap: 16,
                      boxShadow: isSelected ? 'var(--glow-cyan)' : 'none'
                    }}
                  >
                    <div style={{
                      fontSize: '2rem',
                      width: 50,
                      height: 50,
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {product.imageEmoji}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: `${product.badgeColor}22`,
                          color: product.badgeColor,
                          border: `1px solid ${product.badgeColor}44`
                        }}>
                          {product.tag}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', fontSize: '1rem' }}>
                          {product.price}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: isSelected ? '#00f2fe' : '#ffffff', marginBottom: 4 }}>
                        {product.name}
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                        {product.description}
                      </p>

                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        PAYLOAD MASS: <strong style={{ color: '#38bdf8' }}>{product.weightKg} kg</strong> (Payload Bay Limit: 2.5 kg)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Configuration & Checkout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Delivery Target Selector */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: 12 }}>
                2. Customer Drop Coordinates
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SAMPLE_DESTINATIONS.map((dest, idx) => (
                  <label
                    key={idx}
                    onClick={() => setSelectedDest(dest)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: selectedDest.address === dest.address ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: selectedDest.address === dest.address ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="dest"
                      checked={selectedDest.address === dest.address}
                      onChange={() => {}}
                      style={{ accentColor: '#38bdf8', marginTop: 3 }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#ffffff' }}>{dest.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dest.address}</div>
                      <div style={{ fontSize: '0.68rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>Pad: {dest.type}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Shipping Method Option */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: 12 }}>
                3. Delivery Method
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Drone Express */}
                <div
                  onClick={() => setShippingMethod('drone')}
                  style={{
                    padding: '12px',
                    borderRadius: 8,
                    background: shippingMethod === 'drone' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: shippingMethod === 'drone' ? '2px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <Plane size={24} color="#00f2fe" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#00f2fe' }}>
                      AeroDrop Autonomous Air Express
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Direct air transit · Arrives in ~12 mins
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#10b981' }}>FREE</span>
                </div>

                {/* Ground Van */}
                <div
                  onClick={() => setShippingMethod('ground')}
                  style={{
                    padding: '12px',
                    borderRadius: 8,
                    background: shippingMethod === 'ground' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: shippingMethod === 'ground' ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    opacity: 0.6
                  }}
                >
                  <Truck size={24} color="#94a3b8" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ffffff' }}>
                      Standard Ground Road Carrier
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Estimated delivery: 2-3 business days
                    </div>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>$5.99</span>
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handleCheckout}
              className="btn-aerospace"
              style={{
                padding: '16px',
                fontSize: '0.95rem',
                justifyContent: 'center',
                boxShadow: 'var(--glow-cyan)'
              }}
            >
              <Zap size={18} />
              PLACE ORDER WITH AUTONOMOUS DRONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
