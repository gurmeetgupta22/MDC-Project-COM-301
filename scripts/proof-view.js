/**
 * METRO-VISION OS: PROOF EVIDENCE LIBRARY CONTROLLER
 * Floating container boxes named Bus 1 - Bus 5 (Expanded by default)
 * Categorized into: Pothole, Waterlogging, Traffic Jams, Accidents, Pedestrian Vulnerability
 */

const ProofView = window.ProofView = (() => {
  let containerEl = null;
  let activeCategoryFilter = 'all';
  let searchQuery = '';

  const CATEGORIES = [
    { id: 'all', label: 'All Categories' },
    { id: 'pothole', label: 'Pothole' },
    { id: 'waterlogging', label: 'Waterlogging' },
    { id: 'traffic_jams', label: 'Traffic Jams' },
    { id: 'accidents', label: 'Accidents' },
    { id: 'pedestrian_vulnerability', label: 'Pedestrian Vulnerability' }
  ];

  async function init(viewContainer) {
    containerEl = viewContainer;
    renderLayout();
    await loadEvidence();

    DataLayer.on('newEvent', () => {
      if (containerEl && containerEl.classList.contains('active')) {
        loadEvidence();
      }
    });
  }

  function renderLayout() {
    containerEl.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>
            <i data-lucide="shield-check" style="color: var(--gold-light); width:18px; height:18px;"></i>
            Proof Evidence Library
          </h2>
          <div class="view-desc">FLOATING EVIDENCE CONTAINERS (BUS 1 – BUS 5) · CATEGORIZED BY HAZARD TYPE</div>
        </div>
        <div class="header-actions">
          <button id="proof-expand-all" class="btn btn-secondary btn-xs">Expand All</button>
          <button id="proof-collapse-all" class="btn btn-secondary btn-xs">Collapse All</button>
        </div>
      </div>

      <div class="view-content">
        <!-- Filter Controls Bar -->
        <div class="filter-bar">
          <div class="category-tabs-row" id="proof-category-tabs">
            ${CATEGORIES.map(cat => `
              <button class="category-tab-btn ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
                ${cat.label}
              </button>
            `).join('')}
          </div>

          <div class="search-input-wrap">
            <i data-lucide="search"></i>
            <input id="filter-proof-search" type="text" class="input-control" placeholder="Search event ID, GPS, notes..." />
          </div>
        </div>

        <!-- Bus Containers Stack (Bus 1, Bus 2, Bus 3...) -->
        <div id="proof-bus-containers" style="display:flex; flex-direction:column; gap:20px;">
          <!-- Injected dynamically -->
        </div>
      </div>
    `;

    // Category filter tabs
    containerEl.querySelectorAll('#proof-category-tabs .category-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        containerEl.querySelectorAll('#proof-category-tabs .category-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategoryFilter = btn.getAttribute('data-category');
        loadEvidence();
      });
    });

    containerEl.querySelector('#filter-proof-search').addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      loadEvidence();
    });

    containerEl.querySelector('#proof-expand-all').addEventListener('click', () => {
      containerEl.querySelectorAll('.bus-container-box').forEach(el => el.classList.add('expanded'));
    });
    containerEl.querySelector('#proof-collapse-all').addEventListener('click', () => {
      containerEl.querySelectorAll('.bus-container-box').forEach(el => el.classList.remove('expanded'));
    });

    if (window.lucide) lucide.createIcons();
  }

  async function loadEvidence() {
    const groupedData = await DataLayer.getEventsByBusAndCategory();
    const listEl = containerEl.querySelector('#proof-bus-containers');
    if (!listEl) return;
    listEl.innerHTML = '';

    const busKeys = Object.keys(groupedData);
    let totalRendered = 0;

    busKeys.forEach(busId => {
      const busGroup = groupedData[busId];
      const categories = busGroup.categories;

      const visibleCategories = {};
      Object.keys(categories).forEach(catKey => {
        if (activeCategoryFilter === 'all' || activeCategoryFilter === catKey) {
          let items = categories[catKey];
          if (searchQuery) {
            items = items.filter(e => 
              e.id.toLowerCase().includes(searchQuery) ||
              e.notes.toLowerCase().includes(searchQuery) ||
              `${e.gpsLat},${e.gpsLng}`.includes(searchQuery)
            );
          }
          visibleCategories[catKey] = items;
        }
      });

      const countInBus = Object.values(visibleCategories).reduce((sum, arr) => sum + arr.length, 0);
      const containerBox = createBusProofContainer(busGroup.bus, visibleCategories, countInBus);
      listEl.appendChild(containerBox);
      totalRendered += countInBus;
    });

    if (window.lucide) lucide.createIcons();
  }

  function createBusProofContainer(bus, visibleCategories, totalCount) {
    const box = document.createElement('div');
    // EXPANDED BY DEFAULT so floating containers are instantly visible
    box.className = 'bus-container-box expanded';
    box.id = `proof-box-${bus.id.replace(/\s+/g, '')}`;

    box.innerHTML = `
      <div class="bus-container-header">
        <div class="bus-container-title">
          <i data-lucide="chevron-down" class="accordion-chevron" style="color:var(--gold-light); width:18px; height:18px;"></i>
          <span class="bus-container-name">${bus.id}</span>
          <span style="font-family:var(--font-mono); font-size:11.5px; color:var(--text-secondary);">(${bus.plateOrLabel})</span>
          <span style="font-size:12px; color:var(--text-muted);">· ${bus.route}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="nav-badge badge-gold">${totalCount} CAPTURES</span>
        </div>
      </div>

      <div class="bus-container-body">
        <div class="bus-categories-stack" style="display:flex; flex-direction:column; gap:14px;">
          <!-- Categorized sections inserted here -->
        </div>
      </div>
    `;

    box.querySelector('.bus-container-header').addEventListener('click', () => {
      box.classList.toggle('expanded');
    });

    const stack = box.querySelector('.bus-categories-stack');

    const catDefinitions = [
      { id: 'pothole', label: 'Pothole' },
      { id: 'waterlogging', label: 'Waterlogging' },
      { id: 'traffic_jams', label: 'Traffic Jams' },
      { id: 'accidents', label: 'Accidents' },
      { id: 'pedestrian_vulnerability', label: 'Pedestrian Vulnerability' }
    ];

    catDefinitions.forEach(catDef => {
      const items = visibleCategories[catDef.id] || [];
      if (activeCategoryFilter === 'all' || activeCategoryFilter === catDef.id) {
        const catSection = document.createElement('div');
        catSection.className = 'category-section-block';

        catSection.innerHTML = `
          <div class="category-section-header">
            <span class="category-section-title">
              <span class="badge badge-cat-${catDef.id}">${catDef.label.toUpperCase()}</span>
              <span style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">
                Category: ${catDef.label} (${items.length} items)
              </span>
            </span>
          </div>
          <div class="category-section-grid">
            ${items.length === 0 ? `
              <div style="grid-column: 1/-1; padding:10px 14px; font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">
                No captures recorded under ${catDef.label} for ${bus.id}.
              </div>
            ` : ''}
          </div>
        `;

        const grid = catSection.querySelector('.category-section-grid');
        items.forEach(evt => {
          const card = createEvidenceCard(evt);
          grid.appendChild(card);
        });

        stack.appendChild(catSection);
      }
    });

    return box;
  }

  function createEvidenceCard(evt) {
    const card = document.createElement('div');
    card.className = 'interactive-card';

    const dateStr = new Date(evt.timestamp).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    card.innerHTML = `
      <div style="position:relative; aspect-ratio: 16/10; background:#05070A; overflow:hidden;">
        <img src="${evt.mediaUrl}" alt="${evt.type}" style="width:100%; height:100%; object-fit:cover; display:block;" />
        <div style="position:absolute; top:6px; left:6px;">
          <span class="badge badge-severity-${evt.severity}">${evt.severity}</span>
        </div>
        <div style="position:absolute; top:6px; right:6px;">
          <span class="badge badge-gold">
            ${Math.round((evt.confidence || 0.9) * 100)}% CONF
          </span>
        </div>
      </div>
      <div style="padding:12px; display:flex; flex-direction:column; gap:6px;">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <span style="font-weight:700; font-size:12px; color:var(--gold-light);">
            ${(MediaGenerator.categoryLabels[evt.type] || evt.type).toUpperCase()}
          </span>
          <span style="font-family:var(--font-mono); font-size:10px; color:var(--text-muted);">${evt.id}</span>
        </div>
        <div style="font-size:11.5px; color:var(--text-secondary); line-height:1.4; height:32px; overflow:hidden; text-overflow:ellipsis;">
          ${evt.notes}
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:4px; font-family:var(--font-mono); font-size:10px; color:var(--text-muted); border-top:1px solid var(--border-dim); padding-top:6px;">
          <span>${dateStr}</span>
          <span>${evt.gpsLat ? evt.gpsLat.toFixed(4) : '34.0837'}°N, ${evt.gpsLng ? evt.gpsLng.toFixed(4) : '74.7973'}°E</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      openEvidenceDetailModal(evt);
    });

    return card;
  }

  function openEvidenceDetailModal(evt) {
    if (window.App && window.App.showModal) {
      const dateFull = new Date(evt.timestamp).toUTCString();
      const confPct = Math.round((evt.confidence || 0.88) * 100);
      const catLabel = MediaGenerator.categoryLabels[evt.type] || evt.type;

      window.App.showModal({
        title: `PROOF INSPECTOR · [${evt.id}] · ${evt.busId} · ${catLabel.toUpperCase()}`,
        content: `
          <div style="display:grid; grid-template-columns: 1.3fr 1fr; gap:18px;">
            <div>
              <div style="border: 1px solid var(--gold-border); border-radius:var(--radius-sm); overflow:hidden; background:#000; box-shadow:0 0 16px rgba(245,158,11,0.15);">
                <img src="${evt.mediaUrl}" alt="Full capture" style="width:100%; height:auto; display:block;" />
              </div>
              <div style="display:flex; justify-content:space-between; margin-top:8px; font-family:var(--font-mono); font-size:10.5px; color:var(--text-muted);">
                <span>J&K EDGE-CAMERA · SONY-IMX390-HDR</span>
                <span>1080p60 · OPTICAL FLOW VERIFIED</span>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px;">
              <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; padding:10px; background:var(--bg-surface-2); border:1px solid var(--border-dim); border-radius:var(--radius-xs);">
                <div>
                  <div style="font-size:9.5px; font-family:var(--font-mono); color:var(--text-muted);">CATEGORY</div>
                  <div style="font-size:12px; font-family:var(--font-mono); font-weight:700; color:var(--gold-light);">${catLabel.toUpperCase()}</div>
                </div>
                <div>
                  <div style="font-size:9.5px; font-family:var(--font-mono); color:var(--text-muted);">SEVERITY</div>
                  <div class="badge badge-severity-${evt.severity}">${evt.severity}</div>
                </div>
                <div>
                  <div style="font-size:9.5px; font-family:var(--font-mono); color:var(--text-muted);">CONFIDENCE</div>
                  <div style="font-family:var(--font-mono); font-weight:700; color:var(--gold-light);">${confPct}%</div>
                </div>
                <div>
                  <div style="font-size:9.5px; font-family:var(--font-mono); color:var(--text-muted);">BUS ID</div>
                  <div style="font-family:var(--font-mono); font-weight:700;">${evt.busId}</div>
                </div>
              </div>

              <div style="background:var(--bg-surface-2); border:1px solid var(--border-dim); border-radius:var(--radius-xs); padding:10px;">
                <div style="font-size:9.5px; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">J&K GPS COORDINATES</div>
                <div style="font-family:var(--font-mono); font-size:12px; color:var(--text-primary); display:flex; justify-content:space-between; align-items:center;">
                  <span>${evt.gpsLat}° N, ${evt.gpsLng}° E</span>
                  <button class="btn btn-xs btn-secondary" onclick="navigator.clipboard.writeText('${evt.gpsLat}, ${evt.gpsLng}'); alert('GPS coordinates copied to clipboard');">
                    Copy GPS
                  </button>
                </div>
                <div style="font-family:var(--font-mono); font-size:10px; color:var(--text-muted); margin-top:4px;">
                  TIMESTAMP: ${dateFull}
                </div>
              </div>

              <div style="background:var(--bg-surface-2); border:1px solid var(--border-dim); border-radius:var(--radius-xs); padding:10px;">
                <div style="font-size:9.5px; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">AI INCIDENT NOTES</div>
                <div style="font-size:12px; color:var(--text-secondary); line-height:1.45;">
                  ${evt.notes}
                </div>
              </div>

              <div style="margin-top:auto; display:flex; gap:10px;">
                <button id="modal-jump-supervision-btn" class="btn btn-primary btn-sm" style="flex:1;">
                  <i data-lucide="send"></i> Jump to Supervision Review
                </button>
              </div>
            </div>
          </div>
        `,
        onOpen: (modalEl) => {
          if (window.lucide) lucide.createIcons();
          const jumpBtn = modalEl.querySelector('#modal-jump-supervision-btn');
          if (jumpBtn) {
            jumpBtn.addEventListener('click', async () => {
              window.App.closeModal();
              window.App.navigateTo('supervision');
            });
          }
        }
      });
    }
  }

  return {
    init,
    refresh: loadEvidence,
    inspectEvent: (eventId) => {
      DataLayer.getEvents().then(events => {
        const found = events.find(e => e.id === eventId);
        if (found) openEvidenceDetailModal(found);
      });
    }
  };
})();
