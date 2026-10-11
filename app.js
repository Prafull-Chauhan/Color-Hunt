/**
 * SPECTRA INDUSTRIAL COLOR METROLOGY ENGINE
 * ASTM D2244 / ISO 11664-6 Compliant Computer Vision System
 */

(function () {
  'use strict';

  // --- COLOR METROLOGY & ILLUMINANT D65 MATRIX ---
  const ColorScience = {
    D65: { X: 95.047, Y: 100.0, Z: 108.883 },

    inverseCompand(val8Bit) {
      const v = Math.max(0, Math.min(255, val8Bit)) / 255.0;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    },

    compand(linear) {
      const clamped = Math.max(0, Math.min(1, linear));
      const v = clamped <= 0.0031308
        ? 12.92 * clamped
        : 1.055 * Math.pow(clamped, 1.0 / 2.4) - 0.055;
      return Math.round(Math.max(0, Math.min(255, v * 255.0)));
    },

    srgbToXyz(r, g, b) {
      const rL = this.inverseCompand(r);
      const gL = this.inverseCompand(g);
      const bL = this.inverseCompand(b);

      return {
        X: (rL * 0.4124564 + gL * 0.3575761 + bL * 0.1804375) * 100.0,
        Y: (rL * 0.2126729 + gL * 0.7151522 + bL * 0.0721750) * 100.0,
        Z: (rL * 0.0193339 + gL * 0.1191920 + bL * 0.9503041) * 100.0
      };
    },

    xyzToLab(X, Y, Z) {
      const xr = X / this.D65.X;
      const yr = Y / this.D65.Y;
      const zr = Z / this.D65.Z;
      const eps = 216.0 / 24389.0;
      const kap = 24389.0 / 27.0;

      const fx = xr > eps ? Math.cbrt(xr) : (kap * xr + 16.0) / 116.0;
      const fy = yr > eps ? Math.cbrt(yr) : (kap * yr + 16.0) / 116.0;
      const fz = zr > eps ? Math.cbrt(zr) : (kap * zr + 16.0) / 116.0;

      return {
        L: Math.max(0, Math.min(100, 116.0 * fy - 16.0)),
        a: 500.0 * (fx - fy),
        b: 200.0 * (fy - fz)
      };
    },

    labToXyz(L, a, b) {
      const fy = (L + 16.0) / 116.0;
      const fx = a / 500.0 + fy;
      const fz = fy - b / 200.0;
      const eps = 216.0 / 24389.0;
      const kap = 24389.0 / 27.0;

      const xr = Math.pow(fx, 3) > eps ? Math.pow(fx, 3) : (116.0 * fx - 16.0) / kap;
      const yr = L > (kap * eps) ? Math.pow((L + 16.0) / 116.0, 3) : L / kap;
      const zr = Math.pow(fz, 3) > eps ? Math.pow(fz, 3) : (116.0 * fz - 16.0) / kap;

      return {
        X: Math.max(0, xr * this.D65.X),
        Y: Math.max(0, yr * this.D65.Y),
        Z: Math.max(0, zr * this.D65.Z)
      };
    },

    xyzToSrgb(X, Y, Z) {
      const x = X / 100.0;
      const y = Y / 100.0;
      const z = Z / 100.0;

      const rL = x *  3.2404542 + y * -1.5371385 + z * -0.4985314;
      const gL = x * -0.9692660 + y *  1.8760108 + z *  0.0415560;
      const bL = x *  0.0556434 + y * -0.2040259 + z *  1.0572252;

      return {
        r: this.compand(rL),
        g: this.compand(gL),
        b: this.compand(bL)
      };
    },

    rgbToLab(r, g, b) {
      const xyz = this.srgbToXyz(r, g, b);
      return this.xyzToLab(xyz.X, xyz.Y, xyz.Z);
    },

    labToRgb(L, a, b) {
      const xyz = this.labToXyz(L, a, b);
      return this.xyzToSrgb(xyz.X, xyz.Y, xyz.Z);
    },

    computeDeltaE00(lab1, lab2) {
      const { L: L1, a: a1, b: b1 } = lab1;
      const { L: L2, a: a2, b: b2 } = lab2;

      const C1 = Math.hypot(a1, b1);
      const C2 = Math.hypot(a2, b2);
      const Cbar = (C1 + C2) / 2.0;
      const Cbar7 = Math.pow(Cbar, 7);
      const G = 0.5 * (1.0 - Math.sqrt(Cbar7 / (Cbar7 + 6103515625)));

      const a1p = (1.0 + G) * a1;
      const a2p = (1.0 + G) * a2;
      const C1p = Math.hypot(a1p, b1);
      const C2p = Math.hypot(a2p, b2);

      const rad2deg = 180.0 / Math.PI;
      const deg2rad = Math.PI / 180.0;

      const h1p = (C1p === 0) ? 0 : ((Math.atan2(b1, a1p) * rad2deg + 360.0) % 360.0);
      const h2p = (C2p === 0) ? 0 : ((Math.atan2(b2, a2p) * rad2deg + 360.0) % 360.0);

      const deltaLp = L2 - L1;
      const deltaCp = C2p - C1p;

      let deltahp = 0;
      if (C1p * C2p !== 0) {
        const diff = h2p - h1p;
        if (Math.abs(diff) <= 180.0) deltahp = diff;
        else if (diff > 180.0) deltahp = diff - 360.0;
        else deltahp = diff + 360.0;
      }
      const deltaHp = 2.0 * Math.sqrt(C1p * C2p) * Math.sin((deltahp * deg2rad) / 2.0);

      const Lbarp = (L1 + L2) / 2.0;
      const Cbarp = (C1p + C2p) / 2.0;

      let hbarp = 0;
      if (C1p * C2p !== 0) {
        const diff = Math.abs(h1p - h2p);
        const sum = h1p + h2p;
        if (diff <= 180.0) hbarp = sum / 2.0;
        else if (sum < 360.0) hbarp = (sum + 360.0) / 2.0;
        else hbarp = (sum - 360.0) / 2.0;
      } else {
        hbarp = h1p + h2p;
      }

      const T = 1.0 - 0.17 * Math.cos((hbarp - 30.0) * deg2rad)
                    + 0.24 * Math.cos((2.0 * hbarp) * deg2rad)
                    + 0.32 * Math.cos((3.0 * hbarp + 6.0) * deg2rad)
                    - 0.20 * Math.cos((4.0 * hbarp - 63.0) * deg2rad);

      const deltaTheta = 30.0 * Math.exp(-Math.pow((hbarp - 275.0) / 25.0, 2));
      const Cbarp7 = Math.pow(Cbarp, 7);
      const RC = 2.0 * Math.sqrt(Cbarp7 / (Cbarp7 + 6103515625));
      const SL = 1.0 + (0.015 * Math.pow(Lbarp - 50.0, 2)) / Math.sqrt(20.0 + Math.pow(Lbarp - 50.0, 2));
      const SC = 1.0 + 0.045 * Cbarp;
      const SH = 1.0 + 0.015 * Cbarp * T;
      const RT = -Math.sin(2.0 * deltaTheta * deg2rad) * RC;

      const termL = deltaLp / (SL || 1);
      const termC = deltaCp / (SC || 1);
      const termH = deltaHp / (SH || 1);

      return Math.sqrt(Math.max(0, Math.pow(termL, 2) + Math.pow(termC, 2) + Math.pow(termH, 2) + RT * termC * termH));
    },

    rgbToHex(r, g, b) {
      return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('').toUpperCase();
    },

    rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    },

    calculateWcagContrast(r, g, b) {
      const getLum = (val) => {
        const norm = val / 255;
        return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
      };
      const l = 0.2126 * getLum(r) + 0.7152 * getLum(g) + 0.0722 * getLum(b);
      const ratioWhite = (1 + 0.05) / (l + 0.05);
      const ratioBlack = (l + 0.05) / (0 + 0.05);
      return Math.max(ratioWhite, ratioBlack).toFixed(1);
    },

    resolveName(r, g, b) {
      const { h, s, l } = this.rgbToHsl(r, g, b);
      if (l < 10) return "Jet Carbon Black";
      if (l > 92 && s < 10) return "Specular White";
      if (s < 12) {
        if (l < 35) return "Industrial Charcoal";
        if (l < 65) return "Neutral Mid-Gray";
        return "Anodized Silver";
      }

      let tone = "";
      if (l < 28) tone = "Deep ";
      else if (l > 75) tone = "Light ";
      else if (s > 75) tone = "Vibrant ";

      let hue = "Spectrum";
      if (h >= 350 || h < 12) hue = "Ruby Oxide";
      else if (h < 40) hue = "Safety Orange";
      else if (h < 65) hue = "Industrial Yellow";
      else if (h < 155) hue = "Signal Green";
      else if (h < 195) hue = "Cyan Matrix";
      else if (h < 255) hue = "Process Cobalt";
      else if (h < 290) hue = "Reflective Violet";
      else if (h < 330) hue = "Magenta Pulse";
      else hue = "Crimson Accent";

      return `${tone}${hue}`;
    }
  };

  // --- APPLICATION STATE ---
  const state = {
    stream: null,
    rafId: null,
    facingMode: 'environment',
    precisionMode: false,
    isLocked: false,
    isTransitioning: false,
    isImageMode: false,
    lastTime: 0,
    targetNormalizedPos: { x: 0.5, y: 0.5 },
    currentReading: null,
    historyLog: JSON.parse(localStorage.getItem('spectra_log') || '[]'),
    matrixElements: []
  };

  const dom = {
    video: document.getElementById('cameraStream'),
    staticImage: document.getElementById('staticImagePreview'),
    fileInput: document.getElementById('fileUploadInput'),
    viewportCard: document.getElementById('viewportCard'),
    reticle: document.getElementById('reticle'),
    canvas: document.getElementById('samplerCanvas'),
    reticleCore: document.getElementById('reticleColorCore'),
    streamIndicator: document.getElementById('streamIndicator'),
    streamStatus: document.getElementById('streamStatus'),
    deviceFpsChip: document.getElementById('deviceFpsChip'),
    viewportPrompt: document.getElementById('viewportPrompt'),
    stageCover: document.getElementById('stageCover'),
    noticeBanner: document.getElementById('noticeBanner'),
    btnPower: document.getElementById('btnPower'),
    btnCoverPower: document.getElementById('btnCoverPower'),
    btnUpload: document.getElementById('btnUpload'),
    btnCoverUpload: document.getElementById('btnCoverUpload'),
    btnFlip: document.getElementById('btnFlip'),
    btnLock: document.getElementById('btnLock'),
    lockText: document.getElementById('lockText'),
    btnSave: document.getElementById('btnSave'),
    modeQuick: document.getElementById('modeQuick'),
    modePrecision: document.getElementById('modePrecision'),
    scanMethodBadge: document.getElementById('scanMethod'),
    targetSwatch: document.getElementById('targetSwatch'),
    contrastBadge: document.getElementById('contrastBadge'),
    colorName: document.getElementById('colorName'),
    hexDisplay: document.getElementById('hexDisplay'),
    rgbVector: document.getElementById('rgbVector'),
    barR: document.getElementById('barR'),
    barG: document.getElementById('barG'),
    barB: document.getElementById('barB'),
    copyHex: document.getElementById('copyHex'),
    copyRgb: document.getElementById('copyRgb'),
    qualityPercent: document.getElementById('qualityPercent'),
    qualityFill: document.getElementById('qualityFill'),
    varianceValue: document.getElementById('varianceValue'),
    varianceFill: document.getElementById('varianceFill'),
    shadeMatrix: document.getElementById('shadeMatrix'),
    detailsAccordion: document.getElementById('detailsAccordion'),
    accordionBody: document.getElementById('accordionBody'),
    accIcon: document.getElementById('accIcon'),
    labCoords: document.getElementById('labCoords'),
    xyzCoords: document.getElementById('xyzCoords'),
    hslCoords: document.getElementById('hslCoords'),
    lumCoords: document.getElementById('lumCoords'),
    outliersCoords: document.getElementById('outliersCoords'),
    clearLog: document.getElementById('clearLog'),
    exportLog: document.getElementById('exportLog'),
    logScroller: document.getElementById('logScroller'),
    toast: document.getElementById('toastNotification')
  };

  const ctx = dom.canvas.getContext('2d', { willReadFrequently: true });

  function setupMatrixDOM() {
    dom.shadeMatrix.innerHTML = '';
    state.matrixElements = [];
    for (let i = 0; i < 12; i++) {
      const cell = document.createElement('div');
      cell.className = 'matrix-cell';
      cell.tabIndex = 0;
      cell.innerHTML = `
        <div class="cell-swatch"></div>
        <div class="cell-meta">
          <div class="cell-meta-top">
            <span class="cell-hex">#000000</span>
            <span class="cell-delta">&Delta;0.0</span>
          </div>
          <span class="cell-tag">Vector</span>
        </div>
      `;
      dom.shadeMatrix.appendChild(cell);
      const hexSpan = cell.querySelector('.cell-hex');
      state.matrixElements.push({
        container: cell,
        swatch: cell.querySelector('.cell-swatch'),
        hexLabel: hexSpan,
        deltaLabel: cell.querySelector('.cell-delta'),
        descLabel: cell.querySelector('.cell-tag')
      });

      cell.addEventListener('click', () => copyData(hexSpan.textContent));
    }
  }

  async function activateCameraStream() {
    if (state.isTransitioning) return;
    state.isTransitioning = true;
    hideNotice();

    if (state.isImageMode) {
      dom.staticImage.style.display = 'none';
      dom.video.style.display = 'block';
      state.isImageMode = false;
    }

    const isSecure = window.isSecureContext || ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (!isSecure) {
      showNotice("Camera access requires an HTTPS context or localhost.");
      state.isTransitioning = false;
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      showNotice("WebRTC Camera API is unavailable on this device.");
      state.isTransitioning = false;
      return;
    }

    dom.streamStatus.textContent = "SYNCHRONIZING...";

    const configurations = [
      { video: { facingMode: { ideal: state.facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
      { video: { facingMode: state.facingMode }, audio: false },
      { video: true, audio: false }
    ];

    let validStream = null;
    for (const spec of configurations) {
      try {
        validStream = await navigator.mediaDevices.getUserMedia(spec);
        if (validStream) break;
      } catch (err) {
        console.warn("Sensor fallback probe:", err);
      }
    }

    if (!validStream) {
      showNotice("Hardware sensor unreachable. Verify system permissions.");
      dom.streamStatus.textContent = "OFFLINE";
      state.isTransitioning = false;
      return;
    }

    state.stream = validStream;
    dom.video.srcObject = validStream;
    dom.video.classList.toggle('is-mirrored', state.facingMode === 'user');

    dom.video.onloadedmetadata = async () => {
      try {
        await dom.video.play();
        dom.stageCover.style.display = 'none';
        setSensorEngagedUI(true);
        startProcessingLoop();
      } catch (e) {
        showNotice("Autoplay blocked. Tap within the stage to engage sensor feed.");
      } finally {
        state.isTransitioning = false;
      }
    };
  }

  function terminateCameraStream() {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
      state.stream = null;
    }

    dom.video.srcObject = null;
    if (!state.isImageMode) {
      dom.stageCover.style.display = 'flex';
      setSensorEngagedUI(false);
    }
  }

  function setSensorEngagedUI(isEngaged) {
    if (isEngaged) {
      dom.btnPower.classList.replace('btn-primary', 'btn-warning');
      dom.btnPower.querySelector('span').textContent = 'Disengage';
      dom.btnFlip.disabled = false;
      dom.btnLock.disabled = false;
      dom.btnSave.disabled = false;
      dom.streamIndicator.className = "status-beacon live";
      dom.streamStatus.textContent = "OPTICAL RUNNING";
      dom.viewportPrompt.textContent = "Click or drag anywhere on feed to sample coordinate";
    } else {
      dom.btnPower.classList.replace('btn-warning', 'btn-primary');
      dom.btnPower.querySelector('span').textContent = 'Power Sensor';
      dom.btnFlip.disabled = true;
      dom.btnLock.disabled = true;
      dom.btnSave.disabled = true;
      dom.streamIndicator.className = "status-beacon";
      dom.streamStatus.textContent = "SENSOR STANDBY";
      dom.viewportPrompt.textContent = "Initialize sensor to start color analysis";
      dom.deviceFpsChip.textContent = "0.0 FPS";
    }
  }

  async function flipSensorLens() {
    if (!state.stream || state.isTransitioning) return;
    state.facingMode = (state.facingMode === 'environment') ? 'user' : 'environment';
    terminateCameraStream();
    await activateCameraStream();
  }

  // --- IMAGE UPLOAD SUPPORT ---
  function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      terminateCameraStream();
      state.isImageMode = true;
      dom.video.style.display = 'none';
      dom.staticImage.src = e.target.result;
      dom.staticImage.style.display = 'block';
      dom.stageCover.style.display = 'none';
      setSensorEngagedUI(true);
      dom.btnFlip.disabled = true;
      dom.streamStatus.textContent = "STATIC SAMPLE";
      dom.streamIndicator.className = "status-beacon locked";

      dom.staticImage.onload = () => {
        analyzeStaticFrame();
      };
    };
    reader.readAsDataURL(file);
  }

  function executeColorExtraction(sourceElement, isVideo = true) {
    const sw = isVideo ? sourceElement.videoWidth : sourceElement.naturalWidth;
    const sh = isVideo ? sourceElement.videoHeight : sourceElement.naturalHeight;
    const cw = sourceElement.clientWidth;
    const ch = sourceElement.clientHeight;
    if (!sw || !sh || !cw || !ch) return null;

    const sRatio = sw / sh;
    const cRatio = cw / ch;

    let rendW, rendH, rendX, rendY;
    if (cRatio > sRatio) {
      rendW = sw;
      rendH = sw / cRatio;
      rendX = 0;
      rendY = (sh - rendH) / 2;
    } else {
      rendW = sh * cRatio;
      rendH = sh;
      rendX = (sw - rendW) / 2;
      rendY = 0;
    }

    const kernel = state.precisionMode ? 32 : 20;
    const half = kernel / 2;

    const sampleCenterX = rendX + (state.targetNormalizedPos.x * rendW);
    const sampleCenterY = rendY + (state.targetNormalizedPos.y * rendH);

    const startX = Math.max(0, Math.min(sw - kernel, Math.floor(sampleCenterX - half)));
    const startY = Math.max(0, Math.min(sh - kernel, Math.floor(sampleCenterY - half)));

    if (dom.canvas.width !== kernel || dom.canvas.height !== kernel) {
      dom.canvas.width = kernel;
      dom.canvas.height = kernel;
    }

    ctx.drawImage(sourceElement, startX, startY, kernel, kernel, 0, 0, kernel, kernel);

    let pixels;
    try {
      pixels = ctx.getImageData(0, 0, kernel, kernel).data;
    } catch (e) {
      return null;
    }

    const total = kernel * kernel;
    const samples = [];
    let rejectedGlare = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      if ((r > 248 && g > 248 && b > 248) || (r < 8 && g < 8 && b < 8)) {
        rejectedGlare++;
        continue;
      }
      samples.push({ r, g, b });
    }

    const cleanSamples = samples.length >= 8 ? samples : [{ r: pixels[0], g: pixels[1], b: pixels[2] }];

    const computeTrimmedChannel = (arr) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const start = Math.floor(sorted.length * 0.15);
      const end = Math.ceil(sorted.length * 0.85);
      const sub = sorted.slice(start, end);
      return sub.reduce((a, b) => a + b, 0) / (sub.length || 1);
    };

    const meanR = Math.round(computeTrimmedChannel(cleanSamples.map(p => p.r)));
    const meanG = Math.round(computeTrimmedChannel(cleanSamples.map(p => p.g)));
    const meanB = Math.round(computeTrimmedChannel(cleanSamples.map(p => p.b)));

    let varianceSum = 0;
    cleanSamples.forEach(p => {
      varianceSum += Math.abs(p.r - meanR) + Math.abs(p.g - meanG) + Math.abs(p.b - meanB);
    });
    const avgSpatialVariance = varianceSum / (cleanSamples.length * 3);

    return {
      r: meanR,
      g: meanG,
      b: meanB,
      variance: avgSpatialVariance,
      outlierRatio: rejectedGlare / total
    };
  }

  function startProcessingLoop() {
    let frameCounter = 0;
    let lastFpsStamp = performance.now();

    function cycle(timestamp) {
      if (!state.stream || state.isImageMode) return;

      const threshold = state.precisionMode ? 40 : 20;
      if (!state.isLocked && (timestamp - state.lastTime >= threshold)) {
        state.lastTime = timestamp;
        analyzeFrame();
      }

      frameCounter++;
      if (timestamp - lastFpsStamp >= 1000) {
        const fps = ((frameCounter * 1000) / (timestamp - lastFpsStamp)).toFixed(1);
        dom.deviceFpsChip.textContent = `${fps} FPS`;
        frameCounter = 0;
        lastFpsStamp = timestamp;
      }

      state.rafId = requestAnimationFrame(cycle);
    }

    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(cycle);
  }

  function analyzeFrame() {
    if (dom.video.readyState < 2) return;
    const sample = executeColorExtraction(dom.video, true);
    if (!sample) return;
    processSamplePayload(sample);
  }

  function analyzeStaticFrame() {
    const sample = executeColorExtraction(dom.staticImage, false);
    if (!sample) return;
    processSamplePayload(sample);
  }

  function processSamplePayload(sample) {
    const { r, g, b, variance, outlierRatio } = sample;
    const hex = ColorScience.rgbToHex(r, g, b);
    const lab = ColorScience.rgbToLab(r, g, b);
    const xyz = ColorScience.srgbToXyz(r, g, b);
    const hsl = ColorScience.rgbToHsl(r, g, b);
    const name = ColorScience.resolveName(r, g, b);
    const wcag = ColorScience.calculateWcagContrast(r, g, b);

    const qualityScore = Math.max(10, Math.min(99, Math.round(100 - (variance * 2.2) - (outlierRatio * 60))));

    state.currentReading = { r, g, b, hex, lab, xyz, hsl, name, wcag, qualityScore, variance, outlierRatio };
    renderDashboard(state.currentReading);
  }

  function renderDashboard(data) {
    const { r, g, b, hex, lab, xyz, hsl, name, wcag, qualityScore, variance, outlierRatio } = data;

    dom.reticleCore.style.backgroundColor = hex;
    dom.targetSwatch.style.backgroundColor = hex;
    dom.contrastBadge.textContent = `WCAG: ${wcag}:1`;
    dom.colorName.textContent = name;
    dom.hexDisplay.textContent = hex;
    dom.rgbVector.textContent = `RGB: (${r}, ${g}, ${b})`;

    dom.barR.style.width = `${(r / 255) * 100}%`;
    dom.barG.style.width = `${(g / 255) * 100}%`;
    dom.barB.style.width = `${(b / 255) * 100}%`;

    dom.qualityPercent.textContent = `${qualityScore}%`;
    dom.qualityFill.style.width = `${qualityScore}%`;
    dom.qualityFill.style.backgroundColor = qualityScore > 75 ? 'var(--accent-green)' : (qualityScore > 45 ? 'var(--accent-amber)' : 'var(--accent-rose)');

    const varMeterVal = Math.min(100, Math.round(variance * 5));
    dom.varianceValue.textContent = `±${variance.toFixed(2)}`;
    dom.varianceFill.style.width = `${varMeterVal}%`;

    dom.labCoords.textContent = `L*: ${lab.L.toFixed(1)} a*: ${lab.a.toFixed(1)} b*: ${lab.b.toFixed(1)}`;
    dom.xyzCoords.textContent = `X: ${xyz.X.toFixed(1)} Y: ${xyz.Y.toFixed(1)} Z: ${xyz.Z.toFixed(1)}`;
    dom.hslCoords.textContent = `${hsl.h}° / ${hsl.s}% / ${hsl.l}%`;
    dom.lumCoords.textContent = `${(xyz.Y / 100).toFixed(3)} rel`;
    dom.outliersCoords.textContent = `${(outlierRatio * 100).toFixed(1)}%`;

    updateShadeMatrix(lab);
  }

  function updateShadeMatrix(centerLab) {
    const vectors = [
      { dL: 0,    da: 0,    db: 0,    desc: "Target Match" },
      { dL: 3.5,  da: 0,    db: 0,    desc: "High Lum Tint" },
      { dL: -3.5, da: 0,    db: 0,    desc: "Deep Shade" },
      { dL: 0,    da: 3.2,  db: 1.5,  desc: "Warm Vector" },
      { dL: 0,    da: -3.2, db: -1.5, desc: "Cool Vector" },
      { dL: 2.0,  da: 4.5,  db: -2.0, desc: "Saturation Boost" },
      { dL: -2.0, da: -4.5, db: 2.0,  desc: "Muted Low-Tone" },
      { dL: 6.0,  da: 0,    db: 0,    desc: "Specular Tint" },
      { dL: -6.0, da: 0,    db: 0,    desc: "Umbra Tone" },
      { dL: 0,    da: -2.0, db: 4.0,  desc: "Amber Bias" },
      { dL: 0,    da: 2.0,  db: -4.0, desc: "Cyan Bias" },
      { dL: 1.5,  da: 2.5,  db: 2.5,  desc: "Chroma Push" }
    ];

    vectors.forEach((vec, idx) => {
      const node = state.matrixElements[idx];
      if (!node) return;

      const modLab = {
        L: Math.max(0, Math.min(100, centerLab.L + vec.dL)),
        a: centerLab.a + vec.da,
        b: centerLab.b + vec.db
      };

      const srgb = ColorScience.labToRgb(modLab.L, modLab.a, modLab.b);
      const hex = ColorScience.rgbToHex(srgb.r, srgb.g, srgb.b);
      const clippedLab = ColorScience.rgbToLab(srgb.r, srgb.g, srgb.b);
      const deltaE = ColorScience.computeDeltaE00(centerLab, clippedLab);

      node.swatch.style.backgroundColor = hex;
      node.hexLabel.textContent = hex;
      node.deltaLabel.innerHTML = `&Delta;${deltaE.toFixed(1)}`;
      node.descLabel.textContent = vec.desc;
    });
  }

  function toggleColorLock() {
    state.isLocked = !state.isLocked;
    if (state.isLocked) {
      dom.btnLock.classList.replace('btn-warning', 'btn-primary');
      dom.lockText.textContent = 'Unlock Stream';
      dom.streamIndicator.className = "status-beacon locked";
      dom.streamStatus.textContent = "FREEZE FRAME";
      showToast("Color metrology coordinate locked.");
    } else {
      dom.btnLock.classList.replace('btn-primary', 'btn-warning');
      dom.lockText.textContent = 'Hold Lock';
      dom.streamIndicator.className = "status-beacon live";
      dom.streamStatus.textContent = "OPTICAL RUNNING";
      showToast("Real-time optical stream resumed.");
    }
  }

  function storeCurrentReading() {
    if (!state.currentReading) return;
    const entry = {
      hex: state.currentReading.hex,
      name: state.currentReading.name,
      rgb: `rgb(${state.currentReading.r}, ${state.currentReading.g}, ${state.currentReading.b})`,
      lab: `L:${state.currentReading.lab.L.toFixed(1)} a:${state.currentReading.lab.a.toFixed(1)} b:${state.currentReading.lab.b.toFixed(1)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    state.historyLog.unshift(entry);
    if (state.historyLog.length > 30) state.historyLog.pop();

    try {
      localStorage.setItem('spectra_log', JSON.stringify(state.historyLog));
    } catch (e) {
      console.warn("Storage quota exceeded", e);
    }

    renderHistoryTray();
    showToast(`Registered ${entry.hex} in session log`);
  }

  function exportLogCSV() {
    if (!state.historyLog.length) {
      showToast("No logged data to export.");
      return;
    }
    const headers = "Timestamp,Color Name,HEX,RGB,Lab\n";
    const rows = state.historyLog.map(i => `"${i.time}","${i.name}","${i.hex}","${i.rgb}","${i.lab}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SPECTRA_METROLOGY_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Session CSV exported.");
  }

  function renderHistoryTray() {
    if (!state.historyLog.length) {
      dom.logScroller.innerHTML = '<div class="empty-state">No recorded points in memory</div>';
      return;
    }

    dom.logScroller.innerHTML = '';
    state.historyLog.forEach(item => {
      const chip = document.createElement('div');
      chip.className = 'history-item';
      chip.tabIndex = 0;
      chip.title = `${item.name} (${item.time})`;
      chip.innerHTML = `
        <div class="item-swatch" style="background-color: ${item.hex}"></div>
        <div class="item-hex">${item.hex}</div>
      `;
      chip.addEventListener('click', () => copyData(item.hex));
      dom.logScroller.appendChild(chip);
    });
  }

  function copyData(str) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(str).then(() => showToast(`Copied ${str}`)).catch(() => fallbackCopy(str));
    } else {
      fallbackCopy(str);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(`Copied ${text}`);
    } catch (e) {
      showToast("Clipboard permission rejected.");
    }
    document.body.removeChild(ta);
  }

  let toastTimer;
  function showToast(msg) {
    dom.toast.textContent = msg;
    dom.toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => dom.toast.classList.remove('visible'), 2200);
  }

  function showNotice(msg) {
    dom.noticeBanner.textContent = msg;
    dom.noticeBanner.style.display = 'block';
  }

  function hideNotice() {
    dom.noticeBanner.style.display = 'none';
  }

  // --- RETICLE TARGETING ---
  function updateReticlePosition(clientX, clientY) {
    const rect = dom.viewportCard.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const clampedY = Math.max(0, Math.min(rect.height, clientY - rect.top));

    state.targetNormalizedPos = {
      x: clampedX / rect.width,
      y: clampedY / rect.height
    };

    dom.reticle.style.left = `${clampedX}px`;
    dom.reticle.style.top = `${clampedY}px`;

    if (state.isImageMode) {
      analyzeStaticFrame();
    }
  }

  dom.viewportCard.addEventListener('pointerdown', (e) => {
    if (!state.stream && !state.isImageMode) return;
    updateReticlePosition(e.clientX, e.clientY);
  });

  // Drag and drop for images
  dom.viewportCard.addEventListener('dragover', (e) => e.preventDefault());
  dom.viewportCard.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handleImageFile(e.dataTransfer.files[0]);
  });

  // --- EVENT ATTACHMENTS ---
  dom.btnPower.addEventListener('click', () => {
    if (state.stream) terminateCameraStream();
    else activateCameraStream();
  });
  dom.btnCoverPower.addEventListener('click', activateCameraStream);

  dom.btnFlip.addEventListener('click', flipSensorLens);
  dom.btnLock.addEventListener('click', toggleColorLock);
  dom.btnSave.addEventListener('click', storeCurrentReading);
  dom.exportLog.addEventListener('click', exportLogCSV);

  dom.btnUpload.addEventListener('click', () => dom.fileInput.click());
  dom.btnCoverUpload.addEventListener('click', () => dom.fileInput.click());
  dom.fileInput.addEventListener('change', (e) => {
    if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
  });

  dom.modeQuick.addEventListener('click', () => {
    state.precisionMode = false;
    dom.modeQuick.classList.add('active');
    dom.modePrecision.classList.remove('active');
    dom.scanMethodBadge.textContent = 'TRIMMED MEAN (20PX)';
  });

  dom.modePrecision.addEventListener('click', () => {
    state.precisionMode = true;
    dom.modePrecision.classList.add('active');
    dom.modeQuick.classList.remove('active');
    dom.scanMethodBadge.textContent = 'CONVERGENCE KERNEL (32PX)';
  });

  dom.copyHex.addEventListener('click', () => {
    if (state.currentReading) copyData(state.currentReading.hex);
  });

  dom.copyRgb.addEventListener('click', () => {
    if (state.currentReading) copyData(`rgb(${state.currentReading.r}, ${state.currentReading.g}, ${state.currentReading.b})`);
  });

  dom.detailsAccordion.addEventListener('click', () => {
    const isExpanded = dom.accordionBody.classList.toggle('expanded');
    dom.accIcon.classList.toggle('rotated', isExpanded);
  });

  dom.clearLog.addEventListener('click', () => {
    state.historyLog = [];
    localStorage.removeItem('spectra_log');
    renderHistoryTray();
    showToast("History buffer purged.");
  });

  window.addEventListener('beforeunload', terminateCameraStream);
  window.addEventListener('pagehide', terminateCameraStream);

  // Initialization
  setupMatrixDOM();
  renderHistoryTray();
})();