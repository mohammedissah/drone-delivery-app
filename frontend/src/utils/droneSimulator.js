// Autonomous Drone Flight Physics & Mission Simulator

export const SKYPORT_COORDINATES = {
  name: "AeroDrop SkyPort Hub Accra (Kotoka Base)",
  lat: 5.6037,
  lng: -0.1670,
  alt: 15.0 // Pad elevation meters
};

export const DEFAULT_CUSTOMER_DESTINATION = {
  name: "Customer Drop Pad (East Legon)",
  address: "14 Lagos Avenue, East Legon, Accra, Ghana",
  recipient: "Kwame Mensah",
  orderId: "ORD-9482-GH",
  item: "Emergency Medical Kit & Vaccine Cooler",
  weightKg: 1.45,
  lat: 5.6360,
  lng: -0.1550,
  dropZoneType: "Residential Courtyard"
};

export const NO_FLY_ZONES = [
  {
    id: "NFZ-01",
    name: "Kotoka International Active Runway Zone",
    lat: 5.6055,
    lng: -0.1645,
    radius: 400, // meters
    reason: "Commercial Aviation Runway (GCAA Class A Airspace)"
  },
  {
    id: "NFZ-02",
    name: "Jubilee House Presidential Air Corridor",
    lat: 5.5815,
    lng: -0.1885,
    radius: 350,
    reason: "State Security & Executive Airspace Restriction"
  },
  {
    id: "NFZ-03",
    name: "Burma Camp Military Command Air Corridor",
    lat: 5.5920,
    lng: -0.1420,
    radius: 380,
    reason: "Ghana Armed Forces Air Operations Zone"
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
    windVector: { speed: 12, direction: "SW" },
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
    lat: 5.6033,
    lng: -0.1664,
    gpsSats: 20,
    rtkFix: "RTK FIXED (±1.8cm)",
    tetherLengthM: 0,
    windVector: { speed: 14, direction: "SW" },
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
    lat: 5.6041,
    lng: -0.1676,
    gpsSats: 24,
    rtkFix: "RTK FIXED (±1.2cm)",
    tetherLengthM: 0,
    windVector: { speed: 11, direction: "SW" },
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
