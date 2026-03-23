import L from "leaflet";

/**
 * Creates an SVG icon for a vehicle based on its role and type.
 * @param {string} role - "dispatch" or "civilian"
 * @param {string} type - Vehicle type (e.g., "Patrol", "Rapid", "Tow", "Support", "Civilian")
 * @returns {L.Icon} Leaflet icon object
 */
export const createVehicleIcon = (role, type) => {
  let svg = "";

  if (role === "dispatch") {
    // Dispatch/Emergency vehicles - solid with more prominent appearance
    if (type === "Rapid" || type === "Ambulance") {
      // Ambulance - cross symbol
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" stroke="#dc2626" stroke-width="1">
        <rect x="2" y="6" width="20" height="14" rx="2" fill="#dc2626"/>
        <line x1="12" y1="10" x2="12" y2="18" stroke="white" stroke-width="2"/>
        <line x1="8" y1="14" x2="16" y2="14" stroke="white" stroke-width="2"/>
      </svg>`;
    } else if (type === "Tow") {
      // Tow truck - distinctive hook shape
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1e40af" stroke="white" stroke-width="1">
        <rect x="3" y="8" width="18" height="10" rx="1" fill="#1e40af"/>
        <circle cx="7" cy="18" r="2" fill="white"/>
        <circle cx="17" cy="18" r="2" fill="white"/>
        <rect x="2" y="5" width="3" height="4" fill="#1e40af"/>
        <line x1="18" y1="12" x2="22" y2="8" stroke="white" stroke-width="1.5"/>
      </svg>`;
    } else if (type === "Support") {
      // Support vehicle - utility look
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#7c3aed" stroke="white" stroke-width="1">
        <rect x="2" y="9" width="20" height="9" rx="1" fill="#7c3aed"/>
        <circle cx="6" cy="18" r="1.5" fill="white"/>
        <circle cx="18" cy="18" r="1.5" fill="white"/>
        <rect x="1" y="6" width="22" height="3" fill="#7c3aed" opacity="0.7"/>
      </svg>`;
    } else {
      // Default Patrol - classic police car shape
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#059669" stroke="white" stroke-width="1">
        <rect x="3" y="10" width="18" height="8" rx="1" fill="#059669"/>
        <circle cx="7" cy="18" r="1.5" fill="white"/>
        <circle cx="17" cy="18" r="1.5" fill="white"/>
        <rect x="4" y="7" width="16" height="4" rx="1" fill="#059669" opacity="0.8"/>
      </svg>`;
    }
  } else {
    // Civilian traffic - lighter colors, standard car icon
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" stroke="#1e40af" stroke-width="0.5">
      <rect x="4" y="11" width="16" height="8" rx="1" fill="#3b82f6"/>
      <circle cx="7" cy="19" r="1.2" fill="#1e40af"/>
      <circle cx="17" cy="19" r="1.2" fill="#1e40af"/>
      <rect x="5" y="8" width="14" height="4" rx="0.5" fill="#3b82f6" opacity="0.9"/>
    </svg>`;
  }

  const svgDataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

  return new L.Icon({
    iconUrl: svgDataUrl,
    iconRetinaUrl: svgDataUrl,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
    shadowSize: [0, 0],
  });
};

/**
 * Creates an icon for disaster zones with warning symbol.
 * @returns {L.Icon} Leaflet icon object
 */
export const createDisasterIcon = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc2626" stroke="#991b1b" stroke-width="1">
    <polygon points="12,2 22,20 2,20" fill="#dc2626"/>
    <line x1="12" y1="8" x2="12" y2="14" stroke="white" stroke-width="2"/>
    <circle cx="12" cy="17" r="0.8" fill="white"/>
  </svg>`;

  const svgDataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

  return new L.Icon({
    iconUrl: svgDataUrl,
    iconRetinaUrl: svgDataUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    shadowSize: [0, 0],
  });
};

/**
 * Creates an icon for incidents with alert symbol.
 * @returns {L.Icon} Leaflet icon object
 */
export const createIncidentIcon = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" stroke-width="1">
    <circle cx="12" cy="12" r="10" fill="#f59e0b"/>
    <line x1="12" y1="7" x2="12" y2="13" stroke="white" stroke-width="2"/>
    <circle cx="12" cy="16" r="0.8" fill="white"/>
  </svg>`;

  const svgDataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

  return new L.Icon({
    iconUrl: svgDataUrl,
    iconRetinaUrl: svgDataUrl,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
    shadowSize: [0, 0],
  });
};
