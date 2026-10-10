const API_BASE = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001';

export class DroneBackendClient {
  constructor(onMessageCallback, onStatusChange) {
    this.ws = null;
    this.onMessageCallback = onMessageCallback;
    this.onStatusChange = onStatusChange;
    this.isConnected = false;
    this.reconnectTimeout = null;
  }

  connect() {
    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('✅ Connected to AeroDrop Backend Server (Port 3001)');
        this.isConnected = true;
        if (this.onStatusChange) this.onStatusChange(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.onMessageCallback) {
            this.onMessageCallback(data);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.onStatusChange) this.onStatusChange(false);
        // Retry connection every 3 seconds
        this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        if (this.onStatusChange) this.onStatusChange(false);
      };
    } catch (err) {
      this.isConnected = false;
      if (this.onStatusChange) this.onStatusChange(false);
      this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) this.ws.close();
  }

  async sendLaunch(droneId = 'AERO-X1') {
    try {
      const res = await fetch(`${API_BASE}/missions/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ droneId })
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using client simulation', e);
    }
  }

  async sendHold(droneId = 'AERO-X1') {
    try {
      const res = await fetch(`${API_BASE}/missions/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ droneId })
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using client simulation', e);
    }
  }

  async sendRth(droneId = 'AERO-X1') {
    try {
      const res = await fetch(`${API_BASE}/missions/rth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ droneId })
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using client simulation', e);
    }
  }

  async sendAbort(droneId = 'AERO-X1') {
    try {
      const res = await fetch(`${API_BASE}/missions/abort`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ droneId })
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using client simulation', e);
    }
  }

  async sendAuthorizeDrop(droneId = 'AERO-X1') {
    try {
      const res = await fetch(`${API_BASE}/missions/authorize-drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ droneId })
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using client simulation', e);
    }
  }

  async sendReset(droneId = 'AERO-X1') {
    try {
      const res = await fetch(`${API_BASE}/missions/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ droneId })
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using client simulation', e);
    }
  }

  async dispatchEcommerceOrder(order) {
    try {
      const res = await fetch(`${API_BASE}/webhooks/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      return await res.json();
    } catch (e) {
      console.warn('Backend webhook unavailable, using client simulation', e);
    }
  }
}
