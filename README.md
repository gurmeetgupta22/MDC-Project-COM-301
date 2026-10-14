# RescueSync AI / Metro-Vision OS
## Urban Edge-AI Intelligence Platform & Sensor Fleet Command Center

> **Frontend Command Center Prototype** for an urban intelligence platform that turns public bus cameras into a city-wide edge-AI sensor network.

---

## 🚦 System Architecture & Key Sections

1. **Monitoring (Operations Deck)**
   - Live grid of 6 edge-AI bus camera nodes with simulated Dashcam HUD overlays, GPS coordinates, vehicle speed, and active `LIVE` streaming pulses.
   - Real-time detection flashes (`.detection-flash`) and inline banners (`Pothole detected · 94% confidence`) when edge detections trigger.
   - Global real-time telemetry stream / ticker log (chronological feed of detections with click-to-inspect capability).
   - Simulation control toolbar: manual event ping trigger and pause/resume stream toggle.

2. **Proof (Evidence Library)**
   - Verifiable evidence library organized into collapsible bus fleet containers (`BUS-01`, `BUS-02`, etc.).
   - Thumbnail evidence cards with neural bounding boxes (`[BBOX: POTHOLE 92%]`), monospace coordinates, confidence ratings, and timestamps.
   - Filtering by Severity (`High`, `Medium`, `Low`), Detection Type (`Pothole`, `Waterlogging`, `Hit & Run`, `Rash Driving`, `Pedestrian Risk`, `Congestion`, `Missing Signboard`), sorting by date/confidence, and full-text search.
   - Full Evidence Inspector modal with camera telemetry, high-res frame inspection, one-click GPS coordinate copy, and direct jump to related civic complaints.

3. **Complaints (Civic Register)**
   - Drafted complaints grouped into containers by bus ID.
   - Shows target civic department (`Public Works & Infrastructure`, `Traffic Police Enforcement`, `Municipal Drainage Division`), AI-generated complaint summary, status badges, and linked proof thumbnails.
   - Quick jump to the human-in-the-loop Supervision queue.

4. **Supervision (Human-in-the-Loop Triage)**
   - Interactive triage desk for reviewing `pending_review` complaints.
   - Side-by-side verification: primary CCTV evidence with bounding boxes alongside editable AI complaint text and destination department routing.
   - Action toolbar:
     - **Approve & Dispatch Notice**: Commits supervisor timestamp, updates complaint and linked proof statuses across the entire system, and moves the case to the session audit trail.
     - **Reject Complaint**: Logs rejection rationale and updates record.
     - **Request More Evidence**: Dispatches request to the bus edge buffer for secondary angle captures.
   - Collapsible "Recently Processed" audit trail drawer.

5. **GIS Heatmap (Spatial Command)**
   - Interactive Leaflet GIS map with CartoDB Dark Matter tiles matching the mission-control palette.
   - Incident cluster bubbles scaled by event volume and color-coded by maximum severity (Red: High, Amber: Medium, Blue: Low).
   - Hover tooltips showing area sector, total complaints, event count, and reporting bus IDs.
   - Real-time filters for severity and detection types, plus coordinate datum readout.

---

## 🎨 Design System

- **Background**: Deep near-black operational navy (`#0B0E14` / `#111622`)
- **Live / Stream Active**: Electric Cyan (`#3FD0E0`)
- **Pending Review**: Amber (`#E8A54B`)
- **High Severity / Incident**: Red (`#E5484D`)
- **Approved / Dispatched**: Emerald Green (`#4BB679`)
- **Dividers & Chrome**: Technical slate (`#1E2638` / `#242F44`)
- **Typography**:
  - UI Labels & Controls: **IBM Plex Sans** / **Inter**
  - Telemetry & Tabular Data (GPS, Timestamps, Bus IDs, Confidence): **JetBrains Mono**

---

## 🛠️ Data Layer Contract (`scripts/data-layer.js`)

The application is built with a strictly decoupled data layer. All components interact exclusively with asynchronous Promise-returning functions:
- `DataLayer.getBuses()`
- `DataLayer.getLiveFeed(busId)`
- `DataLayer.getEvents(filters)`
- `DataLayer.getEventsByBus(filters)`
- `DataLayer.getComplaints(filters)`
- `DataLayer.getComplaintsByBus(filters)`
- `DataLayer.getComplaintById(id)`
- `DataLayer.approveComplaint(id, updatedSummary, department, supervisorId)`
- `DataLayer.rejectComplaint(id, reason)`
- `DataLayer.requestMoreEvidence(id, note)`
- `DataLayer.getHeatmapClusters(filters)`
- `DataLayer.getLiveStats()`
- `DataLayer.on('newEvent' | 'complaintUpdated' | 'simulationToggled', callback)`

To connect a production REST + WebSocket backend, simply replace the internal methods of `scripts/data-layer.js` with `fetch()` and `WebSocket` calls without modifying any UI views.

---

## 🚀 How to Run Locally

Because the dashboard uses modern ES6 modules and canvas asset generation, run it via any local HTTP server:

### Option 1: Python HTTP Server (Built-in)
```bash
python3 -m http.server 8088
```
Open [http://localhost:8088](http://localhost:8088) in your browser.

### Option 2: Node.js / npx serve
```bash
npx -y serve -p 8088 .
```
Open [http://localhost:8088](http://localhost:8088) in your browser.
