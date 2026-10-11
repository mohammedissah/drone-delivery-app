// Autonomous Drone Flight Physics & Mission Simulator

export const SKYPORT_COORDINATES = {
  name: "SkyPort Hub Alpha (Central Depot)",
  lat: 37.7749,
  lng: -122.4194,
  alt: 12.0 // Pad elevation meters
};

export const DEFAULT_CUSTOMER_DESTINATION = {
  name: "Customer Drop Pad (Backyard)",
  address: "742 Evergreen Terr, Sector 4",
  recipient: "Elena Rostova",
  orderId: "ORD-9482-EXP",
  item: "Emergency Medical Kit & Sensor",
  weightKg: 1.45,
  lat: 37.7865,
  lng: -122.4055,
  dropZoneType: "Backyard Lawn"
};

export const NO_FLY_ZONES = [
  {
    id: "NFZ-01",
    name: "St. Luke Heliport Corridor",
    lat: 37.7680,
    lng: -122.4140,
    radius: 350, // meters
    reason: "Hospital Emergency Airspace (FAA Class D)"
  },
  {
    id: "NFZ-02",
    name: "City Hall Radio Tower",
    lat: 37.7792,
    lng: -122.4191,
    radius: 280,
    reason: "High RF Interference & Municipal Security"
  },
  {
    id: "NFZ-03",
    name: "Embarcadero High-Rise Air Corridor",
    lat: 37.7940,
    lng: -122.4000,
    radius: 400,
    reason: "Building Turbulence & Glider Zone"
  }
];

export const INITIAL_DRONES = [
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
    order: DEFAULT_CUSTOMER_DESTINATION,
    flightHistory: []
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
    order: null,
    flightHistory: []
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
    order: null,
    flightHistory: []
  }
];

// Helper to compute bearing between two points
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  let brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

// Helper to compute distance in meters between two lat/lng points
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = deg => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Generate intermediate waypoints avoiding no-fly zones
export function generateFlightPath(origin, destination) {
  // Waypoint 1: Climb corridor
  const wp1 = {
    lat: origin.lat + (destination.lat - origin.lat) * 0.25 - 0.0015,
    lng: origin.lng + (destination.lng - origin.lng) * 0.25 + 0.0020,
    alt: 65,
    name: "Waypoint Alpha (Corridor Entry)"
  };

  // Waypoint 2: Cruise transition
  const wp2 = {
    lat: origin.lat + (destination.lat - origin.lat) * 0.70 + 0.0010,
    lng: origin.lng + (destination.lng - origin.lng) * 0.70 - 0.0015,
    alt: 65,
    name: "Waypoint Bravo (Descent Gate)"
  };

  return [
    { ...origin, alt: 0, name: "SkyPort Pad" },
    wp1,
    wp2,
    { ...destination, alt: 0, name: destination.name || "Customer Drop Target" }
  ];
}
