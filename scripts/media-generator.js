/**
 * METRO-VISION OS: Procedural CCTV / Edge-AI Camera Frame Generator
 * Fail-safe SVG & Canvas generator for the 5 incident categories.
 */

const MediaGenerator = window.MediaGenerator = (() => {
  const categoryColors = {
    pothole: '#F59E0B',                 // Golden Amber
    waterlogging: '#38BDF8',            // Sky Blue
    traffic_jams: '#FB923C',            // Vibrant Orange
    accidents: '#EF4444',               // Crimson Red
    pedestrian_vulnerability: '#C084FC' // Purple
  };

  const categoryLabels = {
    pothole: 'POTHOLE',
    waterlogging: 'WATERLOGGING',
    traffic_jams: 'TRAFFIC JAM',
    accidents: 'ACCIDENT / COLLISION',
    pedestrian_vulnerability: 'PEDESTRIAN RISK'
  };

  /**
   * Generates a fail-safe SVG data URI snapshot with AI bounding box & CCTV HUD
   */
  function generateEvidenceThumbnail(event) {
    const cat = event.type || 'pothole';
    const color = categoryColors[cat] || '#F59E0B';
    const label = categoryLabels[cat] || cat.toUpperCase();
    const confPct = Math.round((event.confidence || 0.88) * 100);
    const busId = event.busId || 'Bus 1';
    const timeStr = event.timestamp ? new Date(event.timestamp).toISOString().replace('T', ' ').substring(0, 19) : '2026-09-10 18:30:00';
    const lat = event.gpsLat ? Number(event.gpsLat).toFixed(4) : '34.0837';
    const lng = event.gpsLng ? Number(event.gpsLng).toFixed(4) : '74.7973';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="100%" height="100%">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0a0d14"/>
            <stop offset="40%" stop-color="#141a24"/>
            <stop offset="45%" stop-color="#202836"/>
            <stop offset="100%" stop-color="#0e1218"/>
          </linearGradient>
        </defs>

        <!-- Road & Sky Background -->
        <rect width="640" height="400" fill="url(#bgGrad)"/>

        <!-- Perspective Road Lines -->
        <path d="M 275 176 L 24 400 M 365 176 L 616 400" stroke="#2d3748" stroke-width="3"/>
        <path d="M 320 180 L 295 400" stroke="#FBBF24" stroke-width="2.5" stroke-dasharray="16, 20"/>

        <!-- Incident Visual Artifact -->
        <g transform="translate(240, 210)">
          <ellipse cx="80" cy="50" rx="75" ry="32" fill="${color}" opacity="0.25"/>
          <ellipse cx="80" cy="50" rx="60" ry="24" stroke="${color}" stroke-width="2" fill="none"/>
        </g>

        <!-- AI Neural Bounding Box -->
        <rect x="220" y="200" width="200" height="130" fill="none" stroke="${color}" stroke-width="2.5"/>
        
        <!-- Bounding Box Corner Brackets -->
        <path d="M 220 215 L 220 200 L 235 200" stroke="${color}" stroke-width="3.5" fill="none"/>
        <path d="M 405 200 L 420 200 L 420 215" stroke="${color}" stroke-width="3.5" fill="none"/>
        <path d="M 220 315 L 220 330 L 235 330" stroke="${color}" stroke-width="3.5" fill="none"/>
        <path d="M 405 330 L 420 330 L 420 315" stroke="${color}" stroke-width="3.5" fill="none"/>

        <!-- Label Tag Above Box -->
        <rect x="220" y="178" width="180" height="22" fill="${color}" rx="2"/>
        <text x="228" y="193" font-family="monospace" font-size="12" font-weight="bold" fill="#090B0E">
          ${label} · ${confPct}%
        </text>

        <!-- CCTV HUD Watermark Overlay -->
        <text x="16" y="26" font-family="monospace" font-size="11" fill="#F8FAFC">
          CAM-FRONT [${busId}] · J&amp;K SMART TRANSIT
        </text>
        <text x="430" y="26" font-family="monospace" font-size="11" fill="#FBBF24">
          EDGE INFER: 16.2ms
        </text>

        <text x="16" y="384" font-family="monospace" font-size="11" fill="#F8FAFC">
          REC ● ${timeStr} UTC
        </text>
        <text x="360" y="384" font-family="monospace" font-size="11" fill="#F8FAFC">
          LAT: ${lat}°N  LNG: ${lng}°E
        </text>

        <!-- Center Crosshair -->
        <line x1="304" y1="200" x2="336" y2="200" stroke="#FBBF24" stroke-opacity="0.4" stroke-width="1"/>
        <line x1="320" y1="184" x2="320" y2="216" stroke="#FBBF24" stroke-opacity="0.4" stroke-width="1"/>
      </svg>
    `;

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function renderLiveCameraTile(canvas, bus, activeEvent = null) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a0d14');
    gradient.addColorStop(0.42, '#141b26');
    gradient.addColorStop(0.45, '#1e2636');
    gradient.addColorStop(1, '#0e1218');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const vpX = width / 2;
    const vpY = height * 0.45;
    ctx.strokeStyle = '#2a3446';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vpX - 25, vpY);
    ctx.lineTo(12, height);
    ctx.moveTo(vpX + 25, vpY);
    ctx.lineTo(width - 12, height);
    ctx.stroke();

    ctx.strokeStyle = '#FBBF24';
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(vpX, vpY);
    ctx.lineTo(vpX - 10, height);
    ctx.stroke();
    ctx.setLineDash([]);

    if (activeEvent) {
      const color = categoryColors[activeEvent.type] || '#F59E0B';
      const boxX = width * 0.42;
      const boxY = height * 0.52;
      const boxW = width * 0.32;
      const boxH = height * 0.32;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      ctx.fillStyle = color;
      ctx.fillRect(boxX, boxY - 15, boxW, 15);
      ctx.fillStyle = '#090B0E';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      const conf = Math.round((activeEvent.confidence || 0.9) * 100);
      ctx.fillText(`${(categoryLabels[activeEvent.type] || activeEvent.type).toUpperCase()} [${conf}%]`, boxX + 4, boxY - 4);
    }

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText(`${bus.id} · ${bus.plateOrLabel}`, 8, 14);
    ctx.fillStyle = '#FBBF24';
    ctx.fillText(`${bus.speed || 36} KM/H`, width - 58, 14);
  }

  return {
    generateEvidenceThumbnail,
    renderLiveCameraTile,
    categoryColors,
    categoryLabels
  };
})();
