import React, { useState } from "react";
import OpenStreetMapView from "./OpenStreetMapView";
import { useSimulation } from "../hooks/useSimulation";

const Map = ({ useMockData = false }) => {
  const [mapClickRerouteMode, setMapClickRerouteMode] = useState(false);
  const [mapClickDisasterMode, setMapClickDisasterMode] = useState(false);
  const {
    mapData,
    connected,
    tick,
    selectedVehicle,
    rerouteVehicleToCoordinate,
    addAlert,
    addDisasterAtLocation,
    vehicleProfiles,
    selectVehicle,
  } = useSimulation(useMockData, { controller: true });
  const vehicleCount = mapData?.markers?.length || 0;

  const handleMarkerClick = (marker) => {
    // Extract vehicle ID from marker label (e.g., "Unit U-102" -> "U-102")
    const vehicleId = marker.label?.replace("Unit ", "");
    if (vehicleId) {
      selectVehicle(vehicleId);
    }
  };

  const handleMapClick = async ({ lat, lng }) => {
    if (mapClickDisasterMode) {
      if (!useMockData) {
        addAlert("Map-click disaster creation is available in Demo Mode");
        setMapClickDisasterMode(false);
        return;
      }

      const created = addDisasterAtLocation(lat, lng, tick);
      if (!created) {
        addAlert("Could not create disaster zone at that location");
      }
      setMapClickDisasterMode(false);
      return;
    }

    if (!mapClickRerouteMode) {
      return;
    }

    if (!selectedVehicle) {
      addAlert("Select a vehicle before choosing reroute destination");
      setMapClickRerouteMode(false);
      return;
    }

    if (!useMockData) {
      addAlert("Map-click reroute is available in Demo Mode");
      setMapClickRerouteMode(false);
      return;
    }

    await rerouteVehicleToCoordinate(
      selectedVehicle.id,
      lat,
      lng,
      "Operator map-click destination",
    );

    setMapClickRerouteMode(false);
  };

  return (
    <div className="map-surface">
      <div className="map-controls">
        <button
          type="button"
          className={`map-action-btn ${mapClickRerouteMode ? "active" : ""}`}
          onClick={() => setMapClickRerouteMode((value) => !value)}
          disabled={!selectedVehicle}
          title={
            selectedVehicle
              ? "Click map to set reroute destination"
              : "Select a vehicle first"
          }
        >
          {mapClickRerouteMode
            ? "Click Destination..."
            : "Reroute By Map Click"}
        </button>
        <button
          type="button"
          className={`map-action-btn ${mapClickDisasterMode ? "active" : ""}`}
          onClick={() => {
            setMapClickDisasterMode((value) => !value);
            if (mapClickRerouteMode) {
              setMapClickRerouteMode(false);
            }
          }}
          title="Click map to create a disaster zone"
        >
          {mapClickDisasterMode
            ? "Click to Create Disaster..."
            : "Create Disaster"}
        </button>
      </div>
      <OpenStreetMapView
        center={mapData.center}
        zoom={mapData.zoom}
        tick={tick}
        markers={mapData.markers}
        routes={mapData.routes}
        incidents={mapData.incidents}
        disasterZones={mapData.disasterZones}
        heatmapData={mapData.heatmapData}
        onMapClick={handleMapClick}
        onMarkerClick={handleMarkerClick}
        mapClickMode={mapClickRerouteMode || mapClickDisasterMode}
        selectedVehicleLabel={selectedVehicle?.id}
        vehicleProfiles={vehicleProfiles}
      />
      <div className="map-watermark">
        OpenStreetMap {connected ? "● Live" : "○ Offline"}
        <span>
          {" "}
          • {vehicleCount} {vehicleCount === 1 ? "car" : "cars"}
        </span>
        {tick > 0 && <span> • Tick {tick}</span>}
      </div>
    </div>
  );
};

export default Map;
