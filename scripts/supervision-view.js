/**
 * METRO-VISION OS: SUPERVISION VIEW CONTROLLER
 * Floating container boxes (Bus 1 - Bus 5) expanded by default
 * Complaints ready to send with proof waiting for authorization.
 */

const SupervisionView = window.SupervisionView = (() => {
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
    await loadSupervisionQueue();

    DataLayer.on('complaintUpdated', () => {
      if (containerEl && containerEl.classList.contains('active')) {
        loadSupervisionQueue();
      }
    });

    DataLayer.on('newEvent', () => {
      if (containerEl && containerEl.classList.contains('active')) {
        loadSupervisionQueue();
      }
    });
  }

  function renderLayout() {
    containerEl.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h2>
            <i data-lucide="user-check" style="color: var(--gold-light); width:18px; height:18px;"></i>
            Supervision & Dispatch Command
          </h2>
          <div class="view-desc">COMPLAINTS READY TO SEND WITH PROOF · WAITING FOR HUMAN AUTHORIZATION TO DISPATCH</div>
        </div>
        <div class="header-actions">
          <span id="supervision-pending-pill" class="nav-badge badge-gold">0 WAITING TO SEND</span>
          <button id="supervision-expand-all" class="btn btn-secondary btn-xs">Expand All</button>
          <button id="supervision-collapse-all" class="btn btn-secondary btn-xs">Collapse All</button>
        </div>
      </div>

      <div class="view-content">
        <!-- Ready to Send Banner -->
        <div class="supervision-status-banner">
          <div>
            <h4>
              <i data-lucide="shield-alert" style="color: var(--gold-light); width: 16px; height: 16px;"></i>
              COMPLAINTS READY TO SEND · AWAITING SUPERVISOR ALLOWANCE
            </h4>
            <p>Every complaint below has verified AI camera proof attached. Review the notice, adjust routing if necessary, and click <strong>Allow & Send</strong> to dispatch the ticket to municipal authorities.</p>
          </div>
          <button id="supervision-allow-all-btn" class="btn btn-primary btn-sm">
            <i data-lucide="check-check"></i> Allow All Pending
          </button>
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar" style="margin-top: 16px;">
          <div class="category-tabs-row" id="supervision-category-tabs">
            ${CATEGORIES.map(cat => `
              <button class="category-tab-btn ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
                ${cat.label}
              </button>
            `).join('')}
          </div>

          <div class="search-input-wrap">
            <i data-lucide="search"></i>
            <input id="filter-supervision-search" type="text" class="input-control" placeholder="Search case ID, summary..." />
          </div>
        </div>

        <!-- Bus Containers Stack (Bus 1, Bus 2, Bus 3...) -->
        <div id="supervision-bus-containers" style="display:flex; flex-direction:column; gap:20px;">
          <!-- Populated dynamically -->
        </div>
      </div>
    `;

    // Category filter tabs
    containerEl.querySelectorAll('#supervision-category-tabs .category-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        containerEl.querySelectorAll('#supervision-category-tabs .category-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategoryFilter = btn.getAttribute('data-category');
        loadSupervisionQueue();
      });
    });

    containerEl.querySelector('#filter-supervision-search').addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      loadSupervisionQueue();
    });

    containerEl.querySelector('#supervision-expand-all').addEventListener('click', () => {
      containerEl.querySelectorAll('.bus-container-box').forEach(el => el.classList.add('expanded'));
    });
    containerEl.querySelector('#supervision-collapse-all').addEventListener('click', () => {
      containerEl.querySelectorAll('.bus-container-box').forEach(el => el.classList.remove('expanded'));
    });

    containerEl.querySelector('#supervision-allow-all-btn').addEventListener('click', async () => {
      const allPending = await DataLayer.getComplaints({ status: 'pending_review' });
      for (const c of allPending) {
        await DataLayer.approveComplaint(c.id);
      }
      if (window.App) {
        window.App.showToast({
          title: 'BATCH DISPATCH COMPLETE',
          desc: `All ${allPending.length} pending complaints allowed & dispatched to civic authorities.`,
          severity: 'approved'
        });
      }
      loadSupervisionQueue();
    });

    if (window.lucide) lucide.createIcons();
  }

  async function loadSupervisionQueue() {
    const grouped = await DataLayer.getComplaintsByBusAndCategory({ status: 'pending_review' });
    const allEvents = await DataLayer.getEvents();
    const eventMap = {};
    allEvents.forEach(e => { eventMap[e.id] = e; });

    const listEl = containerEl.querySelector('#supervision-bus-containers');
    if (!listEl) return;
    listEl.innerHTML = '';

    const busKeys = Object.keys(grouped);
    let totalWaiting = 0;

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
      const containerBox = createBusSupervisionContainer(group.bus, visibleCategories, countInBus, eventMap);
      listEl.appendChild(containerBox);
      totalWaiting += countInBus;
    });

    const pill = containerEl.querySelector('#supervision-pending-pill');
    if (pill) pill.textContent = `${totalWaiting} WAITING TO SEND`;

    if (window.lucide) lucide.createIcons();
  }

  function createBusSupervisionContainer(bus, visibleCategories, totalCount, eventMap) {
    const box = document.createElement('div');
    // EXPANDED BY DEFAULT so floating containers are instantly visible
    box.className = 'bus-container-box expanded';
    box.id = `supervision-box-${bus.id.replace(/\s+/g, '')}`;

    box.innerHTML = `
      <div class="bus-container-header">
        <div class="bus-container-title">
          <i data-lucide="chevron-down" class="accordion-chevron" style="color:var(--gold-light); width:18px; height:18px;"></i>
          <span class="bus-container-name">${bus.id}</span>
          <span style="font-family:var(--font-mono); font-size:11.5px; color:var(--text-secondary);">(${bus.plateOrLabel})</span>
          <span style="font-size:12px; color:var(--text-muted);">· ${bus.route}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="nav-badge badge-gold">${totalCount} WAITING ALLOWANCE</span>
        </div>
      </div>

      <div class="bus-container-body">
        <div class="bus-supervision-stack" style="display:flex; flex-direction:column; gap:16px;">
          <!-- Categorized sections inserted here -->
        </div>
      </div>
    `;

    box.querySelector('.bus-container-header').addEventListener('click', () => {
      box.classList.toggle('expanded');
    });

    const stack = box.querySelector('.bus-supervision-stack');

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
                Category: ${catDef.label} (${items.length} waiting to send)
              </span>
            </span>
          </div>
          <div style="padding:16px; display:flex; flex-direction:column; gap:14px;">
            ${items.length === 0 ? `
              <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">
                No complaints waiting under ${catDef.label} for ${bus.id}.
              </div>
            ` : ''}
          </div>
        `;

        const cardsContainer = catSection.querySelector('div:last-child');
        items.forEach(c => {
          const card = createSupervisionCard(c, eventMap);
          cardsContainer.appendChild(card);
        });

        stack.appendChild(catSection);
      }
    });

    return box;
  }

  function createSupervisionCard(complaint, eventMap) {
    const card = document.createElement('div');
    card.className = 'supervision-card';
    card.id = `supervision-card-${complaint.id}`;

    const primaryEvent = complaint.linkedEvents && complaint.linkedEvents.length > 0 
      ? eventMap[complaint.linkedEvents[0]] 
      : null;

    const dateStr = new Date(complaint.createdAt).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const catLabel = MediaGenerator.categoryLabels[complaint.category] || complaint.category;

    card.innerHTML = `
      <div class="supervision-card-header">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-family:var(--font-mono); font-weight:700; font-size:13.5px; color:var(--gold-light);">${complaint.id}</span>
          <span class="badge badge-cat-${complaint.category}">${catLabel.toUpperCase()}</span>
          ${complaint.priority === 'CRITICAL' ? `<span class="badge badge-severity-high">CRITICAL</span>` : ''}
          <span class="badge badge-status-waiting_to_send">WAITING FOR SEND APPROVAL</span>
        </div>
        <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted);">
          TIMESTAMP: ${dateStr}
        </div>
      </div>

      <div class="supervision-card-grid">
        <!-- Attached Proof Frame (Clickable for full inspection) -->
        <div class="supervision-proof-frame" title="Click to view full camera telemetry">
          ${primaryEvent ? `
            <img src="${primaryEvent.mediaUrl}" alt="Proof" />
            <div class="supervision-proof-overlay">
              <span class="badge badge-gold">
                ${Math.round((primaryEvent.confidence || 0.9) * 100)}% CONF
              </span>
            </div>
          ` : `<div style="padding:16px; color:var(--text-muted);">Proof frame unavailable</div>`}
        </div>

        <!-- Editable Complaint Notice & Target Civic Authority -->
        <div style="display:flex; flex-direction:column; gap:10px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <label style="font-size:10.5px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">
              DESTINATION CIVIC AUTHORITY / DEPARTMENT
            </label>
            <select class="select-control sup-dept-select" style="width:100%;">
              <option value="Public Works Department (PWD J&K)" ${complaint.department.includes('Public Works') ? 'selected' : ''}>
                Public Works Department (PWD J&K)
              </option>
              <option value="Srinagar Municipal Corporation (SMC Drainage)" ${complaint.department.includes('Municipal') ? 'selected' : ''}>
                Srinagar Municipal Corporation (SMC Drainage & Flood Control)
              </option>
              <option value="J&K Traffic Police Srinagar" ${complaint.department.includes('Traffic Police') ? 'selected' : ''}>
                J&K Traffic Police Srinagar
              </option>
              <option value="National Highways Authority of India (NHAI J&K)" ${complaint.department.includes('NHAI') ? 'selected' : ''}>
                National Highways Authority of India (NHAI J&K)
              </option>
              <option value="Srinagar Smart City Ltd / Traffic" ${complaint.department.includes('Smart City') ? 'selected' : ''}>
                Srinagar Smart City Pedestrian Wing
              </option>
            </select>
          </div>

          <div style="display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <label style="font-size:10.5px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">
                AI-DRAFTED COMPLAINT NOTICE (EDITABLE BEFORE SENDING)
              </label>
            </div>
            <textarea class="supervision-summary-editor sup-summary-text">${complaint.summary}</textarea>
          </div>
        </div>
      </div>

      <!-- Action Toolbar -->
      <div class="supervision-card-footer">
        <div style="display:flex; align-items:center; gap:8px; font-family:var(--font-mono); font-size:11px; color:var(--text-muted);">
          <span>GPS FIX: ${primaryEvent ? `${primaryEvent.gpsLat}°N, ${primaryEvent.gpsLng}°E` : 'J&K GRID'}</span>
          <span>· BUS: <strong>${complaint.busId}</strong></span>
        </div>

        <div style="display:flex; align-items:center; gap:10px;">
          <button class="btn btn-danger btn-sm sup-reject-btn">
            <i data-lucide="x-circle"></i> Reject
          </button>
          <button class="btn btn-primary btn-sm allow-send-btn sup-allow-btn">
            <i data-lucide="send"></i> Allow & Dispatch to Authority
          </button>
        </div>
      </div>
    `;

    if (primaryEvent) {
      card.querySelector('.supervision-proof-frame').addEventListener('click', () => {
        if (window.ProofView) window.ProofView.inspectEvent(primaryEvent.id);
      });
    }

    const allowBtn = card.querySelector('.sup-allow-btn');
    allowBtn.addEventListener('click', async () => {
      allowBtn.disabled = true;
      allowBtn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> Dispatching...`;
      if (window.lucide) lucide.createIcons();

      const editedText = card.querySelector('.sup-summary-text').value.trim();
      const selectedDept = card.querySelector('.sup-dept-select').value;

      await DataLayer.approveComplaint(complaint.id, editedText, selectedDept);

      if (window.App) {
        window.App.showToast({
          title: `COMPLAINT ALLOWED & DISPATCHED · ${complaint.id}`,
          desc: `Sent to ${selectedDept}`,
          severity: 'approved'
        });
      }

      await loadSupervisionQueue();
    });

    const rejectBtn = card.querySelector('.sup-reject-btn');
    rejectBtn.addEventListener('click', async () => {
      const reason = prompt('Specify rejection reason for audit log:', 'Defect does not exceed threshold');
      if (reason !== null) {
        rejectBtn.disabled = true;
        await DataLayer.rejectComplaint(complaint.id, reason);

        if (window.App) {
          window.App.showToast({
            title: `COMPLAINT REJECTED · ${complaint.id}`,
            desc: reason,
            severity: 'high'
          });
        }

        await loadSupervisionQueue();
      }
    });

    return card;
  }

  return {
    init,
    refresh: loadSupervisionQueue
  };
})();
