import React, { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  createVehicleIcon,
  createDisasterIcon,
  createIncidentIcon,
} from "../utils/mapIcons";

// Fixes missing marker icons in Vite/Webpack environments.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (event) => {
      if (onMapClick) {
        onMapClick({ lat: event.latlng.lat, lng: event.latlng.lng });
      }
    },
  });
  return null;
};

const OpenStreetMapView = ({
  center,
  zoom,
  tick = 0,
  markers,
  routes,
  incidents,
  disasterZones = [],
  heatmapData = [],
  className = "",
  onMapClick,
  onMarkerClick,
  mapClickMode = false,
  selectedVehicleLabel,
  vehicleProfiles = {},
}) => {
  // Create icon cache to avoid recreating icons on every render
  const iconCache = useMemo(() => {
    const cache = {
      disasterIcon: createDisasterIcon(),
      incidentIcon: createIncidentIcon(),
    };

    // Pre-create common vehicle icons
    cache.dispatchPatrol = createVehicleIcon("dispatch", "Patrol");
    cache.dispatchRapid = createVehicleIcon("dispatch", "Rapid");
    cache.dispatchTow = createVehicleIcon("dispatch", "Tow");
    cache.dispatchSupport = createVehicleIcon("dispatch", "Support");
    cache.civilian = createVehicleIcon("civilian", "Civilian");

    return cache;
  }, []);

  // Helper to get the correct vehicle icon for a marker
  const getVehicleIcon = (marker) => {
    const unitId = marker.label?.replace("Unit ", "");
    const profile = vehicleProfiles[unitId];
    const role =
      profile?.role || (marker.type === "Civilian" ? "civilian" : "dispatch");
    const markerType = marker.type || "Patrol";

    if (role === "civilian") {
      return iconCache.civilian;
    }

    // Use specific dispatch vehicle icons
    switch (markerType) {
      case "Rapid":
      case "Ambulance":
        return iconCache.dispatchRapid;
      case "Tow":
        return iconCache.dispatchTow;
      case "Support":
        return iconCache.dispatchSupport;
      default:
        return iconCache.dispatchPatrol;
    }
  };

  const getEventAging = (event) => {
    const createdAtTick = Number(event?.createdAtTick);
    const expiresAtTick = Number(event?.expiresAtTick);
    const hasFiniteExpiry = Number.isFinite(expiresAtTick);

    if (!hasFiniteExpiry) {
      return {
        hasCountdown: false,
        countdownLabel: "",
        ageRatio: 1,
      };
    }

    const totalDuration = Math.max(1, expiresAtTick - (createdAtTick || 0));
    const remainingTicks = Math.max(0, expiresAtTick - Number(tick || 0));
    const ageRatio = Math.max(0, Math.min(1, remainingTicks / totalDuration));
    const secondsLeft = Math.ceil(remainingTicks / 10);

    return {
      hasCountdown: true,
      countdownLabel: `T-${secondsLeft}s`,
      ageRatio,
    };
  };

  // Convert heatmap data to heatmap layer format (lat, lng, intensity as weight)
  const renderHeatmapLayer = () => {
    if (!heatmapData || heatmapData.length === 0) {
      return null;
    }

    // Group heatmap points by disaster zone for visual organization
    return heatmapData.map((point, index) => {
      const [lat, lng, intensity] = point;
      const radius = Math.max(5, intensity * 25);
      const opacity = Math.max(0.1, intensity * 0.8);

      return (
        <CircleMarker
          key={`heatmap-point-${index}`}
          center={[lat, lng]}
          radius={radius}
          pathOptions={{
            color: "rgba(220, 38, 38, 0.6)",
            fillColor: "rgba(239, 68, 68, 1)",
            fillOpacity: opacity,
            weight: 0,
          }}
        />
      );
    });
  };

  return (
    <div
      className={`osm-map-shell ${className} ${mapClickMode ? "map-click-armed" : ""}`.trim()}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={true}
        className="osm-map-container"
        zooomControl={false}
      >
        <MapClickHandler onMapClick={onMapClick} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render heatmap layer for disaster zones */}
        {renderHeatmapLayer()}

        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.points}
            pathOptions={{
              color: route.color || "#0ea5e9",
              weight: route.historical ? 3 : 4,
              opacity: route.opacity ?? (route.historical ? 0.35 : 0.9),
              dashArray: route.dashArray,
            }}
          >
            <Popup>
              <strong>{route.name || `Route ${route.id}`}</strong>
              <br />
              {route.distanceMeters ? (
                <span>
                  {(route.distanceMeters / 1000).toFixed(2)} km •{" "}
                  {Math.round((route.durationSeconds || 0) / 60)} min
                </span>
              ) : (
                <span>{route.points?.length || 0} path points</span>
              )}

              {route.legs?.length > 0 && (
                <>
                  <hr style={{ margin: "8px 0" }} />
                  <div style={{ maxHeight: "160px", overflowY: "auto" }}>
                    {route.legs.slice(0, 2).map((leg) => (
                      <div key={leg.id} style={{ marginBottom: "8px" }}>
                        <div>
                          <strong>{leg.summary || "Turn-by-turn"}</strong>
                        </div>
                        {leg.steps?.slice(0, 6).map((step, index) => (
                          <div
                            key={`${leg.id}-step-${index}`}
                            style={{ fontSize: "0.8rem" }}
                          >
                            {index + 1}. {step}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Popup>
          </Polyline>
        ))}

        {markers.map((marker) => (
          <Marker
            key={marker.label}
            position={[marker.lat, marker.lng]}
            icon={getVehicleIcon(marker)}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(marker);
                }
              },
            }}
          >
            <Popup>
              <strong>{marker.label}</strong>
              <br />
              Position: {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
              <br />
              {marker.status}
              {selectedVehicleLabel &&
                marker.label?.includes(selectedVehicleLabel) && (
                  <>
                    <br />
                    <em>Selected for reroute</em>
                  </>
                )}
            </Popup>
          </Marker>
        ))}

        {incidents.map((incident) =>
          (() => {
            const aging = getEventAging(incident);

            return (
              <Marker
                key={incident.id}
                position={[incident.lat, incident.lng]}
                icon={iconCache.incidentIcon}
              >
                {aging.hasCountdown && (
                  <Tooltip
                    permanent
                    direction="top"
                    offset={[0, -2]}
                    className="event-countdown-chip incident"
                  >
                    {aging.countdownLabel}
                  </Tooltip>
                )}
                <Popup>
                  <strong>{incident.title}</strong>
                  <br />
                  {incident.detail}
                  {aging.hasCountdown && (
                    <>
                      <br />
                      <strong>Clears in:</strong>{" "}
                      {aging.countdownLabel.replace("T-", "")}
                    </>
                  )}
                </Popup>
              </Marker>
            );
          })(),
        )}

        {/* Render disaster zones with warning styling */}
        {disasterZones.map((zone) =>
          (() => {
            const aging = getEventAging(zone);
            const fillOpacity = 0.08 + aging.ageRatio * 0.16;
            const ringWeight = 2 + aging.ageRatio * 2.2;
            const dash = aging.ageRatio < 0.33 ? "3 9" : "5 5";

            return (
              <div key={zone.id}>
                <CircleMarker
                  center={[zone.lat, zone.lng]}
                  radius={zone.radius || 50}
                  pathOptions={{
                    color: zone.color || "#dc2626",
                    fillColor: zone.color || "#dc2626",
                    fillOpacity,
                    weight: ringWeight,
                    dashArray: dash,
                  }}
                >
                  {aging.hasCountdown && (
                    <Tooltip
                      permanent
                      direction="top"
                      offset={[0, -18]}
                      className="event-countdown-chip disaster"
                    >
                      {aging.countdownLabel}
                    </Tooltip>
                  )}
                  <Popup>
                    <strong style={{ color: zone.color }}>
                      ⚠️ {zone.title}
                    </strong>
                    <br />
                    <em>{zone.detail}</em>
                    <br />
                    <br />
                    <strong>Severity:</strong> {zone.severity}
                    <br />
                    <strong>Radius:</strong> {zone.radius}m
                    <br />
                    <strong>Status:</strong> All traffic rerouted
                    {aging.hasCountdown && (
                      <>
                        <br />
                        <strong>Expected clear:</strong>{" "}
                        {aging.countdownLabel.replace("T-", "")}
                      </>
                    )}
                  </Popup>
                </CircleMarker>
                <Marker
                  position={[zone.lat, zone.lng]}
                  icon={iconCache.disasterIcon}
                />
              </div>
            );
          })(),
        )}
      </MapContainer>
    </div>
  );
};

OpenStreetMapView.defaultProps = {
  center: [37.7749, -122.4194],
  zoom: 13,
  markers: [],
  routes: [],
  incidents: [],
};

export default OpenStreetMapView;
