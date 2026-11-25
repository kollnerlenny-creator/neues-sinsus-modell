import { AXIS_LABELS, MILIEUS, RIFT_LINES } from '../data/milieus';
import {
  MILIEU_IDEAL_COORDS,
  SELF_TEST_QUESTIONS,
  SELF_TEST_SCALE_OPTIONS,
} from './selfTest';

/**
 * Generates a 100% self-contained single-file HTML presentation
 * using Three.js via CDN importmap, embedded CSS, and embedded JavaScript.
 */
export function buildStandaloneHtmlString(): string {
  const dataJson = JSON.stringify({
    milieus: MILIEUS,
    axisLabels: AXIS_LABELS,
    riftLines: RIFT_LINES,
    quizQuestions: SELF_TEST_QUESTIONS,
    quizScale: SELF_TEST_SCALE_OPTIONS,
    quizIdeals: MILIEU_IDEAL_COORDS,
  });

  const scriptClose = '</' + 'script>';

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sozialstruktur Deutschland 2035 – 3D-SINUS-Transformationsmodell</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&family=Outfit:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; width: 100%; height: 100%;
      overflow: hidden; background: #0b0f19; color: #f1f5f9;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      user-select: none;
    }
    #canvas-host { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; }
    #labels-layer { position: fixed; inset: 0; pointer-events: none; z-index: 10; overflow: hidden; }
    .glass {
      background: linear-gradient(155deg, rgba(17,25,43,0.92), rgba(11,15,25,0.88));
      border: 1px solid rgba(148,163,184,0.2);
      box-shadow: 0 20px 50px rgba(2,6,23,0.65), inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .header-box {
      position: fixed; top: 18px; left: 20px; z-index: 20;
      padding: 12px 18px; border-radius: 14px; pointer-events: none;
    }
    .header-box h1 {
      margin: 0; font-family: 'Outfit', sans-serif; font-size: 18px;
      letter-spacing: 0.02em; font-weight: 700; color: #f8fafc;
    }
    .header-box p { margin: 3px 0 0; font-size: 12.5px; color: #94a3b8; }
    .legend-box {
      position: fixed; left: 20px; bottom: 20px; z-index: 20; width: 280px;
      padding: 12px 14px; border-radius: 16px; font-size: 11.5px;
    }
    .legend-title {
      margin: 0 0 7px; font-family: 'Outfit', sans-serif; font-size: 10.5px;
      letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8;
    }
    .legend-row { display: flex; gap: 8px; margin-bottom: 5px; line-height: 1.35; color: #cbd5e1; align-items: flex-start; }
    .legend-key { font-family: 'JetBrains Mono', monospace; font-weight: 600; width: 14px; flex-shrink: 0; }
    .legend-sep { border-top: 1px solid rgba(148,163,184,0.18); margin: 9px 0; padding-top: 9px; }
    .legend-milieu-btn {
      width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px;
      padding: 4px 6px; border-radius: 8px; border: 0; background: transparent; color: #e2e8f0;
      font-size: 11.5px; cursor: pointer; text-align: left; font-family: inherit;
    }
    .legend-milieu-btn:hover { background: rgba(30,41,59,0.75); color: #fff; }
    .legend-dot { width: 9px; height: 9px; border-radius: 2px; flex-shrink: 0; display: inline-block; }
    .legend-toggle-pill {
      position: fixed; left: 20px; bottom: 20px; z-index: 20;
      padding: 8px 14px; border-radius: 12px; font-size: 12px; font-weight: 600;
      color: #e2e8f0; cursor: pointer; display: none; font-family: inherit;
    }
    .legend-toggle-pill:hover { color: #fff; }
    .legend-hide-btn {
      border: 0; background: transparent; color: #94a3b8; font-size: 10.5px;
      cursor: pointer; padding: 2px 6px; border-radius: 6px; font-family: inherit;
    }
    .legend-hide-btn:hover { background: rgba(30,41,59,0.75); color: #f8fafc; }
    .dock {
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 30;
      display: flex; flex-wrap: wrap; gap: 6px; padding: 6px; border-radius: 16px;
      max-width: 94vw; justify-content: center; align-items: center;
    }
    .slider-wrap {
      display: flex; align-items: center; gap: 8px; padding: 4px 10px;
      border-radius: 11px; background: rgba(15,23,42,0.85); border: 1px solid rgba(148,163,184,0.2);
    }
    .slider-wrap input[type=range] { width: 130px; accent-color: #10b981; cursor: pointer; }
    .dock button {
      border: 1px solid rgba(148,163,184,0.25); background: rgba(30,41,59,0.75);
      color: #e2e8f0; padding: 8px 12px; border-radius: 10px; font-size: 12px;
      font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.15s;
    }
    .dock button:hover { background: rgba(51,65,85,0.85); }
    .dock button.active-green { background: rgba(16,185,129,0.22); border-color: rgba(52,211,153,0.45); color: #a7f3d0; }
    .dock button.active-amber { background: rgba(245,158,11,0.22); border-color: rgba(251,191,36,0.45); color: #fde68a; }
    .dock button.active-rose { background: rgba(244,63,94,0.2); border-color: rgba(251,113,133,0.4); color: #fecdd3; }
    .dock button.active-sky { background: rgba(14,165,233,0.22); border-color: rgba(56,189,248,0.45); color: #bae6fd; }
    .milieu-label {
      position: absolute; top: 0; left: 0; pointer-events: auto; cursor: pointer;
      transform: translate(-50%, -50%); padding: 6px 10px; border-radius: 10px;
      background: rgba(11,16,29,0.88); border: 1px solid rgba(148,163,184,0.25);
      box-shadow: 0 8px 20px rgba(2,6,23,0.55); text-align: left; min-width: 145px;
    }
    .milieu-label .name { font-size: 11.5px; font-weight: 600; color: #f8fafc; white-space: nowrap; }
    .milieu-label .meta { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .axis-label {
      position: absolute; top: 0; left: 0; transform: translate(-50%, -50%);
      padding: 3px 7px; border-radius: 6px; background: rgba(11,15,25,0.68);
      text-align: center; pointer-events: none;
    }
    .axis-label .t { font-size: 11px; font-weight: 600; color: #e2e8f0; white-space: nowrap; }
    .axis-label .s { font-size: 10px; color: #94a3b8; white-space: nowrap; }
    #sidebar {
      position: fixed; top: 16px; right: 16px; bottom: 88px; width: min(380px, calc(100vw - 32px));
      border-radius: 18px; z-index: 35; display: none; flex-direction: column; overflow: hidden;
    }
    #sidebar.open { display: flex; }
    #sidebar-bar { height: 4px; width: 100%; }
    #sidebar-head {
      padding: 14px 18px; border-bottom: 1px solid rgba(148,163,184,0.16);
      display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;
    }
    #sidebar-head h2 { margin: 4px 0 0; font-family: 'Outfit', sans-serif; font-size: 17px; }
    #sidebar-close {
      background: transparent; border: 1px solid rgba(148,163,184,0.2); color: #cbd5e1;
      border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 16px;
    }
    #sidebar-body { padding: 16px 18px; overflow-y: auto; flex: 1; font-size: 13px; line-height: 1.55; color: #cbd5e1; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
    .stat-card { background: rgba(15,23,42,0.7); border: 1px solid rgba(148,163,184,0.16); border-radius: 12px; padding: 10px 12px; }
    .stat-val { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 600; color: #f8fafc; margin-top: 2px; }
    .dock button.glow-cta {
      background: linear-gradient(90deg, rgba(16,185,129,0.32), rgba(6,182,212,0.28));
      border-color: rgba(52,211,153,0.65); color: #d1fae5;
      box-shadow: 0 0 20px rgba(16,185,129,0.35);
    }
    .dock button.glow-cta:hover { box-shadow: 0 0 26px rgba(16,185,129,0.55); border-color: #6ee7b7; }
    #quiz-backdrop {
      position: fixed; inset: 0; z-index: 60; background: rgba(2,6,23,0.76);
      display: none; align-items: center; justify-content: center; padding: 16px;
    }
    #quiz-backdrop.open { display: flex; }
    #quiz-modal {
      width: min(640px, 100%); max-height: 90vh; border-radius: 18px;
      display: flex; flex-direction: column; overflow: hidden;
    }
    #quiz-head {
      padding: 16px 22px; border-bottom: 1px solid rgba(148,163,184,0.18);
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    #quiz-head h2 { margin: 2px 0 0; font-family: 'Outfit', sans-serif; font-size: 19px; color: #f8fafc; }
    #quiz-close {
      background: transparent; border: 1px solid rgba(148,163,184,0.22); color: #cbd5e1;
      border-radius: 10px; width: 34px; height: 34px; cursor: pointer; font-size: 18px;
    }
    #quiz-body { padding: 18px 22px; overflow-y: auto; flex: 1; }
    #quiz-foot {
      padding: 14px 22px; border-top: 1px solid rgba(148,163,184,0.18);
      display: flex; justify-content: space-between; gap: 10px; background: rgba(2,6,23,0.35);
    }
    .quiz-opt {
      width: 100%; display: flex; align-items: center; gap: 12px; padding: 11px 14px;
      margin-bottom: 8px; border-radius: 12px; border: 1px solid rgba(148,163,184,0.24);
      background: rgba(15,23,42,0.7); color: #e2e8f0; cursor: pointer; text-align: left; font: inherit; font-size: 13.5px;
    }
    .quiz-opt.active { background: rgba(16,185,129,0.22); border-color: rgba(52,211,153,0.7); color: #fff; }
    .quiz-badge {
      width: 26px; height: 26px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center;
      font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px;
      background: rgba(30,41,59,0.9); color: #cbd5e1; flex-shrink: 0;
    }
    .quiz-opt.active .quiz-badge { background: #34d399; color: #022c22; }
    .quiz-btn {
      padding: 9px 16px; border-radius: 10px; border: 1px solid rgba(148,163,184,0.26);
      background: rgba(30,41,59,0.8); color: #e2e8f0; font-size: 12.5px; font-weight: 600; cursor: pointer;
    }
    .quiz-btn.primary { background: rgba(16,185,129,0.28); border-color: rgba(52,211,153,0.65); color: #ecfdf5; }
    .quiz-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .bar-track { height: 10px; border-radius: 999px; background: rgba(30,41,59,0.9); overflow: hidden; margin-top: 4px; }
    .bar-fill { height: 100%; border-radius: 999px; width: 0%; transition: width 0.7s ease-out; }
    @media (max-width: 1180px) { .legend-box, .legend-toggle-pill { bottom: 86px; left: 16px; } }
  </style>
  <script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.170.0/build/three.module.js",
      "three/addons/": "https://unpkg.com/three@0.170.0/examples/jsm/"
    }
  }
  ${scriptClose}
</head>
<body>
  <div id="canvas-host"></div>
  <div id="labels-layer"></div>

  <header class="header-box glass">
    <h1>SOZIALSTRUKTUR DEUTSCHLAND 2035</h1>
    <p id="header-sub">3D-SINUS-Transformationsmodell (GK GRW 12) · Prognose 2035 (3D)</p>
  </header>

  <aside id="legend-box" class="legend-box glass" aria-label="Legende">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <h2 class="legend-title" style="margin:0">Milieus (Legende)</h2>
      <button id="legend-hide-btn" class="legend-hide-btn" type="button">Ausblenden</button>
    </div>
    <div id="legend-milieus"></div>
    <div class="legend-sep">
      <h2 class="legend-title">Achsenmodell</h2>
      <div class="legend-row"><span class="legend-key" style="color:#38bdf8">X</span><span>Grundorientierung &amp; Werte</span></div>
      <div class="legend-row"><span class="legend-key" style="color:#a78bfa">Y</span><span>Soziale Lage (Niedrig → Hoch)</span></div>
      <div class="legend-row"><span class="legend-key" style="color:#34d399">Z</span><span>Transformationsresilienz 2035</span></div>
    </div>
    <div class="legend-sep">
      <h2 class="legend-title">Pfeile &amp; Verbindungen</h2>
      <div class="legend-row"><span style="color:#34d399;font-weight:700">↗</span><span><strong>Aufstiegspfeil:</strong> Tech-Anpassung (Mitte → Avantgarde)</span></div>
      <div class="legend-row"><span style="color:#f87171;font-weight:700">↘</span><span><strong>Abstiegspfeil:</strong> Abstiegsdruck (Mitte → Prekariat)</span></div>
      <div class="legend-row"><span style="color:#fbbf24;font-weight:700">⇣</span><span><strong>Gestrichelte Pfeile:</strong> Statusverlust der Mitte</span></div>
      <div class="legend-row"><span style="color:#fb7185;font-weight:700">―</span><span><strong>Rote Gräben:</strong> Fragmentierung &amp; Echokammern</span></div>
    </div>
  </aside>
  <button id="legend-show-btn" class="legend-toggle-pill glass" type="button">Legende einblenden</button>

  <aside id="sidebar" class="glass" aria-label="Milieu-Details">
    <div id="sidebar-bar"></div>
    <div id="sidebar-head">
      <div>
        <div id="sb-kicker" style="font-size:11.5px;color:#94a3b8"></div>
        <h2 id="sb-title"></h2>
      </div>
      <button id="sidebar-close" aria-label="Schließen">×</button>
    </div>
    <div id="sidebar-body"></div>
  </aside>

  <nav class="dock glass" aria-label="Steuerungsleiste">
    <div class="slider-wrap">
      <button id="btn-2020">2020 (2D)</button>
      <input id="morph-slider" type="range" min="0" max="1" step="0.005" value="1" aria-label="Transformationsregler 2020 bis 2035" />
      <span id="year-readout" style="font-family:'JetBrains Mono',monospace;font-size:12px;width:36px;text-align:center">2035</span>
      <button id="btn-2035" class="active-green">2035 (3D)</button>
    </div>
    <button id="btn-rifts" class="active-rose">Gräben &amp; Pfeile</button>
    <button id="btn-reset">Übersicht</button>
    <button id="btn-rotate">Drehen</button>
    <button id="btn-quiz" class="glow-cta">🎯 Milieu-Selbsttest 2035 starten</button>
  </nav>

  <div id="quiz-backdrop" role="dialog" aria-modal="true" aria-labelledby="quiz-title">
    <div id="quiz-modal" class="glass">
      <div id="quiz-strip" style="height:4px;background:linear-gradient(90deg,#10b981,#06b6d4,#3b82f6)"></div>
      <div id="quiz-head">
        <div>
          <div id="quiz-kicker" style="font-size:11px;color:#34d399;text-transform:uppercase;letter-spacing:0.06em">Frage 1 von 10</div>
          <h2 id="quiz-title">Milieu-Selbsttest 2035</h2>
        </div>
        <button id="quiz-close" aria-label="Schließen">×</button>
      </div>
      <div id="quiz-body"></div>
      <div id="quiz-foot"></div>
    </div>
  </div>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

    const DATA = ${dataJson};
    const host = document.getElementById('canvas-host');
    const labelsLayer = document.getElementById('labels-layer');
    const sidebar = document.getElementById('sidebar');
    const legendBox = document.getElementById('legend-box');

    const clamp01 = v => Math.min(1, Math.max(0, v));
    const smootherstep = (e0, e1, x) => {
      const t = clamp01((x - e0) / (e1 - e0));
      return t * t * t * (t * (t * 6 - 15) + 10);
    };
    const lerp = (a, b, t) => a + (b - a) * t;
    function interpolateMilieu(m, p) {
      const se = smootherstep(0, 0.58, p);
      const he = smootherstep(0.2, 1, p);
      const she = smootherstep(0, 1, p);
      return {
        x: lerp(m.pos2020.x, m.pos2035.x, se),
        z: lerp(m.pos2020.z, m.pos2035.z, se),
        h: lerp(m.height2020, m.height2035, he),
        s: lerp(m.scale2020, m.scale2035, se),
        share: Math.round(lerp(m.share2020, m.share2035, she))
      };
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f19);
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.0095);

    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 180);
    const defaultPos = new THREE.Vector3(11.8, 13.6, 19.2);
    const defaultTarget = new THREE.Vector3(0, 1.5, 0.3);
    camera.position.copy(defaultPos);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    host.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(defaultTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minDistance = 8;
    controls.maxDistance = 58;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;

    scene.add(new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.9));
    scene.add(new THREE.AmbientLight(0x1e293b, 0.45));
    const keyLight = new THREE.DirectionalLight(0xfff3e0, 1.85);
    keyLight.position.set(13, 22, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -14;
    keyLight.shadow.camera.right = 14;
    keyLight.shadow.camera.top = 14;
    keyLight.shadow.camera.bottom = -14;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    rimLight.position.set(-14, 13, -15);
    scene.add(rimLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 20).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x0d1424, roughness: 0.88, metalness: 0.12 })
    );
    floor.position.y = -0.025;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(20, 20, 0x334155, 0x172236);
    grid.position.y = 0.002;
    scene.add(grid);

    const axMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.5 });
    const xBar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 19.2, 10), axMat);
    xBar.rotation.z = Math.PI / 2; xBar.position.set(0, 0.04, 7.6); scene.add(xBar);
    const yBar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 14.4, 10), axMat);
    yBar.rotation.x = Math.PI / 2; yBar.position.set(-9.8, 0.04, 0); scene.add(yBar);
    const zGroup = new THREE.Group();
    const zMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.45 });
    const zBar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 7.2, 12), zMat);
    zBar.position.set(9.2, 3.6, -5.8); zGroup.add(zBar);
    const zCone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.48, 12), zMat);
    zCone.position.set(9.2, 7.35, -5.8); zGroup.add(zCone);
    scene.add(zGroup);

    function makeContour(radii, radius, rot = 0) {
      const pts = radii.map((r, i) => {
        const a = (i / radii.length) * Math.PI * 2 + rot;
        return new THREE.Vector3(Math.cos(a) * r * radius, Math.sin(a) * r * radius, 0);
      });
      const sampled = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.55).getPoints(48);
      const s = new THREE.Shape();
      s.moveTo(sampled[0].x, sampled[0].y);
      sampled.slice(1).forEach(p => s.lineTo(p.x, p.y));
      s.closePath();
      return s;
    }

    function makeFractured(r) {
      const l = new THREE.Shape();
      l.moveTo(-0.14*r, -0.82*r);
      l.bezierCurveTo(-0.75*r, -0.88*r, -1.02*r, -0.35*r, -0.96*r, 0.22*r);
      l.bezierCurveTo(-0.88*r, 0.72*r, -0.36*r, 0.92*r, -0.04*r, 0.78*r);
      l.lineTo(-0.18*r, 0.35*r); l.lineTo(-0.06*r, 0.02*r); l.lineTo(-0.22*r, -0.38*r);
      l.closePath();
      const ri = new THREE.Shape();
      ri.moveTo(0.12*r, -0.78*r); ri.lineTo(0.02*r, -0.36*r); ri.lineTo(0.18*r, 0.04*r); ri.lineTo(0.08*r, 0.38*r);
      ri.lineTo(0.22*r, 0.80*r);
      ri.bezierCurveTo(0.66*r, 0.86*r, 1.02*r, 0.45*r, 0.96*r, -0.10*r);
      ri.bezierCurveTo(0.90*r, -0.62*r, 0.52*r, -0.86*r, 0.12*r, -0.78*r);
      ri.closePath();
      return [l, ri];
    }

    const variantRadii = {
      tower_triangle: [[1.05,0.82,0.96,0.74,1.02,0.86,0.78,0.92], 0.35],
      block_rectangle: [[1.02,1.12,0.95,1.08,0.98,1.10,0.94,1.06], 0.4],
      slender_pillar: [[0.92,0.78,1.06,0.84,0.96,0.76,1.02,0.85], -0.2],
      broad_plateau: [[1.08,0.92,1.04,0.82,1.10,0.96,0.86,1.02,0.92], 0.15],
      flat_slab: [[1.06,0.88,0.96,1.08,0.86,0.98,1.04,0.85], -0.45]
    };

    const rigs = [];
    const clickables = [];
    const labelEls = {};

    const legendMilieusEl = document.getElementById('legend-milieus');
    const legendShareEls = {};
    DATA.milieus.forEach((m) => {
      const btn = document.createElement('button');
      btn.className = 'legend-milieu-btn';
      btn.type = 'button';
      btn.innerHTML = '<span style="display:flex;align-items:center;gap:7px;min-width:0"><span class="legend-dot" style="background:' + m.colorHex + '"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + m.shortName + '</span></span><span class="legend-share" style="font-family:JetBrains Mono,monospace;color:#94a3b8;font-size:11px">' + m.share2035 + ' %</span>';
      btn.addEventListener('click', () => selectMilieu(m.id));
      legendMilieusEl.appendChild(btn);
      legendShareEls[m.id] = btn.querySelector('.legend-share');
    });

    DATA.milieus.forEach((m) => {
      const root = new THREE.Group();
      root.position.set(m.pos2035.x, 0, m.pos2035.z);
      const fp = new THREE.Group(); root.add(fp);
      const core = new THREE.Group(); fp.add(core);
      const cap = new THREE.Group(); cap.position.y = m.height2035; fp.add(cap);

      const shapes = m.shapeVariant === 'fractured_shards'
        ? makeFractured(m.footprintRadius)
        : [makeContour(variantRadii[m.shapeVariant][0], m.footprintRadius, variantRadii[m.shapeVariant][1])];

      const col = new THREE.Color(m.colorHex);
      const edgeCol = col.clone().lerp(new THREE.Color('#ffffff'), 0.35);

      shapes.forEach((s) => {
        const bodyGeo = new THREE.ExtrudeGeometry(s, { depth: 1.0, bevelEnabled: false, curveSegments: 24 });
        bodyGeo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshPhysicalMaterial({
          color: col, emissive: new THREE.Color(m.emissiveHex), emissiveIntensity: 0.25,
          roughness: 0.18, metalness: 0.08, clearcoat: 1.0, transparent: true, opacity: 0.8
        });
        const mesh = new THREE.Mesh(bodyGeo, mat);
        mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.milieuId = m.id;
        core.add(mesh);
        clickables.push(mesh);

        const capGeo = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
        capGeo.rotateX(-Math.PI / 2);
        const capMesh = new THREE.Mesh(capGeo, mat);
        capMesh.userData.milieuId = m.id;
        cap.add(capMesh);
        cap.add(new THREE.LineSegments(new THREE.EdgesGeometry(capGeo, 20), new THREE.LineBasicMaterial({ color: edgeCol })));
      });

      core.scale.y = m.height2035;
      scene.add(root);

      const el = document.createElement('button');
      el.className = 'milieu-label';
      el.innerHTML = '<div class="name">' + m.shortName + '</div><div class="meta">' + m.share2035 + ' %</div>';
      el.addEventListener('click', () => selectMilieu(m.id));
      labelsLayer.appendChild(el);
      labelEls[m.id] = el;

      rigs.push({ spec: m, root, fp, core, cap, x: m.pos2035.x, z: m.pos2035.z, h: m.height2035, s: m.scale2035 });
    });

    const axisEls = {};
    DATA.axisLabels.forEach((ax) => {
      const el = document.createElement('div');
      el.className = 'axis-label';
      el.innerHTML = '<div class="t">' + ax.text + '</div>' + (ax.subtext ? '<div class="s">' + ax.subtext + '</div>' : '');
      labelsLayer.appendChild(el);
      axisEls[ax.id] = { el, ax };
    });

    const riftsGroup = new THREE.Group();
    const riftMats = [];
    DATA.riftLines.forEach((r) => {
      const curve = new THREE.CatmullRomCurve3(r.points.map(p => new THREE.Vector3(p.x, 0.035, p.z)));
      const mat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.85 });
      riftMats.push(mat);
      riftsGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.05, 8, false), mat));
    });
    scene.add(riftsGroup);

    const arrowsGroup = new THREE.Group();
    const arrowMats = [];
    function addArrow(pts, hex) {
      const curve = new THREE.CatmullRomCurve3(pts);
      const mat = new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.8, transparent: true, opacity: 0.92 });
      arrowMats.push(mat);
      arrowsGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.08, 10, false), mat));
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 14), mat);
      cone.position.copy(curve.getPointAt(1));
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangentAt(1).normalize());
      arrowsGroup.add(cone);
    }
    addArrow([new THREE.Vector3(1.6,2.05,0.1), new THREE.Vector3(2.4,4.35,-1.4), new THREE.Vector3(3.1,6.4,-3.1), new THREE.Vector3(3.75,7.55,-4.15)], 0x10b981);
    addArrow([new THREE.Vector3(0.25,2.25,1.35), new THREE.Vector3(-0.1,1.85,2.45), new THREE.Vector3(-0.45,1.25,3.45), new THREE.Vector3(-0.75,0.72,4.25)], 0xef4444);
    scene.add(arrowsGroup);

    let targetProgress = 1.0;
    let currentProgress = 1.0;
    let progressLambda = 5.0;
    let showExtras = true;
    let tweenCam = false;
    const camPosT = new THREE.Vector3();
    const camTarT = new THREE.Vector3();

    const sliderEl = document.getElementById('morph-slider');
    const yearReadoutEl = document.getElementById('year-readout');
    const btn2020 = document.getElementById('btn-2020');
    const btn2035 = document.getElementById('btn-2035');
    const headerSub = document.getElementById('header-sub');

    function syncProgressUi(val) {
      sliderEl.value = String(val);
      const yr = Math.round(2020 + clamp01(val) * 15);
      yearReadoutEl.textContent = String(yr);
      btn2020.className = val < 0.15 ? 'active-amber' : '';
      btn2035.className = val > 0.85 ? 'active-green' : '';
      headerSub.textContent = '3D-SINUS-Transformationsmodell (GK GRW 12) · ' + (val < 0.15 ? 'Referenz 2020 (2D)' : val > 0.85 ? 'Prognose 2035 (3D)' : 'Transformation ' + yr);
      rigs.forEach(r => {
        const f = interpolateMilieu(r.spec, val);
        labelEls[r.spec.id].querySelector('.meta').textContent = f.share + ' %';
        if (legendShareEls[r.spec.id]) legendShareEls[r.spec.id].textContent = f.share + ' %';
      });
    }

    const legendShowBtn = document.getElementById('legend-show-btn');
    const legendHideBtn = document.getElementById('legend-hide-btn');
    let legendOpen = window.innerWidth >= 768;
    let selectedId = null;
    function syncLegendVisibility() {
      if (selectedId !== null) {
        legendBox.style.display = 'none';
        legendShowBtn.style.display = 'none';
      } else {
        legendBox.style.display = legendOpen ? '' : 'none';
        legendShowBtn.style.display = legendOpen ? 'none' : 'inline-block';
      }
    }
    syncLegendVisibility();
    legendHideBtn.addEventListener('click', () => { legendOpen = false; syncLegendVisibility(); });
    legendShowBtn.addEventListener('click', () => { legendOpen = true; syncLegendVisibility(); });

    function clearFocus() {
      selectedId = null;
      sidebar.classList.remove('open');
      syncLegendVisibility();
      camPosT.copy(defaultPos); camTarT.copy(defaultTarget); tweenCam = true;
    }

    function selectMilieu(id) {
      const rig = rigs.find(r => r.spec.id === id);
      if (!rig) return;
      selectedId = id;
      syncLegendVisibility();
      const m = rig.spec;
      const f = interpolateMilieu(m, targetProgress);
      const yr = Math.round(2020 + targetProgress * 15);

      document.getElementById('sidebar-bar').style.backgroundColor = m.colorHex;
      document.getElementById('sb-kicker').textContent = m.badge2035 + ' · ' + yr;
      document.getElementById('sb-title').textContent = m.name;
      document.getElementById('sidebar-body').innerHTML =
        '<div class="stat-grid">' +
          '<div class="stat-card"><div>Anteil ' + yr + '</div><div class="stat-val">' + f.share + ' %</div></div>' +
          '<div class="stat-card"><div>Resilienz (Z)</div><div class="stat-val">' + m.resilienceScore + '/100</div></div>' +
        '</div>' +
        '<p><strong>Soziale Lage:</strong> ' + m.socialLayerLabel + '</p>' +
        '<p><strong>Grundorientierung:</strong> ' + m.valueOrientationLabel + '</p>' +
        '<p><strong>Z-Bewertung:</strong> ' + m.resilienceRatingLabel + '</p>' +
        '<p style="margin-top:12px">' + m.summary2035 + '</p>' +
        '<ol style="padding-left:18px">' + m.causalChain.map(c => '<li style="margin-bottom:6px">' + c + '</li>').join('') + '</ol>';
      sidebar.classList.add('open');

      camTarT.set(f.x + 1.6, Math.max(0.6, f.h * 0.55), f.z);
      camPosT.set(f.x + (f.x >= 0 ? 5.4 : -4.4), Math.max(4.8, f.h + 3.4), f.z + 9.2);
      tweenCam = true;
    }

    document.getElementById('sidebar-close').addEventListener('click', clearFocus);
    controls.addEventListener('start', () => { tweenCam = false; });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };
    renderer.domElement.addEventListener('pointerdown', e => { downPos = { x: e.clientX, y: e.clientY }; });
    renderer.domElement.addEventListener('pointerup', e => {
      if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickables, false);
      if (hits.length > 0 && hits[0].object.userData.milieuId) selectMilieu(hits[0].object.userData.milieuId);
      else if (selectedId !== null) clearFocus();
    });

    sliderEl.addEventListener('input', e => {
      targetProgress = parseFloat(e.target.value);
      progressLambda = 16.0;
      syncProgressUi(targetProgress);
    });
    btn2020.addEventListener('click', () => { targetProgress = 0; progressLambda = 4.4; syncProgressUi(0); });
    btn2035.addEventListener('click', () => { targetProgress = 1; progressLambda = 4.4; syncProgressUi(1); });

    const btnRifts = document.getElementById('btn-rifts');
    btnRifts.addEventListener('click', () => {
      showExtras = !showExtras;
      btnRifts.className = showExtras ? 'active-rose' : '';
    });

    document.getElementById('btn-reset').addEventListener('click', clearFocus);

    const btnRot = document.getElementById('btn-rotate');
    btnRot.addEventListener('click', () => {
      controls.autoRotate = !controls.autoRotate;
      btnRot.className = controls.autoRotate ? 'active-sky' : '';
    });

    // Interactive Milieu-Selbsttest 2035
    const quizBackdrop = document.getElementById('quiz-backdrop');
    const quizKicker = document.getElementById('quiz-kicker');
    const quizBody = document.getElementById('quiz-body');
    const quizFoot = document.getElementById('quiz-foot');
    const quizStrip = document.getElementById('quiz-strip');
    let quizStep = 0;
    let quizAnswers = {};
    let quizShowingResult = false;

    function computeQuizResult() {
      let sumX = 0, sumY = 0, sumZ = 0;
      DATA.quizQuestions.forEach(q => {
        const raw = quizAnswers[q.id] || 3;
        const val = q.inverted ? (6 - raw) : raw;
        if (q.dimension === 'X') sumX += val;
        else if (q.dimension === 'Y') sumY += val;
        else sumZ += val;
      });
      const uX = ((sumX - 3) / 12) * 100;
      const uY = ((sumY - 3) / 12) * 100;
      const uZ = ((sumZ - 4) / 16) * 100;
      const items = DATA.milieus.map(m => {
        const idl = DATA.quizIdeals[m.id];
        const dist = Math.sqrt(Math.pow(uX - idl.x, 2) + Math.pow(uY - idl.y, 2) + Math.pow(uZ - idl.z, 2));
        const weight = 1 / Math.pow(dist + 1, 2.5);
        return { m, dist, weight, raw: 0, pct: 0 };
      });
      const tot = items.reduce((a, b) => a + b.weight, 0);
      const floors = items.map(it => { it.raw = (it.weight / tot) * 100; return Math.floor(it.raw); });
      const rems = items.map((it, idx) => ({ idx, rem: it.raw - floors[idx], w: it.weight }))
        .sort((a, b) => (b.rem - a.rem) || (b.w - a.w));
      const missing = 100 - floors.reduce((a, b) => a + b, 0);
      for (let i = 0; i < missing; i++) floors[rems[i].idx] += 1;
      items.forEach((it, idx) => { it.pct = floors[idx]; });
      items.sort((a, b) => (b.pct - a.pct) || (b.raw - a.raw) || (a.dist - b.dist));
      const rX = Math.round(uX), rY = Math.round(uY), rZ = Math.round(uZ);
      const top = items[0];
      const xTxt = rX >= 65 ? 'stark transformativen, öko-digitalen Werteorientierung' : rX <= 35 ? 'traditions- und sicherheitsorientierten Grundhaltung' : 'ausgewogenen, modernisierungsbereiten Wertehaltung';
      const yTxt = rY >= 68 ? 'hohen Ressourcen- und Bildungslage' : rY <= 34 ? 'angespannten materiellen Ressourcenlage' : 'mittleren sozialen Ausgangslage';
      const zTxt = rZ >= 68 ? 'überdurchschnittlichen KI- und Krisenresilienz' : rZ <= 34 ? 'erhöhten Verwundbarkeit gegenüber Umbrüchen' : 'moderaten Anpassungsfähigkeit an den Strukturwandel';
      const reason = 'Deine Kombination aus einer ' + xTxt + ' (X: ' + rX + '%), einer ' + yTxt + ' (Y: ' + rY + '%) und einer ' + zTxt + ' (Z: ' + rZ + '%) liegt im 3D-Raum am nächsten bei „' + top.m.name + '“. ' + top.m.summary2035;
      return { rX, rY, rZ, items, top, reason };
    }

    function renderQuiz() {
      if (!quizShowingResult) {
        const q = DATA.quizQuestions[quizStep];
        const chosen = quizAnswers[q.id];
        quizStrip.style.background = 'linear-gradient(90deg,#10b981,#06b6d4,#3b82f6)';
        quizKicker.textContent = 'Frage ' + (quizStep + 1) + ' von 10 · ' + q.dimensionLabel;
        const pct = ((quizStep + 1) / 10) * 100;
        quizBody.innerHTML =
          '<div style="height:6px;background:rgba(30,41,59,0.9);border-radius:999px;overflow:hidden;margin-bottom:16px">' +
            '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#10b981,#06b6d4);transition:width 0.25s"></div>' +
          '</div>' +
          '<p style="font-size:16px;line-height:1.5;color:#f8fafc;margin:0 0 16px;font-weight:500">„' + q.text + '“</p>' +
          '<div id="quiz-opts"></div>';
        const optsWrap = document.getElementById('quiz-opts');
        DATA.quizScale.forEach(s => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'quiz-opt' + (chosen === s.value ? ' active' : '');
          btn.innerHTML = '<span class="quiz-badge">' + s.value + '</span><span>' + s.label + '</span>';
          btn.addEventListener('click', () => { quizAnswers[q.id] = s.value; renderQuiz(); });
          optsWrap.appendChild(btn);
        });
        quizFoot.innerHTML = '';
        const prevBtn = document.createElement('button');
        prevBtn.type = 'button'; prevBtn.className = 'quiz-btn'; prevBtn.textContent = 'Zurück';
        prevBtn.disabled = quizStep === 0;
        prevBtn.addEventListener('click', () => { if (quizStep > 0) { quizStep--; renderQuiz(); } });
        const nextBtn = document.createElement('button');
        nextBtn.type = 'button'; nextBtn.className = 'quiz-btn primary'; nextBtn.textContent = 'Weiter';
        nextBtn.disabled = !chosen;
        nextBtn.addEventListener('click', () => {
          if (quizStep < 9) { quizStep++; renderQuiz(); }
          else { quizShowingResult = true; renderQuiz(); }
        });
        quizFoot.append(prevBtn, nextBtn);
      } else {
        const res = computeQuizResult();
        quizStrip.style.background = res.top.m.colorHex;
        quizKicker.textContent = 'Auswertung · Prognose 2035';
        quizBody.innerHTML =
          '<div style="background:rgba(15,23,42,0.75);border:1px solid rgba(148,163,184,0.2);border-radius:12px;padding:10px 14px;margin-bottom:14px;font-size:12.5px">' +
            '<div style="font-size:10.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:4px">Dein Standort im 3D-Raum</div>' +
            '<div style="font-family:JetBrains Mono,monospace">Werteorientierung (X): <strong>' + res.rX + '%</strong> | Soziale Lage (Y): <strong>' + res.rY + '%</strong> | Krisenresilienz (Z): <strong>' + res.rZ + '%</strong></div>' +
          '</div>' +
          '<div style="background:rgba(15,23,42,0.75);border:1px solid ' + res.top.m.colorHex + '88;border-radius:14px;padding:14px;margin-bottom:16px">' +
            '<div style="font-family:Outfit,sans-serif;font-size:17px;font-weight:700;color:#fff">Dein Zukunfts-Milieu 2035: <span style="color:' + res.top.m.colorHex + '">' + res.top.m.name + '</span> (' + res.top.pct + '%)</div>' +
            '<p style="margin:8px 0 0;font-size:12.5px;line-height:1.5;color:#cbd5e1">' + res.reason + '</p>' +
          '</div>' +
          '<div id="quiz-bars"></div>';
        const barsWrap = document.getElementById('quiz-bars');
        res.items.forEach((it, idx) => {
          const row = document.createElement('div');
          row.style.marginBottom = '10px';
          row.innerHTML =
            '<div style="display:flex;justify-content:space-between;font-size:12px">' +
              '<span>' + (idx + 1) + '. <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:' + it.m.colorHex + ';margin:0 6px 0 4px"></span>' + it.m.name + '</span>' +
              '<strong style="font-family:JetBrains Mono,monospace">' + it.pct + '%</strong>' +
            '</div>' +
            '<div class="bar-track"><div class="bar-fill" data-w="' + Math.max(2, it.pct) + '" style="background:' + it.m.colorHex + '"></div></div>';
          barsWrap.appendChild(row);
        });
        requestAnimationFrame(() => {
          barsWrap.querySelectorAll('.bar-fill').forEach(el => { el.style.width = el.dataset.w + '%'; });
        });
        quizFoot.innerHTML = '';
        const retryBtn = document.createElement('button');
        retryBtn.type = 'button'; retryBtn.className = 'quiz-btn'; retryBtn.textContent = 'Test wiederholen';
        retryBtn.addEventListener('click', () => { quizAnswers = {}; quizStep = 0; quizShowingResult = false; renderQuiz(); });
        const viewBtn = document.createElement('button');
        viewBtn.type = 'button'; viewBtn.className = 'quiz-btn primary'; viewBtn.textContent = 'Im 3D-Modell ansehen';
        viewBtn.addEventListener('click', () => {
          quizBackdrop.classList.remove('open');
          targetProgress = 1; progressLambda = 4.4; syncProgressUi(1);
          selectMilieu(res.top.m.id);
        });
        quizFoot.append(retryBtn, viewBtn);
      }
    }

    document.getElementById('btn-quiz').addEventListener('click', () => {
      quizBackdrop.classList.add('open');
      renderQuiz();
    });
    document.getElementById('quiz-close').addEventListener('click', () => quizBackdrop.classList.remove('open'));

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    let lastMs = performance.now();
    const v = new THREE.Vector3();
    function animate() {
      requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.25, Math.max(0.001, (now - lastMs) / 1000));
      lastMs = now;

      currentProgress = THREE.MathUtils.damp(currentProgress, targetProgress, progressLambda, dt);
      const riftPhase = smootherstep(0.18, 0.68, currentProgress);
      const arrowPhase = smootherstep(0.45, 0.94, currentProgress);
      zGroup.scale.y = 0.12 + 0.88 * smootherstep(0.15, 0.95, currentProgress);

      rigs.forEach(r => {
        const f = interpolateMilieu(r.spec, currentProgress);
        r.x = f.x; r.z = f.z; r.h = f.h; r.s = f.s;
        r.root.position.set(r.x, 0, r.z);
        r.fp.scale.set(r.s, 1, r.s);
        r.core.scale.y = Math.max(0.05, r.h);
        r.cap.position.y = Math.max(0.05, r.h);
      });

      riftsGroup.visible = showExtras && riftPhase > 0.02;
      riftMats.forEach(m => { m.opacity = 0.85 * riftPhase; });
      arrowsGroup.visible = showExtras && arrowPhase > 0.02;
      arrowsGroup.scale.y = Math.max(0.08, arrowPhase);
      arrowMats.forEach(m => { m.opacity = 0.92 * arrowPhase; });

      if (tweenCam) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, camPosT.x, 4.8, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, camPosT.y, 4.8, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, camPosT.z, 4.8, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, camTarT.x, 4.8, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, camTarT.y, 4.8, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, camTarT.z, 4.8, dt);
        if (camera.position.distanceTo(camPosT) < 0.06) tweenCam = false;
      }

      controls.update();
      renderer.render(scene, camera);

      camera.updateMatrixWorld();
      rigs.forEach(r => {
        v.set(r.x, r.h + 0.52, r.z).project(camera);
        const el = labelEls[r.spec.id];
        const show = v.z <= 1 && selectedId === r.spec.id;
        el.style.display = show ? 'block' : 'none';
        el.style.left = ((v.x + 1) * 0.5 * window.innerWidth) + 'px';
        el.style.top = ((-v.y + 1) * 0.5 * window.innerHeight) + 'px';
      });
      Object.values(axisEls).forEach(({ el, ax }) => {
        const wy = ax.id === 'axis-z-top' ? 0.65 + zGroup.scale.y * 7.2 : ax.worldPos.y;
        const zVis = ax.id !== 'axis-z-top' || currentProgress >= 0.18;
        v.set(ax.worldPos.x, wy, ax.worldPos.z).project(camera);
        el.style.display = (selectedId === null && zVis && v.z <= 1) ? 'block' : 'none';
        el.style.left = ((v.x + 1) * 0.5 * window.innerWidth) + 'px';
        el.style.top = ((-v.y + 1) * 0.5 * window.innerHeight) + 'px';
      });
    }
    animate();
  ${scriptClose}
</body>
</html>`;
}

export function downloadStandaloneHtml(): void {
  const html = buildStandaloneHtmlString();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sozialstruktur-deutschland-2035.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
