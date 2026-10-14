/**
 * METRO-VISION OS: COMPLAINTS REGISTER CONTROLLER
 * Floating container boxes named Bus 1 - Bus 5 (Expanded by default)
 * Categorized into: Pothole, Waterlogging, Traffic Jams, Accidents, Pedestrian Vulnerability
 */

const ComplaintsView = window.ComplaintsView = (() => {
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
    await loadComplaints();

    DataLayer.on('complaintUpdated', () => {
      if (containerEl && containerEl.classList.contains('active')) {
        loadComplaints();
      }
    });

    DataLayer.on('newEvent', () => {
      if (containerEl && containerEl.classList.contains('active')) {
        loadComplaints();
      }
    });
  }

  function renderLayout() {
    containerEl.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>
            <i data-lucide="file-text" style="color: var(--gold-light); width:18px; height:18px;"></i>
            Complaints Register & Civic Routing
          </h2>
          <div class="view-desc">FLOATING COMPLAINT CONTAINERS (BUS 1 – BUS 5) · CATEGORIZED BY HAZARD TYPE</div>
        </div>
        <div class="header-actions">
          <button id="complaints-expand-all" class="btn btn-secondary btn-xs">Expand All</button>
          <button id="complaints-collapse-all" class="btn btn-secondary btn-xs">Collapse All</button>
        </div>
      </div>

      <div class="view-content">
        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="category-tabs-row" id="complaint-category-tabs">
            ${CATEGORIES.map(cat => `
              <button class="category-tab-btn ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
                ${cat.label}
              </button>
            `).join('')}
          </div>

          <div class="search-input-wrap">
            <i data-lucide="search"></i>
            <input id="filter-complaint-search" type="text" class="input-control" placeholder="Search complaint text, ID..." />
          </div>
        </div>

        <!-- Bus Containers Stack (Bus 1, Bus 2, Bus 3...) -->
        <div id="complaints-bus-containers" style="display:flex; flex-direction:column; gap:20px;">
          <!-- Injected dynamically -->
        </div>
      </div>
    `;

    // Category filter tabs
    containerEl.querySelectorAll('#complaint-category-tabs .category-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        containerEl.querySelectorAll('#complaint-category-tabs .category-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategoryFilter = btn.getAttribute('data-category');
        loadComplaints();
      });
    });

    containerEl.querySelector('#filter-complaint-search').addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      loadComplaints();
    });

    containerEl.querySelector('#complaints-expand-all').addEventListener('click', () => {
      containerEl.querySelectorAll('.bus-container-box').forEach(el => el.classList.add('expanded'));
    });
    containerEl.querySelector('#complaints-collapse-all').addEventListener('click', () => {
      containerEl.querySelectorAll('.bus-container-box').forEach(el => el.classList.remove('expanded'));
    });

    if (window.lucide) lucide.createIcons();
  }

  async function loadComplaints() {
    const grouped = await DataLayer.getComplaintsByBusAndCategory();
    const allEvents = await DataLayer.getEvents();
    const eventMap = {};
    allEvents.forEach(e => { eventMap[e.id] = e; });

    const listEl = containerEl.querySelector('#complaints-bus-containers');
    if (!listEl) return;
    listEl.innerHTML = '';

    const busKeys = Object.keys(grouped);
    let totalComplaints = 0;

    busKeys.forEach(busId => {
      const group = grouped[busId];
      const categories = group.categories;

      const visibleCategories = {};
      Object.keys(categories).forEach(catKey => {
        if (activeCategoryFilter === 'all' || activeCategoryFilter === catKey) {
          let items = categories[catKey];
          if (searchQuery) {
            items = items.filter(c => 
              c.id.toLowerCase().includes(searchQuery) ||
              c.summary.toLowerCase().includes(searchQuery) ||
              c.department.toLowerCase().includes(searchQuery)
            );
          }
          visibleCategories[catKey] = items;
        }
      });

      const countInBus = Object.values(visibleCategories).reduce((sum, arr) => sum + arr.length, 0);
      const containerBox = createBusComplaintContainer(group.bus, visibleCategories, countInBus, eventMap);
      listEl.appendChild(containerBox);
      totalComplaints += countInBus;
    });

    if (window.lucide) lucide.createIcons();
  }

  function createBusComplaintContainer(bus, visibleCategories, totalCount, eventMap) {
    const box = document.createElement('div');
    // EXPANDED BY DEFAULT so content is instantly visible
    box.className = 'bus-container-box expanded';
    box.id = `complaint-box-${bus.id.replace(/\s+/g, '')}`;

    box.innerHTML = `
      <div class="bus-container-header">
        <div class="bus-container-title">
          <i data-lucide="chevron-down" class="accordion-chevron" style="color:var(--gold-light); width:18px; height:18px;"></i>
          <span class="bus-container-name">${bus.id}</span>
          <span style="font-family:var(--font-mono); font-size:11.5px; color:var(--text-secondary);">(${bus.plateOrLabel})</span>
          <span style="font-size:12px; color:var(--text-muted);">· ${bus.route}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="nav-badge badge-gold">${totalCount} COMPLAINTS</span>
        </div>
      </div>

      <div class="bus-container-body">
        <div class="bus-complaints-stack" style="display:flex; flex-direction:column; gap:14px;">
          <!-- Categorized sections inserted here -->
        </div>
      </div>
    `;

    box.querySelector('.bus-container-header').addEventListener('click', () => {
      box.classList.toggle('expanded');
    });

    const stack = box.querySelector('.bus-complaints-stack');

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
                Category: ${catDef.label} (${items.length} complaints)
              </span>
            </span>
          </div>
          <div style="padding:14px; display:flex; flex-direction:column; gap:12px;">
            ${items.length === 0 ? `
              <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">
                No complaints recorded under ${catDef.label} for ${bus.id}.
              </div>
            ` : ''}
          </div>
        `;

        const cardsContainer = catSection.querySelector('div:last-child');
        items.forEach(c => {
          const card = createComplaintCard(c, eventMap);
          cardsContainer.appendChild(card);
        });

        stack.appendChild(catSection);
      }
    });

    return box;
  }

  function createComplaintCard(complaint, eventMap) {
    const card = document.createElement('div');
    card.className = 'interactive-card';
    card.id = `card-${complaint.id}`;
    card.style.padding = '14px';
    card.style.gap = '10px';

    const dateStr = new Date(complaint.createdAt).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let proofThumbsHtml = '';
    if (complaint.linkedEvents && complaint.linkedEvents.length > 0) {
      const thumbs = complaint.linkedEvents.map(evtId => {
        const evt = eventMap[evtId];
        if (!evt) return '';
        return `
          <div class="linked-proof-thumb" data-event-id="${evt.id}" title="${evt.type} (${evt.id}) - Click to inspect" style="
            width: 76px;
            height: 50px;
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid var(--gold-border);
            cursor: pointer;
            position: relative;
            background: #05070a;
            flex-shrink: 0;
            box-shadow: 0 0 8px rgba(245, 158, 11, 0.15);
          ">
            <img src="${evt.mediaUrl}" style="width:100%; height:100%; object-fit:cover;" alt="Proof" />
            <span style="position:absolute; bottom:1px; right:2px; font-size:8.5px; font-family:var(--font-mono); background:rgba(0,0,0,0.85); color:var(--gold-light); padding:0 3px;">
              ${Math.round((evt.confidence || 0.9) * 100)}%
            </span>
          </div>
        `;
      }).join('');

      proofThumbsHtml = `
        <div style="display:flex; align-items:center; gap:10px; margin-top:4px;">
          <span style="font-family:var(--font-mono); font-size:10px; color:var(--text-muted); text-transform:uppercase;">LINKED PROOF:</span>
          <div style="display:flex; gap:8px; overflow-x:auto;">
            ${thumbs}
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-family:var(--font-mono); font-weight:700; font-size:13px; color:var(--gold-light);">${complaint.id}</span>
          <span class="badge" style="background:var(--bg-surface-3); color:var(--text-primary); border:1px solid var(--border-subtle); text-transform:none;">
            <i data-lucide="building" style="width:11px; height:11px; color:var(--gold-light);"></i>
            ${complaint.department}
          </span>
          ${complaint.priority === 'CRITICAL' ? `<span class="badge badge-severity-high">CRITICAL PRIORITY</span>` : ''}
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="badge badge-status-${complaint.status}">${complaint.status === 'pending_review' ? 'WAITING TO SEND' : complaint.status.replace(/_/g, ' ')}</span>
          <span style="font-family:var(--font-mono); font-size:10.5px; color:var(--text-muted);">${dateStr}</span>
        </div>
      </div>

      <div style="font-size:12.5px; line-height:1.45; color:var(--text-primary); background:var(--bg-surface-1); padding:12px; border-radius:var(--radius-xs); border:1px solid var(--border-dim);">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
          <span style="background:var(--gold-subtle); border:1px solid var(--gold-border); color:var(--gold-light); font-size:9.5px; padding:1px 5px; border-radius:2px; font-family:var(--font-mono);">
            AI-SYNTHESIZED NOTICE
          </span>
          ${complaint.reviewedBy ? `<span style="font-size:9.5px; font-family:var(--font-mono); color:var(--status-success);">SUPERVISED BY ${complaint.reviewedBy}</span>` : ''}
        </div>
        <div>${complaint.summary}</div>
      </div>

      ${proofThumbsHtml}

      <div style="display:flex; align-items:center; justify-content:flex-end; gap:8px; border-top:1px solid var(--border-dim); padding-top:8px;">
        <button class="btn btn-primary btn-sm jump-supervision-btn">
          <i data-lucide="send"></i> Review in Supervision Queue →
        </button>
      </div>
    `;

    card.querySelector('.jump-supervision-btn').addEventListener('click', () => {
      if (window.App) window.App.navigateTo('supervision');
    });

    card.querySelectorAll('.linked-proof-thumb').forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        const eventId = thumb.getAttribute('data-event-id');
        if (window.ProofView) window.ProofView.inspectEvent(eventId);
      });
    });

    return card;
  }

  return {
    init,
    refresh: loadComplaints
  };
})();
