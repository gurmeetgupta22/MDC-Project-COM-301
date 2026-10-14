/**
 * METRO-VISION OS: DATA LAYER & MOCK/SIMULATION SERVICE
 * =========================================================================
 * Single source of truth for the entire frontend application.
 * Buses: Bus 1, Bus 2, Bus 3, Bus 4, Bus 5
 * Geography: Jammu & Kashmir, India (Srinagar & Jammu transit corridors)
 * Categories: Pothole, Waterlogging, Traffic Jams, Accidents, Pedestrian Vulnerability
 * Backend Connection State: Controls "Backend Model Not Connected" status.
 * =========================================================================
 */

const DataLayer = window.DataLayer = (() => {
  // Connection state: false by default per requirement
  let backendModelConnected = false;

  // Event listeners registry
  const listeners = {
    newEvent: [],
    complaintUpdated: [],
    simulationToggled: [],
    backendConnectionChanged: [],
    busStatusChanged: []
  };

  function subscribe(eventName, callback) {
    if (listeners[eventName]) {
      listeners[eventName].push(callback);
    }
    return () => {
      if (listeners[eventName]) {
        listeners[eventName] = listeners[eventName].filter(cb => cb !== callback);
      }
    };
  }

  function emit(eventName, data) {
    if (listeners[eventName]) {
      listeners[eventName].forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in ${eventName} subscriber:`, err);
        }
      });
    }
  }

  // --- 1. BUS FLEET SEED DATA (Jammu & Kashmir Transit Network) ---
  const buses = [
    {
      id: "Bus 1",
      plateOrLabel: "JK-01-AB-1021",
      route: "Srinagar City Express · Lal Chowk ⇄ Dal Gate ⇄ Boulevard",
      status: "online",
      lat: 34.0837,
      lng: 74.7973,
      speed: 36,
      heading: 110,
      fps: 25.0,
      cameraStatus: "STREAMING (1080p60)",
      lastPing: new Date(Date.now() - 1000 * 3).toISOString()
    },
    {
      id: "Bus 2",
      plateOrLabel: "JK-01-CD-2044",
      route: "Smart Corridor 2 · Batamaloo ⇄ Jehangir Chowk ⇄ Dalgate",
      status: "online",
      lat: 34.0780,
      lng: 74.7890,
      speed: 42,
      heading: 45,
      fps: 24.8,
      cameraStatus: "STREAMING (1080p60)",
      lastPing: new Date(Date.now() - 1000 * 5).toISOString()
    },
    {
      id: "Bus 3",
      plateOrLabel: "JK-01-EF-3088",
      route: "NH-44 Bypass · Pantha Chowk ⇄ Nowgam ⇄ Airport Road",
      status: "online",
      lat: 34.0320,
      lng: 74.8620,
      speed: 48,
      heading: 260,
      fps: 25.2,
      cameraStatus: "STREAMING (1080p60)",
      lastPing: new Date(Date.now() - 1000 * 2).toISOString()
    },
    {
      id: "Bus 4",
      plateOrLabel: "JK-01-GH-4099",
      route: "Heritage Route · Hazratbal ⇄ Nigeen ⇄ Rainawari",
      status: "online",
      lat: 34.1280,
      lng: 74.8420,
      speed: 30,
      heading: 190,
      fps: 24.5,
      cameraStatus: "STREAMING (1080p60)",
      lastPing: new Date(Date.now() - 1000 * 4).toISOString()
    },
    {
      id: "Bus 5",
      plateOrLabel: "JK-02-JK-5012",
      route: "Inter-District Link · Jammu Tawi ⇄ Bikram Chowk ⇄ Gandhinagar",
      status: "online",
      lat: 32.7150,
      lng: 74.8650,
      speed: 35,
      heading: 15,
      fps: 24.0,
      cameraStatus: "STREAMING (1080p60)",
      lastPing: new Date(Date.now() - 1000 * 6).toISOString()
    }
  ];

  // Standard 5 Categories definition
  const CATEGORIES = [
    { id: 'pothole', label: 'Pothole' },
    { id: 'waterlogging', label: 'Waterlogging' },
    { id: 'traffic_jams', label: 'Traffic Jams' },
    { id: 'accidents', label: 'Accidents' },
    { id: 'pedestrian_vulnerability', label: 'Pedestrian Vulnerability' }
  ];

  // --- 2. DETECTION EVENTS SEED DATA (Structured across Bus 1 - 5 and 5 Categories) ---
  const events = [];

  const seedEventTemplates = [
    // Bus 1
    {
      busId: "Bus 1",
      type: "pothole",
      severity: "high",
      confidence: 0.94,
      gpsLat: 34.0725,
      gpsLng: 74.8080,
      mediaType: "image",
      status: "pending_review",
      notes: "Severe 35cm road crater near Lal Chowk clock tower crossing. High risk of bus chassis damage."
    },
    {
      busId: "Bus 1",
      type: "waterlogging",
      severity: "medium",
      confidence: 0.91,
      gpsLat: 34.0865,
      gpsLng: 74.8250,
      mediaType: "image",
      status: "pending_review",
      notes: "Dal Gate runoff drainage overflow; 20cm standing water encroaching into left public transit lane."
    },
    {
      busId: "Bus 1",
      type: "traffic_jams",
      severity: "medium",
      confidence: 0.88,
      gpsLat: 34.0890,
      gpsLng: 74.8310,
      mediaType: "image",
      status: "pending_review",
      notes: "Heavy congestion along Boulevard Road approach during evening tourist peak hours."
    },
    {
      busId: "Bus 1",
      type: "accidents",
      severity: "high",
      confidence: 0.96,
      gpsLat: 34.0750,
      gpsLng: 74.8120,
      mediaType: "video_clip",
      status: "pending_review",
      notes: "Side-impact collision between commercial van and two-wheeler near MA Road intersection."
    },
    {
      busId: "Bus 1",
      type: "pedestrian_vulnerability",
      severity: "high",
      confidence: 0.92,
      gpsLat: 34.0710,
      gpsLng: 74.8050,
      mediaType: "image",
      status: "pending_review",
      notes: "Missing pedestrian crossing signals at busy market corridor, forcing crowds into incoming bus lane."
    },

    // Bus 2
    {
      busId: "Bus 2",
      type: "pothole",
      severity: "medium",
      confidence: 0.89,
      gpsLat: 34.0785,
      gpsLng: 74.7895,
      mediaType: "image",
      status: "pending_review",
      notes: "Asphalt subsidence and longitudinal cracking near Batamaloo bus terminal entry ramp."
    },
    {
      busId: "Bus 2",
      type: "waterlogging",
      severity: "high",
      confidence: 0.93,
      gpsLat: 34.0810,
      gpsLng: 74.7920,
      mediaType: "image",
      status: "pending_review",
      notes: "Flooding across 3 lanes under Jehangir Chowk flyover due to storm drainage choke."
    },
    {
      busId: "Bus 2",
      type: "traffic_jams",
      severity: "high",
      confidence: 0.95,
      gpsLat: 34.0760,
      gpsLng: 74.7980,
      mediaType: "image",
      status: "pending_review",
      notes: "Stalled freight mini-truck narrowing corridor to single file bottleneck."
    },
    {
      busId: "Bus 2",
      type: "accidents",
      severity: "high",
      confidence: 0.97,
      gpsLat: 34.0830,
      gpsLng: 74.7870,
      mediaType: "video_clip",
      status: "pending_review",
      notes: "Reckless overtaking incident involving multi-axle dumper truck swerving into oncoming lane."
    },
    {
      busId: "Bus 2",
      type: "pedestrian_vulnerability",
      severity: "medium",
      confidence: 0.87,
      gpsLat: 34.0790,
      gpsLng: 74.7910,
      mediaType: "image",
      status: "pending_review",
      notes: "Unregulated school crosswalk with obscured road markings."
    },

    // Bus 3
    {
      busId: "Bus 3",
      type: "pothole",
      severity: "high",
      confidence: 0.97,
      gpsLat: 34.0325,
      gpsLng: 74.8625,
      mediaType: "image",
      status: "pending_review",
      notes: "Deep structural road crater on Pantha Chowk NH-44 highway approach."
    },
    {
      busId: "Bus 3",
      type: "waterlogging",
      severity: "low",
      confidence: 0.82,
      gpsLat: 34.0410,
      gpsLng: 74.8510,
      mediaType: "image",
      status: "captured",
      notes: "Curb runoff accumulation near Nowgam bypass."
    },
    {
      busId: "Bus 3",
      type: "traffic_jams",
      severity: "high",
      confidence: 0.94,
      gpsLat: 34.0350,
      gpsLng: 74.8580,
      mediaType: "image",
      status: "pending_review",
      notes: "Highway checkpoint gridlock backing up traffic for 1.8km."
    },
    {
      busId: "Bus 3",
      type: "accidents",
      severity: "high",
      confidence: 0.95,
      gpsLat: 34.0380,
      gpsLng: 74.8540,
      mediaType: "video_clip",
      status: "pending_review",
      notes: "Hit-and-run against highway guardrail by speeding private SUV."
    },
    {
      busId: "Bus 3",
      type: "pedestrian_vulnerability",
      severity: "high",
      confidence: 0.91,
      gpsLat: 34.0330,
      gpsLng: 74.8600,
      mediaType: "image",
      status: "pending_review",
      notes: "Broken highway median railing prompting hazardous pedestrian crossing."
    },

    // Bus 4
    {
      busId: "Bus 4",
      type: "pothole",
      severity: "medium",
      confidence: 0.86,
      gpsLat: 34.1285,
      gpsLng: 74.8425,
      mediaType: "image",
      status: "pending_review",
      notes: "Surface wear and gravel scatter near Hazratbal shrine loop."
    },
    {
      busId: "Bus 4",
      type: "waterlogging",
      severity: "medium",
      confidence: 0.90,
      gpsLat: 34.1210,
      gpsLng: 74.8380,
      mediaType: "image",
      status: "pending_review",
      notes: "Nigeen lake bank seasonal water rise encroaching road verge."
    },
    {
      busId: "Bus 4",
      type: "traffic_jams",
      severity: "medium",
      confidence: 0.89,
      gpsLat: 34.1150,
      gpsLng: 74.8350,
      mediaType: "image",
      status: "captured",
      notes: "Narrow heritage street bottleneck during Friday prayer congregation."
    },
    {
      busId: "Bus 4",
      type: "accidents",
      severity: "high",
      confidence: 0.93,
      gpsLat: 34.1180,
      gpsLng: 74.8370,
      mediaType: "video_clip",
      status: "pending_review",
      notes: "Two-vehicle sideswipe collision with structural lamp post."
    },
    {
      busId: "Bus 4",
      type: "pedestrian_vulnerability",
      severity: "high",
      confidence: 0.94,
      gpsLat: 34.1290,
      gpsLng: 74.8430,
      mediaType: "image",
      status: "pending_review",
      notes: "Heavy pedestrian footfall overflowing onto active roadway with zero sidewalk buffer."
    },

    // Bus 5
    {
      busId: "Bus 5",
      type: "pothole",
      severity: "high",
      confidence: 0.95,
      gpsLat: 32.7155,
      gpsLng: 74.8655,
      mediaType: "image",
      status: "pending_review",
      notes: "Severe trench settlement on Jammu Tawi railway station bridge descent."
    },
    {
      busId: "Bus 5",
      type: "waterlogging",
      severity: "medium",
      confidence: 0.88,
      gpsLat: 32.7190,
      gpsLng: 74.8690,
      mediaType: "image",
      status: "pending_review",
      notes: "Monsoon gully drain failure near Bikram Chowk underpass."
    },
    {
      busId: "Bus 5",
      type: "traffic_jams",
      severity: "high",
      confidence: 0.93,
      gpsLat: 32.7120,
      gpsLng: 74.8610,
      mediaType: "image",
      status: "pending_review",
      notes: "Commercial auto-rickshaw queue obstructing public bus terminal bay."
    },
    {
      busId: "Bus 5",
      type: "accidents",
      severity: "high",
      confidence: 0.96,
      gpsLat: 32.7230,
      gpsLng: 74.8720,
      mediaType: "video_clip",
      status: "pending_review",
      notes: "High-speed rear-end collision at Gandhinagar junction traffic signal."
    },
    {
      busId: "Bus 5",
      type: "pedestrian_vulnerability",
      severity: "high",
      confidence: 0.92,
      gpsLat: 32.7160,
      gpsLng: 74.8660,
      mediaType: "image",
      status: "pending_review",
      notes: "Transit commuters crossing 4-lane Jammu Tawi highway without signalized refuge."
    }
  ];

  // Populate events with IDs, timestamps, and procedural media
  seedEventTemplates.forEach((tpl, idx) => {
    const minutesAgo = (seedEventTemplates.length - idx) * 14 + Math.floor(Math.random() * 8);
    const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
    const eventObj = {
      id: `EVT-${String(idx + 1).padStart(4, "0")}`,
      busId: tpl.busId,
      timestamp,
      gpsLat: tpl.gpsLat,
      gpsLng: tpl.gpsLng,
      type: tpl.type,
      severity: tpl.severity,
      confidence: tpl.confidence,
      mediaType: tpl.mediaType,
      mediaUrl: null,
      status: tpl.status,
      notes: tpl.notes
    };
    eventObj.mediaUrl = MediaGenerator.generateEvidenceThumbnail(eventObj);
    events.push(eventObj);
  });

  // --- 3. DRAFTED COMPLAINTS SEED DATA (Ready to Send across Bus 1 - 5 and 5 Categories) ---
  const complaints = [
    // Bus 1 Complaints
    {
      id: "CMP-0201",
      busId: "Bus 1",
      category: "pothole",
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      department: "Public Works Department (PWD J&K)",
      summary: "AI Edge Incident Report: Critical road crater (35cm depth) detected at Lal Chowk clock tower crossing. Immediate risk of axle fracture for transit fleet. Priority asphalt patching required.",
      linkedEvents: ["EVT-0001"],
      status: "pending_review", // Waiting to be allowed to send
      reviewedBy: null,
      reviewedAt: null,
      priority: "CRITICAL"
    },
    {
      id: "CMP-0202",
      busId: "Bus 1",
      category: "waterlogging",
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      department: "Srinagar Municipal Corporation (SMC Drainage)",
      summary: "Severe water ponding detected at Dal Gate transit corridor. Storm runoff drains obstructed, reducing 2 lanes to single lane. Dewatering pump deployment required.",
      linkedEvents: ["EVT-0002"],
      status: "pending_review",
      reviewedBy: null,
      reviewedAt: null,
      priority: "HIGH"
    },
    {
      id: "CMP-0203",
      busId: "Bus 1",
      category: "traffic_jams",
      createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
      department: "J&K Traffic Police Srinagar",
      summary: "Boulevard Road gridlock detected by optical flow analysis. Vehicle queue exceeds 850m with transit delays over 28 minutes. Signal retiming requested.",
      linkedEvents: ["EVT-0003"],
      status: "pending_review",
      reviewedBy: null,
      reviewedAt: null,
      priority: "MEDIUM"
    },
    {
      id: "CMP-0204",
      busId: "Bus 1",
      category: "accidents",
      createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
      department: "J&K Traffic Police Enforcement",
      summary: "Emergency Alert: Collision detected near MA Road crossing. Commercial vehicle impact on two-wheeler; optical tracking telemetry captured for accident reconstruction.",
      linkedEvents: ["EVT-0004"],
      status: "pending_review",
      reviewedBy: null,
      reviewedAt: null,
      priority: "CRITICAL"
    },
    {
      id: "CMP-0205",
      busId: "Bus 1",
      category: "pedestrian_vulnerability",
      createdAt: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
      department: "Srinagar Smart City Ltd / Traffic",
      summary: "High-risk pedestrian hazard: Missing pedestrian crossing phase forcing crowds into active bus transit lanes near Residency Road. Pedestrian safety barrier required.",
      linkedEvents: ["EVT-0005"],
      status: "pending_review",
      reviewedBy: null,
      reviewedAt: null,
      priority: "HIGH"
    },

    // Bus 2 Complaints
    {
      id: "CMP-0206",
      busId: "Bus 2",
      category: "pothole",
      createdAt: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
      department: "Public Works Department (PWD J&K)",
      summary: "Repeated vertical G-force shocks exceeding 2.9g recorded at Batamaloo terminal entrance. Severe asphalt fatigue and fissures requiring road re-carpeting.",
      linkedEvents: ["EVT-0006"],
      status: "pending_review",
      reviewedBy: null,
      reviewedAt: null,
      priority: "HIGH"
    },
    {
      id: "CMP-0207",
      busId: "Bus 2",
      category: "waterlogging",
      createdAt: new Date(Date.now() - 115 * 60 * 1000).toISOString(),
      department: "Srinagar Municipal Corporation (SMC)",
      summary: "Deep submerged corridor under Jehangir Chowk flyover. Water height 30cm; transit speed restricted to under 10 km/h.",
      linkedEvents: ["EVT-0007"],
      status: "pending_review",
      reviewedBy: null,
      reviewedAt: null,
      priority: "CRITICAL"
    },
    {
      id: "CMP-0208",
      busId: "Bus 2",
      category: "accidents",
      createdAt: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
      department: "J&K Traffic Police Enforcement",
      summary: "Hazardous reckless driving and near-miss collision logged on Jehangir Chowk descent. Vehicle license sequence flagged for ANPR enforcement.",
      linkedEvents: ["EVT-0009"],
      status: "pending_review",
      reviewedBy: null,
      reviewedAt: null,
      priority: "HIGH"
    },

    // Bus 3 Complaints
    {
      id: "CMP-0209",
      busId: "Bus 3",
      category: "pothole",
      createdAt: new Date(Date.now() - 145 * 60 * 1000).toISOString(),
      department: "National Highways Authority of India (NHAI J&K)",
      summary: "NH-44 Bypass: Deep asphalt crater at Pantha Chowk descent. High risk for multi-vehicle transit pileup on 70km/h arterial highway.",
      linkedEvents: ["EVT-0011"],
      status: "pending_review",
      reviewedBy: null,
      reviewedAt: null,
      priority: "CRITICAL"
    },
    {
      id: "CMP-0210",
      busId: "Bus 3",
      category: "traffic_jams",
      createdAt: new Date(Date.now() - 160 * 60 * 1000).toISOString(),
      department: "J&K Traffic Police Highway Wing",
      summary: "Gridlock congestion extending over 1.8km on Pantha Chowk bypass approach. Traffic deployment needed to clear stalled commercial vehicle.",
      linkedEvents: ["EVT-0013"],
      status: "pending_review",
      reviewedBy: null,
      reviewedAt: null,
      priority: "HIGH"
    },

    // Bus 4 Complaints
    {
      id: "CMP-0211",
      busId: "Bus 4",
      category: "accidents",
      createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      department: "J&K Traffic Police Srinagar",
      summary: "Accident notice: Collision with municipal lamp post at Nigeen road bend. Debris on right roadway causing lane blockage.",
      linkedEvents: ["EVT-0019"],
      status: "pending_review",
      reviewedBy: null,
      reviewedAt: null,
      priority: "HIGH"
    },

    // Bus 5 Complaints (Jammu Sector)
    {
      id: "CMP-0212",
      busId: "Bus 5",
      category: "pothole",
      createdAt: new Date(Date.now() - 200 * 60 * 1000).toISOString(),
      department: "Public Works Department (PWD Jammu)",
      summary: "Severe trench settlement on Jammu Tawi railway bridge ramp. Surface unevenness creating high vehicle bounce and suspension hazard.",
      linkedEvents: ["EVT-0021"],
      status: "pending_review",
      reviewedBy: null,
      reviewedAt: null,
      priority: "CRITICAL"
    },
    {
      id: "CMP-0213",
      busId: "Bus 5",
      category: "traffic_jams",
      createdAt: new Date(Date.now() - 220 * 60 * 1000).toISOString(),
      department: "J&K Traffic Police Jammu",
      summary: "Bikram Chowk bus bay blockage: Unauthorized commercial queues obstructing public transit ingress and egress.",
      linkedEvents: ["EVT-0023"],
      status: "pending_review",
      reviewedBy: null,
      reviewedAt: null,
      priority: "MEDIUM"
    }
  ];

  const delay = (ms = 60) => new Promise(res => setTimeout(res, ms));

  // --- 4. BACKEND CONNECTION STATE & APIS ---

  function isBackendConnected() {
    return backendModelConnected;
  }

  function setBackendConnected(status) {
    backendModelConnected = !!status;
    emit("backendConnectionChanged", { connected: backendModelConnected });
    return backendModelConnected;
  }

  function toggleBackendConnection() {
    return setBackendConnected(!backendModelConnected);
  }

  // --- 5. PUBLIC ASYNC API CONTRACT ---

  async function getBuses() {
    await delay();
    return JSON.parse(JSON.stringify(buses));
  }

  async function getCategories() {
    return [...CATEGORIES];
  }

  async function getLiveFeed(busId) {
    await delay(30);
    const bus = buses.find(b => b.id === busId);
    if (!bus) throw new Error(`Bus ${busId} not found`);
    const recentEvents = events.filter(e => e.busId === busId);
    return {
      bus: JSON.parse(JSON.stringify(bus)),
      recentEvents: JSON.parse(JSON.stringify(recentEvents.slice(-5))),
      backendConnected: backendModelConnected
    };
  }

  async function getEvents(filters = {}) {
    await delay();
    let result = [...events];

    if (filters.busId && filters.busId !== "all") {
      result = result.filter(e => e.busId === filters.busId);
    }
    if (filters.category && filters.category !== "all") {
      result = result.filter(e => e.type === filters.category);
    }
    if (filters.severity && filters.severity !== "all") {
      result = result.filter(e => e.severity === filters.severity);
    }

    result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return JSON.parse(JSON.stringify(result));
  }

  /**
   * Returns events grouped by Bus ID, then subdivided into the 5 Categories
   */
  async function getEventsByBusAndCategory(filters = {}) {
    const allEvents = await getEvents(filters);
    const grouped = {};

    buses.forEach(b => {
      grouped[b.id] = {
        bus: b,
        categories: {
          pothole: [],
          waterlogging: [],
          traffic_jams: [],
          accidents: [],
          pedestrian_vulnerability: []
        },
        totalCount: 0
      };
    });

    allEvents.forEach(evt => {
      if (!grouped[evt.busId]) {
        grouped[evt.busId] = {
          bus: { id: evt.busId, plateOrLabel: evt.busId, status: "unknown" },
          categories: {
            pothole: [],
            waterlogging: [],
            traffic_jams: [],
            accidents: [],
            pedestrian_vulnerability: []
          },
          totalCount: 0
        };
      }
      const catKey = evt.type;
      if (grouped[evt.busId].categories[catKey]) {
        grouped[evt.busId].categories[catKey].push(evt);
        grouped[evt.busId].totalCount++;
      }
    });

    return grouped;
  }

  async function getComplaints(filters = {}) {
    await delay();
    let result = [...complaints];

    if (filters.status && filters.status !== "all") {
      result = result.filter(c => c.status === filters.status);
    }
    if (filters.busId && filters.busId !== "all") {
      result = result.filter(c => c.busId === filters.busId);
    }
    if (filters.category && filters.category !== "all") {
      result = result.filter(c => c.category === filters.category);
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return JSON.parse(JSON.stringify(result));
  }

  /**
   * Returns complaints grouped by Bus ID, then subdivided into the 5 Categories
   */
  async function getComplaintsByBusAndCategory(filters = {}) {
    const allComplaints = await getComplaints(filters);
    const grouped = {};

    buses.forEach(b => {
      grouped[b.id] = {
        bus: b,
        categories: {
          pothole: [],
          waterlogging: [],
          traffic_jams: [],
          accidents: [],
          pedestrian_vulnerability: []
        },
        totalCount: 0
      };
    });

    allComplaints.forEach(c => {
      if (!grouped[c.busId]) {
        grouped[c.busId] = {
          bus: { id: c.busId, plateOrLabel: c.busId, status: "unknown" },
          categories: {
            pothole: [],
            waterlogging: [],
            traffic_jams: [],
            accidents: [],
            pedestrian_vulnerability: []
          },
          totalCount: 0
        };
      }
      const catKey = c.category;
      if (grouped[c.busId].categories[catKey]) {
        grouped[c.busId].categories[catKey].push(c);
        grouped[c.busId].totalCount++;
      }
    });

    return grouped;
  }

  async function getComplaintById(id) {
    await delay(20);
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return null;
    const linkedEventDetails = events.filter(e => complaint.linkedEvents.includes(e.id));
    return {
      complaint: JSON.parse(JSON.stringify(complaint)),
      events: JSON.parse(JSON.stringify(linkedEventDetails))
    };
  }

  async function approveComplaint(id, updatedSummary = null, department = null, supervisorId = "SUPERVISOR-JK-01") {
    await delay(100);
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) throw new Error(`Complaint ${id} not found`);

    complaint.status = "sent"; // Dispatched / Allowed to send
    if (updatedSummary) complaint.summary = updatedSummary;
    if (department) complaint.department = department;
    complaint.reviewedBy = supervisorId;
    complaint.reviewedAt = new Date().toISOString();

    complaint.linkedEvents.forEach(evtId => {
      const evt = events.find(e => e.id === evtId);
      if (evt) evt.status = "sent";
    });

    const updated = JSON.parse(JSON.stringify(complaint));
    emit("complaintUpdated", { action: "sent", complaint: updated });
    return updated;
  }

  async function rejectComplaint(id, reason = "Threshold not reached") {
    await delay(80);
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) throw new Error(`Complaint ${id} not found`);

    complaint.status = "rejected";
    complaint.rejectReason = reason;
    complaint.reviewedBy = "SUPERVISOR-JK-01";
    complaint.reviewedAt = new Date().toISOString();

    const updated = JSON.parse(JSON.stringify(complaint));
    emit("complaintUpdated", { action: "rejected", complaint: updated });
    return updated;
  }

  /**
   * GIS Heatmap clusters for Jammu & Kashmir
   */
  async function getHeatmapClusters(filters = {}) {
    await delay();
    let evts = [...events];
    if (filters.category && filters.category !== "all") {
      evts = evts.filter(e => e.type === filters.category);
    }
    if (filters.severity && filters.severity !== "all") {
      evts = evts.filter(e => e.severity === filters.severity);
    }

    const clusters = [];
    const threshold = 0.015;

    evts.forEach(evt => {
      let matched = clusters.find(cl => {
        const dLat = Math.abs(cl.lat - evt.gpsLat);
        const dLng = Math.abs(cl.lng - evt.gpsLng);
        return dLat < threshold && dLng < threshold;
      });

      if (!matched) {
        matched = {
          id: `cluster-${clusters.length + 1}`,
          name: getJKLocationName(evt.gpsLat, evt.gpsLng),
          lat: evt.gpsLat,
          lng: evt.gpsLng,
          events: [],
          buses: new Set(),
          maxSeverity: "low",
          categoriesCount: {}
        };
        clusters.push(matched);
      }

      matched.events.push(evt);
      matched.buses.add(evt.busId);
      matched.categoriesCount[evt.type] = (matched.categoriesCount[evt.type] || 0) + 1;

      if (evt.severity === "high") {
        matched.maxSeverity = "high";
      } else if (evt.severity === "medium" && matched.maxSeverity !== "high") {
        matched.maxSeverity = "medium";
      }
    });

    return clusters.map(c => ({
      ...c,
      busCount: c.buses.size,
      buses: Array.from(c.buses),
      eventCount: c.events.length,
      complaintCount: complaints.filter(comp => comp.linkedEvents.some(eid => c.events.some(ce => ce.id === eid))).length
    }));
  }

  function getJKLocationName(lat, lng) {
    if (lat < 33.5) return "Jammu Tawi & Bikram Chowk Sector";
    if (lat > 34.11) return "Hazratbal & Nigeen Lake Corridor";
    if (lat > 34.08) return "Dal Gate & Boulevard Road, Srinagar";
    if (lat > 34.06) return "Lal Chowk & Batamaloo Central, Srinagar";
    return "NH-44 Pantha Chowk & Bypass, Srinagar";
  }

  async function getLiveStats() {
    await delay(10);
    const onlineBuses = buses.filter(b => b.status === "online").length;
    const pendingComplaints = complaints.filter(c => c.status === "pending_review").length;
    const highSeverityEvents = events.filter(e => e.severity === "high").length;
    return {
      onlineBuses,
      totalBuses: buses.length,
      pendingComplaints,
      highSeverityEvents,
      totalEvents: events.length,
      backendConnected: backendModelConnected
    };
  }

  // --- 6. SIMULATION LOGIC ---
  const simCategoryPool = [
    { type: "pothole", severity: "high", conf: 0.94, desc: "Pothole detected" },
    { type: "waterlogging", severity: "medium", conf: 0.89, desc: "Waterlogging detected" },
    { type: "traffic_jams", severity: "high", conf: 0.93, desc: "Traffic jam detected" },
    { type: "accidents", severity: "high", conf: 0.96, desc: "Accident / hazard detected" },
    { type: "pedestrian_vulnerability", severity: "high", conf: 0.92, desc: "Pedestrian risk detected" }
  ];

  function injectNewDetection() {
    const onlineBuses = buses.filter(b => b.status === "online");
    const targetBus = onlineBuses[Math.floor(Math.random() * onlineBuses.length)];
    const template = simCategoryPool[Math.floor(Math.random() * simCategoryPool.length)];

    const latDrift = (Math.random() - 0.5) * 0.005;
    const lngDrift = (Math.random() - 0.5) * 0.005;

    const newEvent = {
      id: `EVT-${String(events.length + 1).padStart(4, "0")}`,
      busId: targetBus.id,
      timestamp: new Date().toISOString(),
      gpsLat: Number((targetBus.lat + latDrift).toFixed(4)),
      gpsLng: Number((targetBus.lng + lngDrift).toFixed(4)),
      type: template.type,
      severity: template.severity,
      confidence: template.conf,
      mediaType: "image",
      mediaUrl: null,
      status: "pending_review",
      notes: `${template.desc} along ${targetBus.route.split('·')[0].trim()} corridor.`
    };

    newEvent.mediaUrl = MediaGenerator.generateEvidenceThumbnail(newEvent);
    events.unshift(newEvent);

    // Create linked complaint ready to send
    const newComplaint = {
      id: `CMP-${String(complaints.length + 201).padStart(4, "0")}`,
      busId: targetBus.id,
      category: template.type,
      createdAt: new Date().toISOString(),
      department: template.type === "pothole" ? "Public Works Department (PWD J&K)" :
                  template.type === "waterlogging" ? "SMC Drainage & Flood Control" :
                  template.type === "traffic_jams" ? "J&K Traffic Police Operations" :
                  template.type === "accidents" ? "J&K Traffic Police Enforcement" :
                  "Srinagar Smart City Pedestrian Wing",
      summary: `Automated Edge Draft: ${template.desc} with ${Math.round(template.conf * 100)}% confidence on ${targetBus.route}. Waiting supervisor allowance for civic dispatch.`,
      linkedEvents: [newEvent.id],
      status: "pending_review",
      reviewedBy: null,
      reviewedAt: null,
      priority: template.severity === "high" ? "CRITICAL" : "MEDIUM"
    };
    complaints.unshift(newComplaint);

    emit("newEvent", {
      event: newEvent,
      bus: targetBus,
      complaint: newComplaint
    });

    return newEvent;
  }

  return {
    isBackendConnected,
    setBackendConnected,
    toggleBackendConnection,
    getBuses,
    getCategories,
    getLiveFeed,
    getEvents,
    getEventsByBusAndCategory,
    getComplaints,
    getComplaintsByBusAndCategory,
    getComplaintById,
    approveComplaint,
    rejectComplaint,
    getHeatmapClusters,
    getLiveStats,
    injectNewDetection,
    subscribe,
    on: subscribe
  };
})();
