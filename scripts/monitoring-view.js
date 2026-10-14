/**
 * METRO-VISION OS: MONITORING VIEW CONTROLLER
 * Live camera feed tiles, backend connection status banner, and real-time detection ticker.
 */

const MonitoringView = window.MonitoringView = (() => {
  let containerEl = null;
  let tickerStreamEl = null;
  const tileCanvases = {};
  const activeBanners = {};

  async function init(viewContainer) {
    containerEl = viewContainer;
    renderSkeleton();
    await loadFleetData();

    // Subscribe to DataLayer events
    DataLayer.on('newEvent', onNewEventArrived);
    DataLayer.on('backendConnectionChanged', updateBackendBanner);
  }

  function renderSkeleton() {
    const isConnected = DataLayer.isBackendConnected();

    containerEl.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>
            <i data-lucide="radio" style="color: var(--gold-light); width:18px; height:18px;"></i>
            Monitoring Dashboard · Edge Sensor Network
          </h2>
          <div class="view-desc">JAMMU & KASHMIR TRANSIT SYSTEM · 5 BUS CAMERA NODES · EDGE VISION INFERENCE</div>
        </div>
        <div class="header-actions">
          <button id="sim-trigger-btn" class="btn btn-primary btn-sm">
            <i data-lucide="zap"></i> Simulate Detection
          </button>
          <button id="toggle-backend-btn" class="btn ${isConnected ? 'btn-secondary' : 'btn-danger'} btn-sm">
            <i data-lucide="${isConnected ? 'link' : 'unplug'}"></i>
            <span id="toggle-backend-text">${isConnected ? 'Backend: Connected' : 'Connect Backend Model'}</span>
          </button>
        </div>
      </div>

      <div class="view-content" style="padding-bottom: 24px;">
        <!-- Backend Connection Status Notice (Shown only while backend is not connected) -->
        <div id="backend-status-banner" class="backend-status-banner ${isConnected ? 'is-connected' : ''}" style="${isConnected ? 'display: none;' : 'display: flex;'}">
          <div class="backend-status-info">
            <div class="backend-status-icon">
              <i data-lucide="alert-octagon" style="width: 18px; height: 18px;"></i>
            </div>
            <div class="backend-status-text">
              <h4>BACKEND MODEL NOT CONNECTED</h4>
              <p>Edge-AI neural inference model server is offline. Camera feeds are running in <strong>Autonomous Simulated Mode</strong> with synthetic telemetry until the backend connects.</p>
            </div>
          </div>
          <div class="backend-status-actions">
            <button id="connect-now-btn" class="btn btn-primary btn-xs">
              <i data-lucide="refresh-cw"></i> Retry Handshake
            </button>
          </div>
        </div>

        <div class="monitoring-layout">
          <!-- Left: 5 Bus Camera Feed Tiles -->
          <div class="camera-grid-container">
            <div id="camera-grid" class="camera-grid">
              <!-- Rendered dynamically -->
            </div>
          </div>

          <!-- Right: Live Fleet Detection Ticker -->
          <div class="telemetry-ticker-panel">
            <div class="ticker-header">
              <span class="ticker-title">
                <span class="pulse-dot"></span> LIVE FLEET TICKER
              </span>
              <span id="ticker-count" class="nav-badge badge-gold">0 DETECTIONS</span>
            </div>
            <div id="ticker-stream" class="ticker-stream">
              <!-- Live events inserted dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;

    tickerStreamEl = containerEl.querySelector('#ticker-stream');

    // Attach simulation trigger
    containerEl.querySelector('#sim-trigger-btn').addEventListener('click', () => {
      DataLayer.injectNewDetection();
    });

    // Attach backend connection toggles
    const toggleBackendBtn = containerEl.querySelector('#toggle-backend-btn');
    const connectNowBtn = containerEl.querySelector('#connect-now-btn');

    const handleToggle = () => {
      const connected = DataLayer.toggleBackendConnection();
      updateBackendBanner({ connected });
    };

    if (toggleBackendBtn) toggleBackendBtn.addEventListener('click', handleToggle);
    if (connectNowBtn) connectNowBtn.addEventListener('click', handleToggle);

    if (window.lucide) lucide.createIcons();
  }

  function updateBackendBanner({ connected }) {
    const banner = containerEl.querySelector('#backend-status-banner');
    const toggleBtn = containerEl.querySelector('#toggle-backend-btn');
    const toggleText = containerEl.querySelector('#toggle-backend-text');

    if (banner) {
      if (connected) {
        banner.style.display = 'none';
      } else {
        banner.style.display = 'flex';
        banner.classList.remove('is-connected');
      }
    }

    if (toggleBtn && toggleText) {
      if (connected) {
        toggleBtn.className = 'btn btn-secondary btn-sm';
        toggleText.textContent = 'Backend: Connected';
        toggleBtn.querySelector('i').setAttribute('data-lucide', 'link');
      } else {
        toggleBtn.className = 'btn btn-danger btn-sm';
        toggleText.textContent = 'Connect Backend Model';
        toggleBtn.querySelector('i').setAttribute('data-lucide', 'unplug');
      }
    }

    // Update watermark notice on all camera tiles
    containerEl.querySelectorAll('.tile-model-notice').forEach(badge => {
      if (connected) {
        badge.className = 'tile-model-notice connected';
        badge.innerHTML = `<i data-lucide="check" style="width:10px; height:10px;"></i> BACKEND CONNECTED`;
      } else {
        badge.className = 'tile-model-notice';
        badge.innerHTML = `<i data-lucide="alert-circle" style="width:10px; height:10px;"></i> MODEL NOT CONNECTED`;
      }
    });

    if (window.lucide) lucide.createIcons();
  }

  async function loadFleetData() {
    const buses = await DataLayer.getBuses();
    const gridEl = containerEl.querySelector('#camera-grid');
    gridEl.innerHTML = '';

    buses.forEach(bus => {
      const tile = createCameraTile(bus);
      gridEl.appendChild(tile);
    });

    const initialEvents = await DataLayer.getEvents();
    renderInitialTicker(initialEvents.slice(0, 15));

    if (window.lucide) lucide.createIcons();
  }

  function createCameraTile(bus) {
    const tile = document.createElement('div');
    tile.className = 'camera-tile interactive-card';
    tile.id = `tile-${bus.id.replace(/\s+/g, '')}`;

    const isConnected = DataLayer.isBackendConnected();

    tile.innerHTML = `
      <div class="tile-header">
        <span class="tile-bus-id">
          <i data-lucide="bus" style="width:14px; height:14px; color:var(--gold-light)"></i>
          ${bus.id}
          <span style="font-size:10.5px; font-weight:normal; color:var(--text-secondary)">(${bus.plateOrLabel})</span>
        </span>
        <span class="tile-bus-status">
          <span class="live-pill"><span class="dot"></span> LIVE</span>
        </span>
      </div>

      <div class="tile-viewport">
        <canvas id="canvas-${bus.id.replace(/\s+/g, '')}" class="tile-canvas" width="400" height="250"></canvas>
        
        <!-- Backend Model Connection Notice (Updated dynamically) -->
        <div class="tile-model-notice ${isConnected ? 'connected' : ''}">
          <i data-lucide="${isConnected ? 'check' : 'alert-circle'}" style="width:10px; height:10px;"></i>
          ${isConnected ? 'BACKEND CONNECTED' : 'MODEL NOT CONNECTED'}
        </div>

        <div class="hud-watermark">
          <span>${bus.route.split('·')[0].trim()}</span>
          <span>● ${bus.cameraStatus}</span>
        </div>
        <div class="hud-crosshair"></div>

        <!-- Detection Banner -->
        <div id="banner-${bus.id.replace(/\s+/g, '')}" class="tile-detection-banner">
          <div class="banner-text">
            <i data-lucide="alert-triangle" style="width:13px; height:13px; color:var(--gold-light);"></i>
            <span class="banner-msg">Edge Alert</span>
          </div>
          <span class="banner-proof-tag">PROOF CAPTURED</span>
        </div>
      </div>

      <div class="tile-footer">
        <div class="tile-coords">
          <i data-lucide="map-pin" style="width:12px; height:12px; color:var(--gold-light)"></i>
          <span>${bus.lat.toFixed(4)}°N, ${bus.lng.toFixed(4)}°E</span>
        </div>
        <div class="tile-speed">${bus.speed} KM/H</div>
      </div>
    `;

    setTimeout(() => {
      const canvas = tile.querySelector(`#canvas-${bus.id.replace(/\s+/g, '')}`);
      if (canvas) {
        tileCanvases[bus.id] = canvas;
        MediaGenerator.renderLiveCameraTile(canvas, bus);
      }
    }, 15);

    return tile;
  }

  function renderInitialTicker(events) {
    tickerStreamEl.innerHTML = '';
    const countBadge = containerEl.querySelector('#ticker-count');
    if (countBadge) countBadge.textContent = `${events.length} DETECTIONS`;

    events.forEach(evt => {
      const item = createTickerItem(evt);
      tickerStreamEl.appendChild(item);
    });

    if (window.lucide) lucide.createIcons();
  }

  function createTickerItem(evt, isNew = false) {
    const item = document.createElement('div');
    item.className = `ticker-item ${isNew ? 'new-arrival' : ''}`;
    item.id = `ticker-${evt.id}`;

    const dateStr = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const confPct = Math.round((evt.confidence || 0.88) * 100);
    const catLabel = (MediaGenerator.categoryLabels[evt.type] || evt.type).toUpperCase();

    item.innerHTML = `
      <div class="ticker-item-top">
        <span class="ticker-bus-tag">${evt.busId}</span>
        <span class="ticker-timestamp">${dateStr}</span>
      </div>
      <div class="ticker-item-mid">
        <span class="badge badge-cat-${evt.type}">${catLabel}</span>
        <span class="ticker-conf-pill" style="font-family:var(--font-mono); font-size:10px; color:var(--gold-light); background:var(--gold-subtle); padding:1px 5px; border-radius:2px;">
          ${confPct}%
        </span>
      </div>
      <div class="ticker-item-coords">
        <i data-lucide="crosshair" style="width:11px; height:11px; color:var(--gold-light);"></i>
        <span>${evt.gpsLat ? evt.gpsLat.toFixed(4) : '34.0837'}°N, ${evt.gpsLng ? evt.gpsLng.toFixed(4) : '74.7973'}°E</span>
      </div>
    `;

    item.addEventListener('click', () => {
      if (window.App) window.App.inspectProofEvent(evt.id);
    });

    return item;
  }

  function onNewEventArrived(data) {
    const { event, bus } = data;
    const tileId = bus.id.replace(/\s+/g, '');

    // 1. Flash tile with golden pulse
    const tile = containerEl.querySelector(`#tile-${tileId}`);
    if (tile) {
      tile.classList.remove('detection-flash');
      void tile.offsetWidth;
      tile.classList.add('detection-flash');

      // 2. Render dynamic bounding box
      const canvas = tileCanvases[bus.id];
      if (canvas) {
        MediaGenerator.renderLiveCameraTile(canvas, bus, event);
        setTimeout(() => {
          MediaGenerator.renderLiveCameraTile(canvas, bus, null);
        }, 4500);
      }

      // 3. Show detection banner
      const banner = containerEl.querySelector(`#banner-${tileId}`);
      if (banner) {
        banner.className = 'tile-detection-banner active';
        const msgSpan = banner.querySelector('.banner-msg');
        if (msgSpan) {
          const label = MediaGenerator.categoryLabels[event.type] || event.type;
          msgSpan.textContent = `${label} · ${Math.round(event.confidence * 100)}% conf`;
        }
        if (window.lucide) lucide.createIcons();

        if (activeBanners[bus.id]) clearTimeout(activeBanners[bus.id]);
        activeBanners[bus.id] = setTimeout(() => {
          banner.classList.remove('active');
        }, 4200);
      }
    }

    // 4. Prepend item to live event ticker
    if (tickerStreamEl) {
      const tickerItem = createTickerItem(event, true);
      tickerStreamEl.insertBefore(tickerItem, tickerStreamEl.firstChild);
      if (tickerStreamEl.children.length > 30) {
        tickerStreamEl.removeChild(tickerStreamEl.lastChild);
      }
      if (window.lucide) lucide.createIcons();
    }

    // 5. Toast notification
    if (window.App && window.App.showToast) {
      window.App.showToast({
        title: `${bus.id} · ${(MediaGenerator.categoryLabels[event.type] || event.type).toUpperCase()}`,
        desc: `${Math.round(event.confidence * 100)}% Neural Certainty · Proof Captured`,
        severity: event.severity,
        eventId: event.id
      });
    }
  }

  return {
    init,
    refresh: loadFleetData
  };
})();
