import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  AXIS_LABELS,
  MILIEUS,
  RIFT_LINES,
  type MilieuId,
} from '../data/milieus';
import {
  clamp01,
  interpolateMilieuFrame,
  ndcToScreen,
  resolveLabelOverlaps,
  smootherstep,
  type LabelLayoutInput,
} from '../utils/projection';
import { buildMilieuRig, type MilieuRig } from './organicShapes';

export interface ProjectedLabelPosition {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

export interface SceneCallbacks {
  onSelectMilieu: (id: MilieuId | null) => void;
  onHoverMilieu: (id: MilieuId | null) => void;
  onLabelsFrame: (
    milieuPositions: Record<string, ProjectedLabelPosition>,
    axisPositions: Record<string, ProjectedLabelPosition>,
  ) => void;
  onContextLost?: (lost: boolean) => void;
}

interface MobilityArrowRig {
  group: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  pulses: THREE.Mesh[];
  materials: THREE.Material[];
}

// Pre-allocated scratch math helpers (zero GC in render loop)
const _vec3 = new THREE.Vector3();
const _camTargetTarget = new THREE.Vector3();
const _camPosTarget = new THREE.Vector3();

const DEFAULT_CAMERA_POS = new THREE.Vector3(11.8, 13.6, 19.2);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0.0, 1.5, 0.3);

function detectSoftwareGl(): boolean {
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2') || probe.getContext('webgl');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param) ?? '');
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

export class SinusSceneManager {
  private container: HTMLElement;
  private callbacks: SceneCallbacks;
  private isSoftwareGl: boolean;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private envTexture: THREE.Texture | null = null;

  private milieuRigs: Map<MilieuId, MilieuRig> = new Map();
  private interactables: THREE.Object3D[] = [];
  private riftsGroup: THREE.Group;
  private riftMaterials: THREE.MeshBasicMaterial[] = [];
  private mobilityGroup: THREE.Group;
  private mobilityArrows: MobilityArrowRig[] = [];

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private pointerDownPos = { x: 0, y: 0 };

  private targetProgress = 1.0;
  private currentProgress = 1.0;
  private progressDampLambda = 5.0;
  private showRiftsAndArrows = true;
  private autoRotateEnabled = false;
  private selectedId: MilieuId | null = null;
  private hoveredId: MilieuId | null = null;

  private currentExtrasOpacity = 1.0;
  private currentArrowOpacity = 1.0;
  private zAxisGroup: THREE.Group | null = null;
  private isCameraTweening = false;
  private lastTickMs = 0;
  private elapsedTime = 0;

  private frameId = 0;
  private renderBusy = false;
  private renderDirty = false;
  private isDisposed = false;
  private lastHoverRaycast = 0;

  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareGl();

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 240);

    // 1. Scene & Deep Slate/Navy atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0f19);
    this.scene.fog = new THREE.FogExp2(0x0b0f19, 0.0095);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 180);
    this.camera.position.copy(DEFAULT_CAMERA_POS);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    // 4. Studio Environment Reflections (RoomEnvironment)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;
    pmrem.dispose();

    // 5. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(DEFAULT_CAMERA_TARGET);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 58;
    this.controls.minPolarAngle = 0.18;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.06;
    this.controls.autoRotateSpeed = 0.65;
    this.controls.update();

    this.controls.addEventListener('start', () => {
      // Cancel scripted camera tween immediately when user grabs the viewport
      this.isCameraTweening = false;
    });

    this.controls.addEventListener('change', () => {
      if (this.isSoftwareGl) {
        this.requestRender();
      }
    });

    // 6. Lighting Rig (Warm Key + Cool Hemisphere + Rim Backlight)
    this.setupLighting();

    // 7. Floor Plate, Grid & 3D Axes
    this.setupCoordinateFloorAndAxes();

    // 8. 6 Organic 3D Milieus
    for (const spec of MILIEUS) {
      const rig = buildMilieuRig(spec, this.isSoftwareGl);
      this.scene.add(rig.rootGroup);
      this.milieuRigs.set(spec.id, rig);
      this.interactables.push(rig.hitMesh);
    }

    // 9. Fragmentation Rifts & Animated Mobility Arrows
    this.riftsGroup = new THREE.Group();
    this.scene.add(this.riftsGroup);
    this.buildRiftLines();

    this.mobilityGroup = new THREE.Group();
    this.scene.add(this.mobilityGroup);
    this.buildMobilityArrows();

    // Raycaster setup for layer 1 (hit proxies)
    this.raycaster.layers.set(1);

    // Pre-warm shaders on GPU
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // Event bindings
    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    // Start render loop
    this.lastTickMs = performance.now();
    if (this.isSoftwareGl) {
      this.requestRender();
    } else {
      this.tickGpu();
    }
  }

  private setupLighting(): void {
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.9);
    hemiLight.position.set(0, 24, 0);
    this.scene.add(hemiLight);

    const ambient = new THREE.AmbientLight(0x1e293b, 0.45);
    this.scene.add(ambient);

    // Warm key light
    const keyLight = new THREE.DirectionalLight(0xfff3e0, 1.85);
    keyLight.position.set(13, 22, 12);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 55;
      keyLight.shadow.camera.left = -14;
      keyLight.shadow.camera.right = 14;
      keyLight.shadow.camera.top = 14;
      keyLight.shadow.camera.bottom = -14;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    // Cool rim backlight
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    rimLight.position.set(-14, 13, -15);
    this.scene.add(rimLight);
  }

  private setupCoordinateFloorAndAxes(): void {
    // Matte dark floor deck
    const floorGeo = new THREE.PlaneGeometry(24, 20);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0d1424,
      roughness: 0.88,
      metalness: 0.12,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.025;
    floorMesh.receiveShadow = !this.isSoftwareGl;
    this.scene.add(floorMesh);

    // Subtle framed platform edge
    const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(20.4, 0.08, 16.4));
    const borderMat = new THREE.LineBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.65,
    });
    const borderLines = new THREE.LineSegments(borderGeo, borderMat);
    borderLines.position.y = -0.02;
    this.scene.add(borderLines);

    // Coordinate grid
    const grid = new THREE.GridHelper(20, 20, 0x334155, 0x172236);
    grid.position.y = 0.002;
    const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
    for (const m of gridMats) {
      m.transparent = true;
      m.opacity = 0.72;
      m.polygonOffset = true;
      m.polygonOffsetFactor = -1;
      m.polygonOffsetUnits = -1;
    }
    this.scene.add(grid);

    // 3D Axis Lines (X: Values, Y: Social Position, Z: Resilience Height)
    const axisGroup = new THREE.Group();

    // X-Axis beam along front
    const xMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      emissive: 0x1e293b,
      roughness: 0.4,
      metalness: 0.5,
    });
    const xBar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 19.2, 10), xMat);
    xBar.rotation.z = Math.PI / 2;
    xBar.position.set(0, 0.04, 7.6);
    axisGroup.add(xBar);

    const xConeRight = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 12), xMat);
    xConeRight.rotation.z = -Math.PI / 2;
    xConeRight.position.set(9.7, 0.04, 7.6);
    axisGroup.add(xConeRight);

    const xConeLeft = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 12), xMat);
    xConeLeft.rotation.z = Math.PI / 2;
    xConeLeft.position.set(-9.7, 0.04, 7.6);
    axisGroup.add(xConeLeft);

    // Y-Axis (Social Layer) beam along left edge
    const yBar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 14.4, 10), xMat);
    yBar.rotation.x = Math.PI / 2;
    yBar.position.set(-9.8, 0.04, 0);
    axisGroup.add(yBar);

    const yConeBack = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.42, 12),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.4 }),
    );
    yConeBack.rotation.x = -Math.PI / 2;
    yConeBack.position.set(-9.8, 0.04, -7.3);
    axisGroup.add(yConeBack);

    // Z-Axis (Vertical Resilience) mast at back-right
    const zAxisGroup = new THREE.Group();
    const zMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.45,
    });
    const zBar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 7.2, 12), zMat);
    zBar.position.set(9.2, 3.6, -5.8);
    zAxisGroup.add(zBar);

    const zCone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.48, 12), zMat);
    zCone.position.set(9.2, 7.35, -5.8);
    zAxisGroup.add(zCone);

    // Tick rings on Z-axis every 2 units
    const tickGeo = new THREE.TorusGeometry(0.14, 0.024, 8, 20);
    tickGeo.rotateX(Math.PI / 2);
    for (let h = 2; h <= 6; h += 2) {
      const tick = new THREE.Mesh(tickGeo, zMat);
      tick.position.set(9.2, h, -5.8);
      zAxisGroup.add(tick);
    }
    this.zAxisGroup = zAxisGroup;
    axisGroup.add(zAxisGroup);

    this.scene.add(axisGroup);
  }

  private buildRiftLines(): void {
    for (const rift of RIFT_LINES) {
      const pts = rift.points.map((p) => new THREE.Vector3(p.x, 0.032, p.z));
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);

      // Core glowing red seam
      const coreGeo = new THREE.TubeGeometry(curve, 44, 0.045, 8, false);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.85,
      });
      this.riftMaterials.push(coreMat);
      this.riftsGroup.add(new THREE.Mesh(coreGeo, coreMat));

      // Soft outer crimson aura
      const glowGeo = new THREE.TubeGeometry(curve, 44, 0.14, 8, false);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xe11d48,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      });
      this.riftMaterials.push(glowMat);
      this.riftsGroup.add(new THREE.Mesh(glowGeo, glowMat));
    }
  }

  private createArrowRig(
    points: THREE.Vector3[],
    colorHex: number,
  ): MobilityArrowRig {
    const group = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);

    const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.08, 10, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.78,
      roughness: 0.25,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    group.add(tubeMesh);

    // Arrowhead cone oriented along curve tangent at t = 1
    const endPos = curve.getPointAt(1);
    const endTan = curve.getTangentAt(1).normalize();
    const coneGeo = new THREE.ConeGeometry(0.28, 0.7, 16);
    const coneMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.92,
      roughness: 0.2,
      metalness: 0.25,
      transparent: true,
      opacity: 0.96,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.copy(endPos);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endTan);
    group.add(cone);

    // Animated tracer spheres along curve
    const pulses: THREE.Mesh[] = [];
    const pulseGeo = new THREE.SphereGeometry(0.125, 12, 12);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.94,
    });
    for (let i = 0; i < 3; i++) {
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      group.add(pulse);
      pulses.push(pulse);
    }

    this.mobilityGroup.add(group);
    return {
      group,
      curve,
      pulses,
      materials: [tubeMat, coneMat, pulseMat],
    };
  }

  private buildMobilityArrows(): void {
    // 1. Aufstiegspfeil: Zentrum/Digital-Adaptiv -> Tech-Ökologische Avantgarde (routed in open corridor)
    const ascent = this.createArrowRig(
      [
        new THREE.Vector3(1.6, 2.05, 0.1),
        new THREE.Vector3(2.4, 4.35, -1.4),
        new THREE.Vector3(3.1, 6.4, -3.1),
        new THREE.Vector3(3.75, 7.55, -4.15),
      ],
      0x10b981,
    );
    this.mobilityArrows.push(ascent);

    // 2. Abstiegspfeil: Erodierte Mitte -> Abgehängtes Digital- & Klima-Prekariat
    const descent = this.createArrowRig(
      [
        new THREE.Vector3(0.25, 2.25, 1.35),
        new THREE.Vector3(-0.1, 1.85, 2.45),
        new THREE.Vector3(-0.45, 1.25, 3.45),
        new THREE.Vector3(-0.75, 0.72, 4.25),
      ],
      0xef4444,
    );
    this.mobilityArrows.push(descent);
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('webglcontextlost', this.onWebglContextLost);
    dom.addEventListener('webglcontextrestored', this.onWebglContextRestored);
  }

  private onWebglContextLost = (e: Event): void => {
    e.preventDefault();
    this.callbacks.onContextLost?.(true);
  };

  private onWebglContextRestored = (): void => {
    this.callbacks.onContextLost?.(false);
    this.requestRender();
  };

  private updatePointerNdc(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.pointerDownPos.x = e.clientX;
    this.pointerDownPos.y = e.clientY;
  };

  private onPointerUp = (e: PointerEvent): void => {
    const dist = Math.hypot(
      e.clientX - this.pointerDownPos.x,
      e.clientY - this.pointerDownPos.y,
    );
    if (dist > 6) return; // Dragged camera, not a click

    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, false);

    if (hits.length > 0) {
      const id = hits[0].object.userData.milieuId as MilieuId | undefined;
      if (id) {
        this.selectMilieu(id, true);
        this.callbacks.onSelectMilieu(id);
      }
    } else if (this.selectedId !== null) {
      this.selectMilieu(null, false);
      this.callbacks.onSelectMilieu(null);
      this.resetCamera();
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    const now = performance.now();
    if (now - this.lastHoverRaycast < 45) return;
    this.lastHoverRaycast = now;

    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, false);

    const nextHovered =
      hits.length > 0
        ? ((hits[0].object.userData.milieuId as MilieuId | undefined) ?? null)
        : null;

    if (nextHovered !== this.hoveredId) {
      this.hoveredId = nextHovered;
      for (const [id, rig] of this.milieuRigs) {
        rig.isHovered = id === nextHovered;
      }
      this.renderer.domElement.style.cursor = nextHovered ? 'pointer' : 'grab';
      this.callbacks.onHoverMilieu(nextHovered);
      if (this.isSoftwareGl) this.requestRender();
    }
  };

  public handleResize(): void {
    if (this.isDisposed) return;
    const width = Math.max(this.container.clientWidth, 320);
    const height = Math.max(this.container.clientHeight, 240);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.isSoftwareGl) {
      this.requestRender();
    }
  }

  public setTransformProgress(progress: number, scrubbing = false): void {
    this.targetProgress = clamp01(progress);
    this.progressDampLambda = scrubbing ? 16.0 : 4.4;
    if (this.selectedId) {
      this.focusCameraOnMilieu(this.selectedId);
    }
    if (this.isSoftwareGl) this.requestRender();
  }

  public setShowRiftsAndArrows(show: boolean): void {
    this.showRiftsAndArrows = show;
    if (this.isSoftwareGl) this.requestRender();
  }

  public setAutoRotate(enabled: boolean): void {
    this.autoRotateEnabled = enabled;
    this.controls.autoRotate = enabled && !this.isSoftwareGl;
    if (this.isSoftwareGl) this.requestRender();
  }

  public selectMilieu(id: MilieuId | null, tweenCamera = true): void {
    this.selectedId = id;
    for (const [mid, rig] of this.milieuRigs) {
      rig.isSelected = mid === id;
    }
    if (id && tweenCamera) {
      this.focusCameraOnMilieu(id);
    }
    if (this.isSoftwareGl) this.requestRender();
  }

  public setHoveredMilieu(id: MilieuId | null): void {
    if (this.hoveredId === id) return;
    this.hoveredId = id;
    for (const [mid, rig] of this.milieuRigs) {
      rig.isHovered = mid === id;
    }
    if (this.isSoftwareGl) this.requestRender();
  }

  private focusCameraOnMilieu(id: MilieuId): void {
    const rig = this.milieuRigs.get(id);
    if (!rig) return;
    const snap = interpolateMilieuFrame(rig.spec, this.targetProgress);
    const focusY = Math.max(0.6, snap.height * 0.55);

    // Shift look-at target slightly rightward (+1.7) on wide viewports so the focused tower sits clearly left of the right sidebar
    const sidebarShiftX = this.container.clientWidth > 768 ? 1.75 : 0;
    _camTargetTarget.set(snap.x + sidebarShiftX, focusY, snap.z);

    // Offset camera along an aesthetically balanced front angle
    const offsetDirX = snap.x >= 0 ? 5.2 : -4.2;
    const offsetDirZ = snap.z >= 2 ? 9.2 : 9.8;
    const offsetY = Math.max(5.2, snap.height + 3.6);

    _camPosTarget.set(
      snap.x + sidebarShiftX + offsetDirX,
      offsetY,
      snap.z + offsetDirZ,
    );
    this.isCameraTweening = true;
  }

  public resetCamera(): void {
    _camPosTarget.copy(DEFAULT_CAMERA_POS);
    _camTargetTarget.copy(DEFAULT_CAMERA_TARGET);
    this.isCameraTweening = true;
    if (this.isSoftwareGl) this.requestRender();
  }

  /**
   * Advances all smooth transitions (2020<->2035 height/pos/scale, camera tween, hover/selection glow)
   * Returns true if any transition is still moving.
   */
  private stepAnimations(dt: number): boolean {
    const safeDt = Math.min(dt, 0.25);
    this.elapsedTime += safeDt;
    let moving = false;

    // 0. Smoothly damp continuous 2D <-> 3D morph progress
    this.currentProgress = THREE.MathUtils.damp(
      this.currentProgress,
      this.targetProgress,
      this.progressDampLambda,
      safeDt,
    );
    if (Math.abs(this.currentProgress - this.targetProgress) > 0.002) {
      moving = true;
    } else {
      this.currentProgress = this.targetProgress;
    }

    const riftPhase = smootherstep(0.18, 0.68, this.currentProgress);
    const arrowPhase = smootherstep(0.45, 0.94, this.currentProgress);

    // Scale Z-axis mast gently with 3D extrusion progress
    if (this.zAxisGroup) {
      const zScale = 0.12 + 0.88 * smootherstep(0.15, 0.95, this.currentProgress);
      this.zAxisGroup.scale.y = zScale;
    }

    // 1. Milieu pedestals driven by choreographed two-phase interpolation
    for (const rig of this.milieuRigs.values()) {
      const target = interpolateMilieuFrame(rig.spec, this.currentProgress);

      rig.currentX = target.x;
      rig.currentZ = target.z;
      rig.currentHeight = target.height;
      rig.currentScale = target.scale;

      rig.rootGroup.position.set(rig.currentX, 0, rig.currentZ);
      rig.footprintGroup.scale.set(rig.currentScale, 1, rig.currentScale);
      rig.coreGroup.scale.y = Math.max(0.05, rig.currentHeight);
      rig.topCapGroup.position.y = Math.max(0.05, rig.currentHeight);

      // Show downward dashed arrows on Erodierte Mitte once transition enters 3D phase
      if (rig.downArrowsGroup) {
        const downVisible = this.showRiftsAndArrows && arrowPhase > 0.06;
        rig.downArrowsGroup.visible = downVisible;
        rig.downArrowsGroup.scale.y = Math.max(0.1, arrowPhase);
      }

      // Hover / Selection highlight & gentle focus dimming of non-selected milieus
      const hasSelection = this.selectedId !== null;
      const targetEmissive = rig.isSelected
        ? 0.62
        : rig.isHovered
          ? 0.42
          : hasSelection
            ? 0.1
            : 0.22;
      const targetEdgeOpacity = rig.isSelected
        ? 1.0
        : rig.isHovered
          ? 0.95
          : hasSelection
            ? 0.28
            : 0.72;
      const targetCoreOpacity = hasSelection && !rig.isSelected
        ? (this.isSoftwareGl ? 0.34 : 0.38)
        : (this.isSoftwareGl ? 0.76 : 0.78);

      for (let mIdx = 0; mIdx < rig.coreMaterials.length; mIdx++) {
        const mat = rig.coreMaterials[mIdx];
        mat.emissiveIntensity = THREE.MathUtils.damp(
          mat.emissiveIntensity,
          targetEmissive,
          10,
          safeDt,
        );
        const desiredOp = mIdx % 2 === 1 && !hasSelection ? 0.92 : targetCoreOpacity;
        mat.opacity = THREE.MathUtils.damp(mat.opacity, desiredOp, 10, safeDt);
      }
      for (const edgeMat of rig.edgeMaterials) {
        edgeMat.opacity = THREE.MathUtils.damp(
          edgeMat.opacity,
          targetEdgeOpacity,
          10,
          safeDt,
        );
      }
    }

    // 2. Rifts & Mobility Arrows opacity choreographed with morph progress
    const targetRifts = this.showRiftsAndArrows ? riftPhase : 0.0;
    const targetArrows = this.showRiftsAndArrows ? arrowPhase : 0.0;
    this.currentExtrasOpacity = THREE.MathUtils.damp(
      this.currentExtrasOpacity,
      targetRifts,
      10.0,
      safeDt,
    );
    this.currentArrowOpacity = THREE.MathUtils.damp(
      this.currentArrowOpacity,
      targetArrows,
      10.0,
      safeDt,
    );
    if (
      Math.abs(this.currentExtrasOpacity - targetRifts) > 0.01 ||
      Math.abs(this.currentArrowOpacity - targetArrows) > 0.01
    ) {
      moving = true;
    }

    this.riftsGroup.visible = this.currentExtrasOpacity > 0.02;
    this.mobilityGroup.visible = this.currentArrowOpacity > 0.02;

    for (let i = 0; i < this.riftMaterials.length; i++) {
      const baseOp = i % 2 === 0 ? 0.85 : 0.24;
      this.riftMaterials[i].opacity = baseOp * this.currentExtrasOpacity;
    }

    for (const arrow of this.mobilityArrows) {
      arrow.group.scale.y = Math.max(0.08, this.currentArrowOpacity);
      for (const mat of arrow.materials) {
        if ('opacity' in mat) {
          mat.opacity = 0.92 * this.currentArrowOpacity;
        }
      }
      // Animate pulse particles along arrow curves
      if (this.mobilityGroup.visible && !this.isSoftwareGl) {
        for (let i = 0; i < arrow.pulses.length; i++) {
          const t = (this.elapsedTime * 0.38 + i / arrow.pulses.length) % 1;
          arrow.curve.getPointAt(t, _vec3);
          arrow.pulses[i].position.copy(_vec3);
        }
      } else if (this.mobilityGroup.visible) {
        for (let i = 0; i < arrow.pulses.length; i++) {
          const t = (0.25 + i * 0.3) % 1;
          arrow.curve.getPointAt(t, _vec3);
          arrow.pulses[i].position.copy(_vec3);
        }
      }
    }

    // 3. Camera Tweening
    if (this.isCameraTweening) {
      this.camera.position.x = THREE.MathUtils.damp(
        this.camera.position.x,
        _camPosTarget.x,
        4.8,
        safeDt,
      );
      this.camera.position.y = THREE.MathUtils.damp(
        this.camera.position.y,
        _camPosTarget.y,
        4.8,
        safeDt,
      );
      this.camera.position.z = THREE.MathUtils.damp(
        this.camera.position.z,
        _camPosTarget.z,
        4.8,
        safeDt,
      );
      this.controls.target.x = THREE.MathUtils.damp(
        this.controls.target.x,
        _camTargetTarget.x,
        4.8,
        safeDt,
      );
      this.controls.target.y = THREE.MathUtils.damp(
        this.controls.target.y,
        _camTargetTarget.y,
        4.8,
        safeDt,
      );
      this.controls.target.z = THREE.MathUtils.damp(
        this.controls.target.z,
        _camTargetTarget.z,
        4.8,
        safeDt,
      );

      if (
        this.camera.position.distanceTo(_camPosTarget) < 0.06 &&
        this.controls.target.distanceTo(_camTargetTarget) < 0.05
      ) {
        this.isCameraTweening = false;
      } else {
        moving = true;
      }
    }

    return moving;
  }

  private projectAndEmitLabels(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width <= 0 || height <= 0) return;

    this.camera.updateMatrixWorld();

    // Project 6 milieu labels
    const rawInputs: LabelLayoutInput[] = [];
    const visibilityMap: Record<string, boolean> = {};

    for (const rig of this.milieuRigs.values()) {
      _vec3.set(rig.currentX, rig.currentHeight + 0.52, rig.currentZ);
      _vec3.project(this.camera);
      const screen = ndcToScreen(_vec3.x, _vec3.y, _vec3.z, width, height);
      visibilityMap[rig.spec.id] = screen.visible;

      rawInputs.push({
        id: rig.spec.id,
        x: screen.x,
        y: screen.y,
        width: 196,
        height: 46,
        priority: rig.isSelected ? 100 : rig.spec.height2035,
      });
    }

    const rightSafe = this.selectedId && width > 768 ? 435 : 28;
    const resolved = resolveLabelOverlaps(rawInputs, width, height, {
      left: 24,
      right: rightSafe,
      top: 88,
      bottom: 112,
    });

    const milieuPositions: Record<string, ProjectedLabelPosition> = {};
    for (const item of resolved) {
      const isVisible =
        (visibilityMap[item.id] ?? true) &&
        this.selectedId === item.id;
      milieuPositions[item.id] = {
        id: item.id,
        x: item.x,
        y: item.y,
        visible: isVisible,
      };
    }

    // Project axis labels (hidden when a milieu is focused for a clean inspection view)
    const axisPositions: Record<string, ProjectedLabelPosition> = {};
    const showAxes = this.selectedId === null;
    const zScale = this.zAxisGroup ? this.zAxisGroup.scale.y : 1;
    for (const ax of AXIS_LABELS) {
      const worldY = ax.id === 'axis-z-top' ? 0.65 + zScale * 7.2 : ax.worldPos.y;
      _vec3.set(ax.worldPos.x, worldY, ax.worldPos.z);
      _vec3.project(this.camera);
      const screen = ndcToScreen(_vec3.x, _vec3.y, _vec3.z, width, height);
      const zAxisVisible = ax.id !== 'axis-z-top' || this.currentProgress >= 0.18;
      axisPositions[ax.id] = {
        id: ax.id,
        x: Math.round(screen.x),
        y: Math.round(screen.y),
        visible:
          showAxes &&
          zAxisVisible &&
          screen.visible &&
          screen.x > 48 &&
          screen.x < width - 48 &&
          screen.y > 72 &&
          screen.y < height - 102,
      };
    }

    this.callbacks.onLabelsFrame(milieuPositions, axisPositions);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } else {
      this.frameId = window.setTimeout(cb, 80);
    }
  }

  private requestRender(): void {
    if (this.isDisposed) return;
    if (this.renderBusy) {
      this.renderDirty = true;
      return;
    }
    this.renderBusy = true;
    this.frameId = requestAnimationFrame(() => {
      if (this.isDisposed) return;
      this.renderDirty = false;
      const now = performance.now();
      const dt = Math.max(0.001, (now - this.lastTickMs) / 1000);
      this.lastTickMs = now;
      const stillMoving = this.stepAnimations(dt);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.projectAndEmitLabels();

      const done = () => {
        this.renderBusy = false;
        if (this.isDisposed) return;
        if (this.renderDirty || stillMoving) {
          this.requestRender();
        }
      };

      if (this.isSoftwareGl) {
        this.afterDraw(done);
      } else {
        done();
      }
    });
  }

  private tickGpu = (): void => {
    if (this.isDisposed) return;
    const now = performance.now();
    const dt = Math.max(0.001, (now - this.lastTickMs) / 1000);
    this.lastTickMs = now;
    this.stepAnimations(dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.projectAndEmitLabels();
    this.frameId = requestAnimationFrame(this.tickGpu);
  };

  public dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('pointerup', this.onPointerUp);
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('webglcontextlost', this.onWebglContextLost);
    dom.removeEventListener('webglcontextrestored', this.onWebglContextRestored);

    this.controls.dispose();
    this.envTexture?.dispose();

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Line) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (dom.parentElement === this.container) {
      this.container.removeChild(dom);
    }
  }
}
