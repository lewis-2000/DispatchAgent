# Rerouting, UI, and SUMO Function Reference

This document explains the key functions used across:

- Frontend rerouting logic (mock/dynamic routing in the React hook)
- Frontend UI behavior (map, vehicles, details, dashboard state)
- Backend SUMO integration (FastAPI, TraCI bridge, data conversion)

## 1) End-to-End Flow

1. UI triggers reroute intent (vehicle selection, map click, dynamic hazard logic).
2. Frontend hook computes or requests a route geometry and applies hazard avoidance.
3. UI state updates markers/routes/incidents and emits alerts/timeline events.
4. In live mode, backend simulation loop reads SUMO state and broadcasts snapshots over WebSocket.
5. SUMO bridge methods talk to TraCI for stepping simulation, reading vehicles/routes, and rerouting.

## 2) Frontend Rerouting Logic (src/hooks/useSimulation.js)

### Core hook

- `useSimulation(useMockData, options)`
  - Main orchestration hook.
  - Manages WebSocket data, mock simulation, routing helpers, incident/disaster event generation, and exposed actions.

### Geometry and route normalization helpers

- `routePointDistanceMeters(a, b)`
  - Haversine distance between two `[lat, lng]` points.
- `getPointAtDistance(points, distanceMeters)`
  - Interpolates a position along a polyline by traveled distance.
- `normalizePoint(point)`
  - Converts point shapes (`[lat,lng]` or `{lat,lng}`) to canonical `[lat,lng]`.
- `normalizeRoutePoints(points)`
  - Normalizes and filters route point arrays.
- `buildStreetLikeFallbackRoute(points)`
  - Produces an elbowed fallback route when OSRM routing is unavailable.
- `buildRouteCacheKey(points)`
  - Stable cache key for route coordinate sequences.
- `fetchRoadSnappedRoute(route)`
  - Calls OSRM, maps response geometry to `[lat,lng]`, caches result, falls back to synthetic route on failure.

### Hazard proximity and intersection checks

- `minDistanceToIncidents(points, incidents)`
  - Minimum route-point distance to incident centers.
- `minDistanceToDisasterZone(points, disasterZones)`
  - Minimum route-point distance to disaster zone centers.
- `routeIntersectsDisasterZone(points, disasterZones)`
  - Returns first intersecting zone when route enters zone radius.
- `routeIntersectsIncidentZone(points, incidents, bufferMeters)`
  - Returns first incident whose radius+buffer intersects the route.
- `isPointInDisasterBuffer(point, disasterZones, bufferMeters)`
  - Checks whether a target point is inside a zone plus safety buffer.
- `isPointNearIncident(point, incidents, bufferMeters)`
  - Checks whether a target point is too close to any incident.

### Hazard-aware route generation

- `calculateDisasterZoneHeatmapData(disasterZones)`
  - Expands each zone into weighted points for heatmap-like rendering.
- `calculateDisasterAvoidanceRoute(vehicleId, startPos, endPos, disasterZones, forcedZone)`
  - Builds safe route via zone avoidance waypoints, else normal route.
- `buildIncidentAvoidanceWaypoints(startPos, endPos, incident)`
  - Generates two side-offset waypoints around incident center.

### Target selection and spawn selection

- `getNextDispatchTarget()`
  - Round-robin destination selector from dispatch target list.
- `getNextSpawnPoint()`
  - Round-robin origin selector for initial route setup.
- `getNextFarDestination()`
  - Round-robin long-distance destination selector.
- `getSafeDispatchTarget(preferredTarget, disasterZones)`
  - Picks preferred dispatch target unless blocked by disaster buffers.
- `getSafeSpawnPoint(disasterZones)`
  - Chooses a spawn point outside disaster buffers.
- `getSafeFarDestination(originPoint, disasterZones)`
  - Chooses far destination with minimum travel distance and hazard safety.
- `getSafeHazardAwareTarget(originPoint, disasterZones, incidents)`
  - Scores candidate targets and picks best safe endpoint.

### Dynamic event creation and scheduling

- `getRandomTickInterval(min, max)`
  - Random integer interval helper for event cadence.
- `getTrafficMarkersSnapshot()`
  - Snapshot of current marker positions for traffic-aware event placement.
- `chooseTrafficWeightedRouteAnchor(routeByVehicleId, trafficMarkers, corridorRadiusMeters)`
  - Picks weighted route anchors in denser traffic corridors.
- `buildIncidentFromRoute(time, routeByVehicleId, trafficMarkers)`
  - Creates dynamic incident payload anchored to active route traffic.
- `buildDisasterZoneFromRoute(time, routeByVehicleId, trafficMarkers)`
  - Creates dynamic disaster zone payload plus avoidance waypoints.
- `queueDynamicReroute(vehicleId, target, reason, tickNow)`
  - Schedules delayed reroute execution after dynamic hazard events.
- `flushDueDynamicReroutes(tickNow)`
  - Executes due reroute jobs with retry and attempt limits.

### Reroute execution and route lifecycle

- `requestMockRerouteToLocation(vehicleId, target, reason, tickNow)`
  - Main reroute executor in demo mode.
  - Computes route, applies disaster/incident avoidance, archives previous route, updates state, emits alerts/timeline events, and enforces cooldown.
- `handleRouteCompletion(vehicleId)`
  - Detects completion, emits events, and auto-dispatches next destination.
- `startMockDataSimulation()`
  - Main mock tick loop.
  - Advances vehicle positions, expires/spawns incidents/zones, triggers reroutes, and dispatches map/vehicle updates.

### Live mode and event processing

- `buildRouteSignature(route)`
  - Stable route fingerprint used to detect route changes.
- `processDynamicEvents(snapshot)`
  - Converts first-seen incidents/zones and route change events into timeline/alerts.
- `connectWebSocket()`
  - Connects to backend `/ws/simulation`, parses snapshots, updates context, and handles reconnect.

### Exposed control helpers

- `selectVehicle(vehicleId)`
  - Selects active vehicle in UI state.
- `deselectVehicle()`
  - Clears selected vehicle.
- `addAlert(message)`
  - Pushes alert item to context state.
- `addTimelineEvent(event, vehicleId, details)`
  - Pushes timeline event to context state.
- `rerouteVehicleToCoordinate(vehicleId, lat, lng, reason)`
  - Public wrapper that triggers coordinate-based reroute in mock mode.
- `sendCommand(endpoint, method, body)`
  - Generic backend REST caller used by UI controls.

## 3) Frontend UI Functions

## src/components/Map.jsx

- `Map({ useMockData })`
  - Map panel container and reroute control bar.
- `handleMapClick({ lat, lng })`
  - In map-click mode, validates selection/mode and calls `rerouteVehicleToCoordinate`.

## src/components/Vehicles.jsx

- `Vehicles({ useMockData })`
  - Fleet list panel with selection and summary stats.
- `handleVehicleClick(vehicleId)`
  - Toggles vehicle selection for dispatch/reroute actions.

## src/components/Details.jsx

- `Details({ useMockData })`
  - Right-side details panel for selected vehicle, route suggestions, and timeline.
- `formatTimelineTime(timestamp)`
  - Safe date formatting for timeline rows.
- `getTimelineItemClass(event)`
  - Computes severity and animation classes for timeline items.
- `handleSpeedChange(event)`
  - Updates target speed slider and writes timeline event.
- `handleRouteSelect(route)`
  - Sets selected suggested route card.
- `handleAcceptRoute(route)`
  - Accepts route suggestion and logs timeline event.

## src/components/OpenStreetMapView.jsx

- `MapClickHandler({ onMapClick })`
  - Leaflet map event bridge that emits clicked coordinates.
- `OpenStreetMapView(props)`
  - Presentational map component rendering routes, vehicles, incidents, and disaster zones.
- `getEventAging(event)`
  - Computes remaining lifetime, countdown label, and age ratio for event visuals.
- `renderHeatmapLayer()`
  - Renders weighted disaster heat points as circle markers.

## src/pages/admin.jsx

- `Admin()`
  - Top-level dashboard layout and mode/source toggles.
- `applyPanelDefaults(matchesMobile)`
  - Collapses side panels on narrow screens.
- `listener(event)`
  - Media query change handler feeding `applyPanelDefaults`.
- `syncLiveSource()`
  - Calls backend `/simulation/source` to switch `sumo` vs `real` feed.

## src/context/SimulationContext.jsx

- `simulationReducer(state, action)`
  - Central reducer handling map snapshots, vehicle selection, alerts, timeline, and route suggestion state.
- `SimulationProvider({ children })`
  - React provider that exposes `{state, dispatch}`.

## src/App.jsx

- `App()`
  - Wraps admin UI in `SimulationProvider`.

## 4) Backend SUMO + API Functions

## server/app.py (FastAPI controller and broadcast loop)

- `lifespan(app)`
  - Startup/shutdown context; ensures SUMO bridge cleanup.
- `health()`
  - Health endpoint with mode, client, and snapshot status.
- `ensure_snapshot_defaults(snapshot, tick)`
  - Normalizes partial snapshot payloads for frontend compatibility.
- `ensure_broadcast_loop_running()`
  - Starts background simulation broadcast task if absent.
- `set_simulation_source(mode)`
  - Switches source between `sumo` and external `real` snapshots.
- `push_real_snapshot(snapshot)`
  - Validates and stores incoming real snapshot payload.
- `start_simulation(scenario_path)`
  - Instantiates and starts `SUMOBridge`, then starts simulation loop.
- `stop_simulation()`
  - Cancels loop and stops SUMO bridge.
- `pause_simulation()`
  - Pauses outbound simulation updates.
- `resume_simulation()`
  - Resumes simulation updates if bridge exists.
- `reroute_vehicle(vehicle_id, route_id)`
  - API endpoint to request backend vehicle reroute via SUMO bridge.
- `report_incident(x, y, severity)`
  - API endpoint for incident reporting placeholder.
- `simulation_loop()`
  - Main async loop.
  - In `real` mode broadcasts pushed snapshots.
  - In `sumo` mode steps SUMO, collects vehicles/routes/incidents/center, converts snapshot, and broadcasts to WebSocket clients.
- `websocket_simulation(websocket)`
  - WebSocket endpoint for real-time snapshots and optional incoming commands.

## server/sumo_bridge.py (TraCI integration)

- `SUMOBridge.__init__(sumocfg_path, gui, port)`
  - Initializes runtime fields and validates scenario config path.
- `start()`
  - Builds SUMO command, starts process, connects TraCI, loads network data.
- `stop()`
  - Closes TraCI connection.
- `step()`
  - Executes one SUMO simulation step.
- `get_vehicles()`
  - Reads vehicle IDs, position/speed/route/state and maps XY to lon/lat.
- `get_active_routes()`
  - Builds route point polylines for active vehicles from SUMO edges.
- `detect_incidents()`
  - Derives congestion/slow incidents from sampled junction incoming edges.
- `get_bounds_center()`
  - Returns map center from network bounds or Nairobi fallback.
- `_xy_to_lon_lat(x, y)`
  - Converts SUMO XY to lon/lat with robust fallback projection.
- `reroute_vehicle(vehicle_id, route_id)`
  - Applies explicit route or SUMO target-change reroute.
- `report_incident(x, y, severity)`
  - Queues synthetic incident events for testing.
- `_build_sumo_command()`
  - Resolves SUMO executable and builds startup CLI arguments.
- `_get_net_file()`
  - Extracts network file path from `.sumocfg`.
- `_get_route_color(vehicle_id)`
  - Assigns deterministic route color per vehicle.

## server/data_converter.py (backend-to-frontend schema adapter)

- `SimulationSnapshotConverter.to_snapshot(vehicles, incidents, routes, center, tick)`
  - Produces frontend-ready snapshot payload.
- `_vehicles_to_markers(vehicles)`
  - Maps backend vehicles to marker schema.
- `_routes_to_polylines(routes)`
  - Maps route arrays to polyline schema.
- `_incidents_to_circles(incidents)`
  - Maps incidents to circle marker schema.
- `_calculate_avg_speed(vehicles)`
  - Computes mean fleet speed.
- `_severity_to_color(severity)`
  - Maps severity level to display color.
- `_severity_to_radius(severity)`
  - Maps severity level to display radius.
- `_get_iso_timestamp()`
  - Generates UTC ISO timestamp.

## 5) Practical Notes

- Mock rerouting logic is richer than live backend rerouting right now.
  - Mock mode uses OSRM routing, dynamic incident/disaster generation, and hazard-aware detours.
  - Live mode depends on SUMO state and `SUMOBridge.reroute_vehicle` behavior.
- Timeline and alerts are central observability tools.
  - Most reroute decisions and hazard lifecycle events are surfaced there.
- The map-click reroute action is intentionally gated to demo mode in UI.
