/**
 * METRO-VISION OS / RESCUESYNC AI: MAIN APPLICATION CONTROLLER
 * SPA router, live telemetry synchronization, toast system, and global state.
 */

const App = window.App = (() => {
  let currentView = 'monitoring';
  const views = {};

  async function init() {
    console.log('Initializing RescueSync AI / Metro-Vision OS (J&K Intelligence Network)...');

    // Register View references
    views['monitoring'] = {
      pane: document.getElementById('view-monitoring'),
      navBtn: document.getElementById('nav-monitoring'),
      module: window.MonitoringView
    };
    views['proof'] = {
      pane: document.getElementById('view-proof'),
      navBtn: document.getElementById('nav-proof'),
      module: window.ProofView
    };
    views['complaints'] = {
      pane: document.getElementById('view-complaints'),
      navBtn: document.getElementById('nav-complaints'),
      module: window.ComplaintsView
    };
    views['supervision'] = {
      pane: document.getElementById('view-supervision'),
      navBtn: document.getElementById('nav-supervision'),
      module: window.SupervisionView
    };
    views['heatmap'] = {
      pane: document.getElementById('view-heatmap'),
      navBtn: document.getElementById('nav-heatmap'),
      module: window.HeatmapView
    };

    // Attach navigation click events
    Object.keys(views).forEach(viewKey => {
      const { navBtn } = views[viewKey];
      if (navBtn) {
        navBtn.addEventListener('click', () => {
          navigateTo(viewKey);
        });
      }
    });

    // Initialize all view modules safely
    for (const [key, v] of Object.entries(views)) {
      if (v.module && typeof v.module.init === 'function') {
        try {
          await v.module.init(v.pane);
        } catch (err) {
          console.error(`Error initializing view module ${key}:`, err);
        }
      }
    }

    // Modal close handlers
    setupModal();

    // Start UTC mission clock
    startUtcClock();

    // Initial telemetry count update
    await updateGlobalTelemetry();

    // Subscribe to DataLayer events for live count sync
    DataLayer.on('newEvent', () => updateGlobalTelemetry());
    DataLayer.on('complaintUpdated', () => updateGlobalTelemetry());
    DataLayer.on('backendConnectionChanged', ({ connected }) => {
      updateConnectionHeader(connected);
    });

    // Initial connection header sync
    updateConnectionHeader(DataLayer.isBackendConnected());

    // Switch to initial view
    navigateTo('monitoring');

    if (window.lucide) lucide.createIcons();
  }

  function updateConnectionHeader(connected) {
    const pulseDot = document.getElementById('header-pulse-dot');
    const connText = document.getElementById('header-connection-text');
    if (pulseDot && connText) {
      if (connected) {
        pulseDot.className = 'pulse-dot';
        connText.textContent = 'BACKEND CONNECTED';
        connText.style.color = 'var(--status-success)';
      } else {
        pulseDot.className = 'pulse-dot pulse-disconnected';
        connText.textContent = 'BACKEND DISCONNECTED';
        connText.style.color = '#FDA4AF';
      }
    }
  }

  function navigateTo(viewKey, params = {}) {
    if (!views[viewKey]) return;

    // Toggle active classes
    Object.keys(views).forEach(k => {
      const v = views[k];
      if (v.pane) v.pane.classList.remove('active');
      if (v.navBtn) v.navBtn.classList.remove('active');
    });

    const target = views[viewKey];
    if (target.pane) target.pane.classList.add('active');
    if (target.navBtn) target.navBtn.classList.add('active');
    currentView = viewKey;

    // Refresh target view module cleanly
    if (target.module && typeof target.module.refresh === 'function') {
      try {
        target.module.refresh();
      } catch (err) {
        console.error(`Error refreshing ${viewKey}:`, err);
      }
    }

    // Handle view-specific callbacks
    if (viewKey === 'heatmap' && target.module && target.module.resize) {
      target.module.resize();
    }

    if (window.lucide) lucide.createIcons();
  }

  async function updateGlobalTelemetry() {
    const stats = await DataLayer.getLiveStats();

    const busesOnlineEl = document.getElementById('telemetry-buses-online');
    if (busesOnlineEl) busesOnlineEl.textContent = `${stats.onlineBuses} / ${stats.totalBuses}`;

    const pendingEl = document.getElementById('telemetry-pending-count');
    if (pendingEl) pendingEl.textContent = stats.pendingComplaints;

    const highSevEl = document.getElementById('telemetry-high-sev-count');
    if (highSevEl) highSevEl.textContent = stats.highSeverityEvents;

    const badgePending = document.getElementById('badge-supervision-count');
    if (badgePending) {
      badgePending.textContent = stats.pendingComplaints;
      badgePending.style.display = stats.pendingComplaints > 0 ? 'inline-block' : 'none';
    }

    const badgeEvents = document.getElementById('badge-proof-count');
    if (badgeEvents) {
      badgeEvents.textContent = stats.totalEvents;
    }

    const badgeComplaints = document.getElementById('badge-complaints-count');
    if (badgeComplaints) {
      const allComp = await DataLayer.getComplaints();
      badgeComplaints.textContent = allComp.length;
    }
  }

  function startUtcClock() {
    const clockEl = document.getElementById('header-utc-clock');
    if (!clockEl) return;

    function tick() {
      const now = new Date();
      const timeStr = now.toISOString().replace('T', ' ').substring(11, 19) + ' UTC';
      clockEl.textContent = timeStr;
    }
    tick();
    setInterval(tick, 1000);
  }

  /* Toast Notification Center */
  function showToast({ title, desc, severity = 'live', eventId = null }) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${severity}`;

    let iconName = 'bell';
    if (severity === 'high') iconName = 'alert-triangle';
    if (severity === 'approved') iconName = 'check-circle';
    if (severity === 'med') iconName = 'info';

    toast.innerHTML = `
      <div class="toast-icon">
        <i data-lucide="${iconName}" style="width:16px; height:16px; color: ${
          severity === 'high' ? 'var(--status-danger)' : 
          severity === 'approved' ? 'var(--status-success)' : 
          'var(--gold-light)'
        };"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">
          <span>${title}</span>
          <span class="toast-time">JUST NOW</span>
        </div>
        <div class="toast-desc">${desc}</div>
      </div>
    `;

    if (eventId) {
      toast.style.cursor = 'pointer';
      toast.addEventListener('click', () => {
        inspectProofEvent(eventId);
      });
    }

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 4500);
  }

  /* Modal Dialog Center */
  function setupModal() {
    const backdrop = document.getElementById('global-modal-backdrop');
    const closeBtn = document.getElementById('global-modal-close');
    if (!backdrop || !closeBtn) return;

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.classList.contains('active')) {
        closeModal();
      }
    });
  }

  function showModal({ title, content, onOpen }) {
    const backdrop = document.getElementById('global-modal-backdrop');
    const titleEl = document.getElementById('global-modal-title');
    const bodyEl = document.getElementById('global-modal-body');

    titleEl.innerHTML = title;
    bodyEl.innerHTML = content;
    backdrop.classList.add('active');

    if (onOpen) onOpen(backdrop);
    if (window.lucide) lucide.createIcons();
  }

  function closeModal() {
    const backdrop = document.getElementById('global-modal-backdrop');
    if (backdrop) backdrop.classList.remove('active');
  }

  function inspectProofEvent(eventId) {
    if (views['proof'] && views['proof'].module) {
      views['proof'].module.inspectEvent(eventId);
    }
  }

  return {
    init,
    navigateTo,
    showToast,
    showModal,
    closeModal,
    inspectProofEvent
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
} else {
  App.init();
}
