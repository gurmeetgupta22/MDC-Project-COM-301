/**
 * METRO-VISION OS: GIS HEATMAP & MAP CONTROLLER
 * Centered on Jammu & Kashmir, India (Srinagar & Jammu transit corridors)
 * with radiant golden cluster bubbles and incident category filters.
 */

const HeatmapView = window.HeatmapView = (() => {
  let containerEl = null;
  let map = null;
  let markersLayer = null;
  let currentFilters = {
    severity: 'all',
    category: 'all'
  };

  async function init(viewContainer) {
    containerEl = viewContainer;
    renderLayout();
    initLeafletMap();
    await loadMapClusters();

    DataLayer.on('newEvent', () => {
      if (containerEl && containerEl.classList.contains('active')) {
        loadMapClusters();
      }
    });

    DataLayer.on('complaintUpdated', () => {
      if (containerEl && containerEl.classList.contains('active')) {
        loadMapClusters();
      }
    });
  }

  function renderLayout() {
    containerEl.innerHTML = `
      <div class="heatmap-layout">
        <!-- Leaflet Map Container -->
        <div id="leaflet-map"></div>

        <!-- Floating Controls Panel -->
        <div class="map-floating-panel">
          <div class="map-panel-title">
            <span>
              <i data-lucide="map" style="width:14px; height:14px; color:var(--gold-light); margin-right:4px;"></i>
              JAMMU & KASHMIR GIS CLUSTERING
            </span>
            <span id="map-hotspot-count" class="nav-badge badge-gold">0 HOTSPOTS</span>
          </div>

          <div class="map-filter-row">
            <span class="map-control-label">Filter by Hazard Category:</span>
            <select id="map-filter-category" class="select-control" style="width:100%;">
              <option value="all">All 5 Categories</option>
              <option value="pothole">Potholes & Surface Fatigue</option>
              <option value="waterlogging">Waterlogging & Flooding</option>
              <option value="traffic_jams">Traffic Jams & Gridlocks</option>
              <option value="accidents">Accidents & Collisions</option>
              <option value="pedestrian_vulnerability">Pedestrian Vulnerability</option>
            </select>
          </div>

          <div class="map-filter-row">
            <span class="map-control-label">Filter by Severity:</span>
            <select id="map-filter-severity" class="select-control" style="width:100%;">
              <option value="all">All Severities</option>
              <option value="high">High Severity Only</option>
              <option value="medium">Medium Severity Only</option>
              <option value="low">Low Severity Only</option>
            </select>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-dim); padding-top:8px;">
            <span style="font-family:var(--font-mono); font-size:10px; color:var(--text-muted);">DATUM: WGS84 · J&K GRID</span>
            <div style="display:flex; gap:6px;">
              <button id="map-view-srinagar" class="btn btn-secondary btn-xs">Srinagar</button>
              <button id="map-view-jammu" class="btn btn-secondary btn-xs">Jammu</button>
            </div>
          </div>
        </div>

        <!-- Floating Legend -->
        <div class="map-legend-panel">
          <span class="legend-title">Cluster Severity Legend</span>
          <div class="legend-items">
            <div class="legend-item">
              <span class="legend-color-dot legend-dot-danger"></span>
              <span>High Severity (Accidents / Deep Craters)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color-dot legend-dot-gold"></span>
              <span>Medium Severity (Waterlogging / Traffic Jams)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color-dot legend-dot-info"></span>
              <span>Low Severity (Runoff / Minor Delays)</span>
            </div>
          </div>
          <div style="font-size:9.5px; color:var(--text-muted); border-top:1px solid var(--border-dim); padding-top:4px;">
            * Radiant bubble radius scales with incident volume
          </div>
        </div>
      </div>
    `;

    // Filter controls
    containerEl.querySelector('#map-filter-category').addEventListener('change', (e) => {
      currentFilters.category = e.target.value;
      loadMapClusters();
    });

    containerEl.querySelector('#map-filter-severity').addEventListener('change', (e) => {
      currentFilters.severity = e.target.value;
      loadMapClusters();
    });

    containerEl.querySelector('#map-view-srinagar').addEventListener('click', () => {
      if (map) map.setView([34.0837, 74.7973], 12);
    });

    containerEl.querySelector('#map-view-jammu').addEventListener('click', () => {
      if (map) map.setView([32.7150, 74.8650], 13);
    });

    if (window.lucide) lucide.createIcons();
  }

  function initLeafletMap() {
    if (!window.L) return;

    const mapDiv = containerEl.querySelector('#leaflet-map');
    // Centered on Srinagar, Jammu & Kashmir, India
    map = L.map(mapDiv, {
      zoomControl: false,
      attributionControl: false
    }).setView([34.0837, 74.7973], 12);

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
  }

  async function loadMapClusters() {
    if (!map || !markersLayer) return;
    markersLayer.clearLayers();

    const clusters = await DataLayer.getHeatmapClusters({
      severity: currentFilters.severity,
      category: currentFilters.category
    });

    const countBadge = containerEl.querySelector('#map-hotspot-count');
    if (countBadge) countBadge.textContent = `${clusters.length} HOTSPOTS`;

    clusters.forEach(cluster => {
      const baseRadius = 15;
      const radius = Math.min(38, baseRadius + cluster.eventCount * 3);

      let fillColor = '#F59E0B'; // Gold by default
      let strokeColor = '#FBBF24';
      if (cluster.maxSeverity === 'high') {
        fillColor = '#EF4444';
        strokeColor = '#F87171';
      } else if (cluster.maxSeverity === 'low') {
        fillColor = '#38BDF8';
        strokeColor = '#60A5FA';
      }

      // 1. Radiant circle marker
      const circle = L.circleMarker([cluster.lat, cluster.lng], {
        radius: radius,
        fillColor: fillColor,
        color: strokeColor,
        weight: 2,
        opacity: 0.95,
        fillOpacity: 0.6
      });

      // 2. Hover Tooltip
      const busesListStr = cluster.buses.join(', ');
      const tooltipContent = `
        <div style="font-family: var(--font-ui); font-size:11.5px; padding:2px;">
          <div style="font-weight:700; color:var(--gold-light); font-family:var(--font-mono); margin-bottom:2px;">
            ${cluster.name}
          </div>
          <div style="color:var(--text-secondary);">
            Complaints: <strong style="color:var(--gold-light); font-family:var(--font-mono);">${cluster.complaintCount}</strong> 
            · Total Events: <strong style="font-family:var(--font-mono);">${cluster.eventCount}</strong>
          </div>
          <div style="color:var(--text-muted); font-size:10px; margin-top:2px; font-family:var(--font-mono);">
            Reporting Buses: <span style="color:#FFF;">${cluster.busCount} (${busesListStr})</span>
          </div>
        </div>
      `;

      circle.bindTooltip(tooltipContent, {
        permanent: false,
        direction: 'top',
        className: 'custom-map-tooltip',
        offset: [0, -radius]
      });

      // 3. Click popup
      const catBreakdown = Object.entries(cluster.categoriesCount)
        .map(([k, v]) => `<span>${(MediaGenerator.categoryLabels[k] || k)}: <strong>${v}</strong></span>`)
        .join(' · ');

      const popupHtml = `
        <div class="custom-map-popup">
          <div class="popup-cluster-header">
            <span class="popup-title">${cluster.name}</span>
            <span class="popup-count-badge">${cluster.eventCount} INCIDENTS</span>
          </div>
          <div style="font-size:10px; font-family:var(--font-mono); color:var(--text-muted);">
            Reported by <span style="color:var(--text-secondary); font-weight:600;">${cluster.busCount} buses:</span> ${busesListStr}
          </div>
          <div style="font-size:10px; font-family:var(--font-mono); color:var(--text-secondary); background:var(--bg-surface-2); padding:6px; border-radius:3px; border:1px solid var(--border-dim);">
            ${catBreakdown}
          </div>
          <div style="margin-top:2px;">
            <button class="btn btn-primary btn-xs" style="width:100%;" onclick="window.App.navigateTo('complaints');">
              View Complaints for this Sector →
            </button>
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml, {
        maxWidth: 290,
        className: 'custom-leaflet-popup'
      });

      markersLayer.addLayer(circle);

      // Subtle outer pulsing halo for high severity clusters
      if (cluster.maxSeverity === 'high') {
        const pulseCircle = L.circleMarker([cluster.lat, cluster.lng], {
          radius: radius + 8,
          fillColor: 'transparent',
          color: '#EF4444',
          weight: 1.5,
          dashArray: '3, 4',
          opacity: 0.6
        });
        markersLayer.addLayer(pulseCircle);
      }
    });
  }

  function resize() {
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }

  return {
    init,
    refresh: loadMapClusters,
    resize
  };
})();
