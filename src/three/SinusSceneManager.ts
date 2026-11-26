import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  AXIS_LABELS,
  CLASSIC_MILIEUS_2026,
  MILIEUS,
  RIFT_LINES,
  type AxisLabelSpec,
  type ClassicMilieu2026Spec,
  type MilieuId,
  type MilieuSpec,
  type ModelMode,
  type RiftLineSpec,
} from '../data/milieus';
import {
  clamp01,
  interpolateMilieuFrame,
  ndcToScreen,
  scoreToWorldCoords,
  smootherstep,
} from '../utils/projection';
import {
  buildClassic2026Rig,
  buildFloatingIslandRig,
  buildUserMarkerRig,
  type Classic2026Rig,
  type FloatingIslandRig,
  type UserMarkerRig,
} from './organicShapes';

export interface ProjectedLabelPosition {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

export interface SelectionPayload {
  kind: '2035' | '2026';
  id: string;
}

export interface SceneCallbacks {
  onSelect: (selection: SelectionPayload | null) => void;
  onHover: (selection: SelectionPayload | null) => void;
  onLabelsFrame: (
    axisPositions: Record<string, ProjectedLabelPosition>,
    userMarkerPosition: ProjectedLabelPosition,
  ) => void;
  onContextLost?: (lost: boolean) => void;
}

export interface DynamicSceneData {
  milieus: MilieuSpec[];
  classicMilieus: ClassicMilieu2026Spec[];
  axisLabels: AxisLabelSpec[];
  riftLines: RiftLineSpec[];
}

const _vec3 = new THREE.Vector3();
const _camTargetTarget = new THREE.Vector3();
const _camPosTarget = new THREE.Vector3();

const DEFAULT_CAMERA_POS = new THREE.Vector3(12.6, 16.4, 26.5);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(-0.3, 1.2, 1.25);

const EMPTY_AXIS_POSITIONS: Record<string, ProjectedLabelPosition> = (() => {
  const map: Record<string, ProjectedLabelPosition> = {};
  for (const ax of AXIS_LABELS) {
    map[ax.id] = { id: ax.id, x: 0, y: 0, visible: false };
  }
  return map;
})();

function createAxisSpriteTexture(
  title: string,
  subtitle: string | undefined,
  accentColor: string,
  maxAnisotropy = 4,
): { texture: THREE.CanvasTexture; aspect: number } {
  const canvas = document.createElement('canvas');
  const dpr = 2;
  const width = 560;
  const height = subtitle ? 148 : 92;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(10, 12, 16, 0.94)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(6, 6, width - 12, height - 12, 22);
    ctx.fill();
    ctx.stroke();

    // Top subtle Linear highlight edge
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(24, 14, width - 48, 5, 3);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 34px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, width / 2, subtitle ? 58 : height / 2 + 2);

    if (subtitle) {
      ctx.fillStyle = accentColor === '#f8fafc' ? '#cbd5e1' : accentColor;
      ctx.font = '600 24px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(subtitle, width / 2, 106);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return { texture, aspect: width / height };
}

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

  private islandRigs: Map<MilieuId, FloatingIslandRig> = new Map();
  private classicRigs: Map<string, Classic2026Rig> = new Map();
  private interactables2035: THREE.Object3D[] = [];
  private interactables2026: THREE.Object3D[] = [];
  private islandsGroup: THREE.Group;
  private classicGroup: THREE.Group;
  private axisSignsGroup: THREE.Group;
  private riftsGroup: THREE.Group;
  private riftMaterials: THREE.MeshBasicMaterial[] = [];
  private zAxisGroup: THREE.Group | null = null;
  private zTopSprite: THREE.Sprite | null = null;
  private maxAnisotropy = 4;
  private userMarker: UserMarkerRig;
  private hasUserMarker = false;
  private userWorldPos = { x: 0, y: 2, z: 0 };

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private pointerDownPos = { x: 0, y: 0 };

  private targetProgress = 1.0; // 1.0 = 2035 floating 3D, 0.0 = 2026 classic 2D
  private currentProgress = 1.0;
  private currentRiftOpacity = 1.0;
  private selection: SelectionPayload | null = null;
  private hovered: SelectionPayload | null = null;

  private isCameraTweening = false;
  private fullscreenZoom = false;
  private lastTickMs = 0;

  private frameId = 0;
  private renderBusy = false;
  private renderDirty = false;
  private isDisposed = false;
  private isVisibleInViewport = true;
  private gpuRafScheduled = false;
  private isTicking = false;
  private needsSceneStep = true;
  private isPointerDown = false;
  private wasMultiTouch = false;
  private activeTouchPointers = new Set<number>();
  private lastHoverRaycast = 0;
  private lastZoomScale = 1.0;

  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver | null = null;

  constructor(
    container: HTMLElement,
    callbacks: SceneCallbacks,
    initialData?: DynamicSceneData,
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareGl();

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 240);

    // 1. Pure-black Linear Editorial Scene (#040406) fading smoothly at horizon
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040406);
    this.scene.fog = new THREE.FogExp2(0x040406, 0.0082);

    // 2. Responsive Camera
    const initMetrics = this.getViewportCameraMetrics(width, height);
    this.lastZoomScale = initMetrics.zoomScale;
    this.camera = new THREE.PerspectiveCamera(
      initMetrics.fov,
      width / height,
      0.1,
      220,
    );
    this.camera.position.copy(DEFAULT_CAMERA_POS).multiplyScalar(initMetrics.zoomScale);

    // 3. Renderer (adaptive pixel budget for 4K school boards & high-DPI mobile phones)
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.computeTargetPixelRatio(width, height));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    // Soft procedural ground contact shadows handle grounding at zero shadow-pass cost
    this.renderer.shadowMap.enabled = false;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.style.cursor = 'grab';
    this.container.appendChild(this.renderer.domElement);

    const maxAnisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    this.maxAnisotropy = maxAnisotropy;

    // 4. Studio Environment Reflections
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;
    pmrem.dispose();

    // 5. OrbitControls (fluid inertia on laptops & centered pinch-zoom on smartphones)
    const isCoarseTouch = this.isCoarseInput();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(DEFAULT_CAMERA_TARGET);
    this.controls.enableZoom = false;
    this.controls.enablePan = !isCoarseTouch;
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_ROTATE,
    };
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.075;
    this.controls.rotateSpeed = isCoarseTouch ? 1.25 : 0.9;
    this.controls.zoomSpeed = isCoarseTouch ? 1.15 : 1.0;
    this.controls.minDistance = 6.2;
    this.controls.maxDistance = 70;
    this.controls.minPolarAngle = 0.16;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.06;
    this.controls.update();

    this.controls.addEventListener('start', () => {
      this.isCameraTweening = false;
      this.scheduleRender();
    });

    this.controls.addEventListener('change', () => {
      this.scheduleRender();
    });

    // 6. Lighting Rig
    this.setupLighting();

    // 7. Floor Plate, Fine Grid, Axis Beams & Engraved 3D Axis Plaques
    this.axisSignsGroup = new THREE.Group();
    this.setupCoordinateFloorAndAxes();
    this.scene.add(this.axisSignsGroup);
    this.buildAxisSigns(initialData?.axisLabels ?? AXIS_LABELS);

    // 8. 6 Floating 2035 Islands
    this.islandsGroup = new THREE.Group();
    this.scene.add(this.islandsGroup);
    this.buildIslands(initialData?.milieus ?? MILIEUS);

    // 9. 10 Classic Overlapping 2026 SINUS Ellipses
    this.classicGroup = new THREE.Group();
    this.classicGroup.visible = false;
    this.scene.add(this.classicGroup);
    this.buildClassicMilieus(initialData?.classicMilieus ?? CLASSIC_MILIEUS_2026);

    // 10. Subtle Crimson Separation Rifts on 2035 Floor
    this.riftsGroup = new THREE.Group();
    this.scene.add(this.riftsGroup);
    this.buildRiftLines(initialData?.riftLines ?? RIFT_LINES);

    // 11. User Self-Test Marker
    this.userMarker = buildUserMarkerRig();
    this.scene.add(this.userMarker.rootGroup);

    this.raycaster.layers.set(1);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const visible = Boolean(entry?.isIntersecting);
          this.isVisibleInViewport = visible;
          if (visible) {
            this.lastTickMs = performance.now();
            this.scheduleRender();
          }
        },
        { rootMargin: '120px 0px' },
      );
      this.intersectionObserver.observe(this.container);
    }

    this.lastTickMs = performance.now();
    this.scheduleRender();
  }

  private isCoarseInput(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return (
      Boolean(window.matchMedia('(pointer: coarse)').matches) ||
      (Boolean(window.matchMedia('(any-pointer: coarse)').matches) &&
        window.innerWidth < 1024)
    );
  }

  private computeTargetPixelRatio(width: number, height: number): number {
    if (this.isSoftwareGl) return 1;
    const area = Math.max(1, width * height);
    const isLargeTouchBoard =
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(any-pointer: coarse)').matches) &&
      area >= 1_150_000;

    const maxPixels = isLargeTouchBoard ? 1_400_000 : 2_600_000;
    const maxDpr = isLargeTouchBoard ? 1.25 : 2.0;
    const areaCapDpr = Math.sqrt(maxPixels / area);
    return Math.max(1.0, Math.min(window.devicePixelRatio || 1, maxDpr, areaCapDpr));
  }

  private setupLighting(): void {
    const hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x0f172a, 1.18);
    hemiLight.position.set(0, 24, 0);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffcf5, 1.45);
    keyLight.position.set(12, 22, 12);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.85);
    rimLight.position.set(-14, 14, -15);
    this.scene.add(rimLight);
  }

  private setupCoordinateFloorAndAxes(): void {
    // Matte pure-black architectural floor plate blending into dark canvas
    const floorGeo = new THREE.PlaneGeometry(24.0, 18.8);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshLambertMaterial({
      color: 0x0b0d11,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(-0.3, -0.025, 0.25);
    this.scene.add(floorMesh);

    // Subtle platform border frame
    const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(20.4, 0.05, 16.4));
    const borderMat = new THREE.LineBasicMaterial({
      color: 0x2a2e39,
      transparent: true,
      opacity: 0.95,
    });
    const borderLines = new THREE.LineSegments(borderGeo, borderMat);
    borderLines.position.y = -0.02;
    this.scene.add(borderLines);

    // Fine dark-graphite coordinate grid
    const grid = new THREE.GridHelper(20, 20, 0x2c313d, 0x1c1f27);
    grid.position.y = 0.002;
    const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
    for (const m of gridMats) {
      m.transparent = true;
      m.opacity = 0.9;
      m.polygonOffset = true;
      m.polygonOffsetFactor = -1;
      m.polygonOffsetUnits = -1;
    }
    this.scene.add(grid);

    const axisGroup = new THREE.Group();
    const axisMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.4,
      metalness: 0.35,
    });

    // X-Axis beam along front
    const xBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 19.0, 10), axisMat);
    xBar.rotation.z = Math.PI / 2;
    xBar.position.set(0, 0.035, 7.6);
    axisGroup.add(xBar);

    const xConeRight = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.38, 12),
      new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.35 }),
    );
    xConeRight.rotation.z = -Math.PI / 2;
    xConeRight.position.set(9.6, 0.035, 7.6);
    axisGroup.add(xConeRight);

    const xConeLeft = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.38, 12), axisMat);
    xConeLeft.rotation.z = Math.PI / 2;
    xConeLeft.position.set(-9.6, 0.035, 7.6);
    axisGroup.add(xConeLeft);

    // Y-Axis (Soziale Lage) beam along left edge
    const yBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 14.4, 10), axisMat);
    yBar.rotation.x = Math.PI / 2;
    yBar.position.set(-9.8, 0.035, 0);
    axisGroup.add(yBar);

    const yConeBack = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.38, 12),
      new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.35 }),
    );
    yConeBack.rotation.x = -Math.PI / 2;
    yConeBack.position.set(-9.8, 0.035, -7.3);
    axisGroup.add(yConeBack);

    // Z-Axis (Vertical Resilience) mast at back-right (scale 0..100 -> 0..7.5 units)
    const zAxisGroup = new THREE.Group();
    const zMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.32,
      metalness: 0.25,
    });
    const zBar = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 7.5, 12), zMat);
    zBar.position.set(9.2, 3.75, -5.8);
    zAxisGroup.add(zBar);

    const zCone = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 12), zMat);
    zCone.position.set(9.2, 7.65, -5.8);
    zAxisGroup.add(zCone);

    // Tick rings at 25, 50, 75, 100
    const tickGeo = new THREE.TorusGeometry(0.13, 0.02, 8, 20);
    tickGeo.rotateX(Math.PI / 2);
    for (const h of [1.875, 3.75, 5.625, 7.5]) {
      const tick = new THREE.Mesh(tickGeo, zMat);
      tick.position.set(9.2, h, -5.8);
      zAxisGroup.add(tick);
    }

    this.zAxisGroup = zAxisGroup;
    axisGroup.add(zAxisGroup);

    this.scene.add(axisGroup);
  }

  private disposeGroupChildren(group: THREE.Group): void {
    const children = [...group.children];
    for (const child of children) {
      group.remove(child);
      child.traverse((obj) => {
        if (
          obj instanceof THREE.Mesh ||
          obj instanceof THREE.LineSegments ||
          obj instanceof THREE.Line
        ) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        } else if (obj instanceof THREE.Sprite) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      });
    }
  }

  private buildAxisSigns(axisLabels: AxisLabelSpec[]): void {
    this.disposeGroupChildren(this.axisSignsGroup);
    if (this.zTopSprite && this.zAxisGroup) {
      this.zAxisGroup.remove(this.zTopSprite);
      this.zTopSprite.material.map?.dispose();
      this.zTopSprite.material.dispose();
      this.zTopSprite = null;
    }

    const pinGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.72, 8);
    const baseDotGeo = new THREE.CircleGeometry(0.11, 16);
    baseDotGeo.rotateX(-Math.PI / 2);

    for (const label of axisLabels) {
      const { texture, aspect } = createAxisSpriteTexture(
        label.text,
        label.subtext,
        label.accentColor,
        this.maxAnisotropy,
      );
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(spriteMat);

      if (label.axis === 'Z' && this.zAxisGroup) {
        sprite.position.set(label.worldPos.x, Math.max(8.2, label.worldPos.y), label.worldPos.z);
        sprite.scale.set(3.45, 3.45 / aspect, 1);
        this.zAxisGroup.add(sprite);
        this.zTopSprite = sprite;
      } else {
        const pinColor = new THREE.Color(label.accentColor);
        const pinMat = new THREE.MeshBasicMaterial({
          color: pinColor,
          transparent: true,
          opacity: 0.65,
        });
        const pin = new THREE.Mesh(pinGeo, pinMat);
        pin.position.set(label.worldPos.x, 0.36, label.worldPos.z);
        this.axisSignsGroup.add(pin);

        const dot = new THREE.Mesh(baseDotGeo, pinMat);
        dot.position.set(label.worldPos.x, 0.03, label.worldPos.z);
        this.axisSignsGroup.add(dot);

        const spriteScale = label.axis === 'X' ? 4.0 : 3.65;
        sprite.position.set(label.worldPos.x, Math.max(1.15, label.worldPos.y), label.worldPos.z);
        sprite.scale.set(spriteScale, spriteScale / aspect, 1);
        this.axisSignsGroup.add(sprite);
      }
    }
  }

  private buildIslands(milieus: MilieuSpec[]): void {
    this.disposeGroupChildren(this.islandsGroup);
    this.islandRigs.clear();
    this.interactables2035 = [];

    for (const spec of milieus) {
      const rig = buildFloatingIslandRig(spec, this.maxAnisotropy);
      rig.isSelected =
        this.selection?.kind === '2035' && this.selection.id === spec.id;
      rig.isHovered =
        this.hovered?.kind === '2035' && this.hovered.id === spec.id;
      this.islandsGroup.add(rig.rootGroup);
      this.islandRigs.set(spec.id, rig);
      this.interactables2035.push(rig.hitMesh);
    }
  }

  private buildClassicMilieus(classicMilieus: ClassicMilieu2026Spec[]): void {
    this.disposeGroupChildren(this.classicGroup);
    this.classicRigs.clear();
    this.interactables2026 = [];

    for (const spec of classicMilieus) {
      const rig = buildClassic2026Rig(spec, this.maxAnisotropy);
      rig.isSelected =
        this.selection?.kind === '2026' && this.selection.id === spec.id;
      rig.isHovered =
        this.hovered?.kind === '2026' && this.hovered.id === spec.id;
      this.classicGroup.add(rig.rootGroup);
      this.classicRigs.set(spec.id, rig);
      this.interactables2026.push(rig.hitMesh);
    }
  }

  private buildRiftLines(riftLines: RiftLineSpec[]): void {
    this.disposeGroupChildren(this.riftsGroup);
    this.riftMaterials = [];

    for (const rift of riftLines) {
      if (!rift.points || rift.points.length < 2) continue;
      const pts = rift.points.map((p) => new THREE.Vector3(p.x, 0.026, p.z));
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);

      const coreGeo = new THREE.TubeGeometry(curve, 20, 0.032, 6, false);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xe11d48,
        transparent: true,
        opacity: 0.58,
      });
      this.riftMaterials.push(coreMat);
      this.riftsGroup.add(new THREE.Mesh(coreGeo, coreMat));

      const haloGeo = new THREE.TubeGeometry(curve, 20, 0.1, 6, false);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xfda4af,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      });
      this.riftMaterials.push(haloMat);
      this.riftsGroup.add(new THREE.Mesh(haloGeo, haloMat));
    }
  }

  public updateSceneData(data: DynamicSceneData): void {
    if (this.isDisposed) return;
    this.buildAxisSigns(data.axisLabels);
    this.buildIslands(data.milieus);
    this.buildClassicMilieus(data.classicMilieus);
    this.buildRiftLines(data.riftLines);
    this.needsSceneStep = true;
    this.stepAnimations(0.016);
    this.scheduleRender();
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;
    dom.addEventListener('wheel', this.onCanvasWheel, { capture: true, passive: true });
    dom.addEventListener('touchstart', this.onTouchStart, { capture: true, passive: true });
    dom.addEventListener('touchend', this.onTouchEnd, { capture: true, passive: true });
    dom.addEventListener('touchcancel', this.onTouchEnd, { capture: true, passive: true });
    dom.addEventListener('pointerdown', this.onPointerDownCapture, { capture: true });
    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('pointercancel', this.onPointerCancel);
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerleave', this.onPointerLeave);
    dom.addEventListener('webglcontextlost', this.onWebglContextLost);
    dom.addEventListener('webglcontextrestored', this.onWebglContextRestored);
  }

  private syncTouchZoomState(): void {
    this.controls.enableZoom =
      this.fullscreenZoom || this.activeTouchPointers.size >= 2;
  }

  private onPointerDownCapture = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') {
      this.activeTouchPointers.add(e.pointerId);
      if (this.activeTouchPointers.size >= 2) {
        this.wasMultiTouch = true;
      } else if (this.activeTouchPointers.size === 1) {
        this.wasMultiTouch = false;
      }
      this.syncTouchZoomState();
    }
  };

  private onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length >= 2) {
      this.wasMultiTouch = true;
    } else if (e.touches.length === 1) {
      this.wasMultiTouch = false;
    }
    this.controls.enableZoom =
      this.fullscreenZoom ||
      e.touches.length >= 2 ||
      this.activeTouchPointers.size >= 2;
  };

  private onTouchEnd = (e: TouchEvent): void => {
    if (e.touches.length === 0) {
      this.activeTouchPointers.clear();
    }
    this.controls.enableZoom =
      this.fullscreenZoom ||
      e.touches.length >= 2 ||
      this.activeTouchPointers.size >= 2;
  };

  private onCanvasWheel = (e: WheelEvent): void => {
    const allowZoom = this.fullscreenZoom || e.ctrlKey || e.metaKey;
    this.controls.enableZoom = allowZoom;
    if (!this.fullscreenZoom && allowZoom) {
      window.setTimeout(() => {
        if (!this.isDisposed) {
          this.controls.enableZoom = this.fullscreenZoom;
        }
      }, 0);
    }
  };

  private onPointerCancel = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') {
      this.activeTouchPointers.delete(e.pointerId);
      this.syncTouchZoomState();
    }
    this.isPointerDown = false;
    this.renderer.domElement.style.cursor = 'grab';
    this.container.removeAttribute('data-canvas-grabbing');
  };

  private onPointerLeave = (): void => {
    this.isPointerDown = false;
    this.renderer.domElement.style.cursor = 'grab';
    this.container.removeAttribute('data-hover-3d');
    this.container.removeAttribute('data-canvas-grabbing');
  };

  private onWebglContextLost = (e: Event): void => {
    e.preventDefault();
    this.callbacks.onContextLost?.(true);
  };

  private onWebglContextRestored = (): void => {
    this.callbacks.onContextLost?.(false);
    this.scheduleRender();
  };

  private updatePointerNdc(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private getActiveInteractables(): THREE.Object3D[] {
    return this.currentProgress >= 0.45
      ? this.interactables2035
      : this.interactables2026;
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.isPointerDown = true;
    this.pointerDownPos.x = e.clientX;
    this.pointerDownPos.y = e.clientY;
    this.renderer.domElement.style.cursor = 'grabbing';
    this.container.setAttribute('data-canvas-grabbing', 'true');
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') {
      this.activeTouchPointers.delete(e.pointerId);
      this.syncTouchZoomState();
    }
    this.isPointerDown = false;
    this.renderer.domElement.style.cursor = this.hovered ? 'pointer' : 'grab';
    this.container.removeAttribute('data-canvas-grabbing');
    if (this.wasMultiTouch && e.pointerType === 'touch') {
      if (this.activeTouchPointers.size === 0) {
        this.wasMultiTouch = false;
      }
      return;
    }
    const maxTapDist = e.pointerType === 'touch' ? 16 : 8;
    const dist = Math.hypot(
      e.clientX - this.pointerDownPos.x,
      e.clientY - this.pointerDownPos.y,
    );
    if (dist > maxTapDist) return;

    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.getActiveInteractables(), false);

    if (hits.length > 0) {
      const data = hits[0].object.userData;
      if (data.kind === '2035' && data.milieuId) {
        const next: SelectionPayload = { kind: '2035', id: data.milieuId as MilieuId };
        this.applySelection(next, true);
        this.callbacks.onSelect(next);
      } else if (data.kind === '2026' && data.classicId) {
        const next: SelectionPayload = { kind: '2026', id: data.classicId as string };
        this.applySelection(next, true);
        this.callbacks.onSelect(next);
      }
    } else if (this.selection !== null) {
      this.applySelection(null, false);
      this.callbacks.onSelect(null);
      this.resetCamera();
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    // Skip hover raycasting completely on touch/pen whiteboards or while orbiting
    if (this.isPointerDown || e.pointerType === 'touch' || e.pointerType === 'pen') {
      return;
    }
    const now = performance.now();
    if (now - this.lastHoverRaycast < 35) return;
    this.lastHoverRaycast = now;

    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.getActiveInteractables(), false);

    let nextHover: SelectionPayload | null = null;
    if (hits.length > 0) {
      const data = hits[0].object.userData;
      if (data.kind === '2035' && data.milieuId) {
        nextHover = { kind: '2035', id: data.milieuId as MilieuId };
      } else if (data.kind === '2026' && data.classicId) {
        nextHover = { kind: '2026', id: data.classicId as string };
      }
    }

    const changed =
      nextHover?.kind !== this.hovered?.kind || nextHover?.id !== this.hovered?.id;
    if (changed) {
      this.hovered = nextHover;
      for (const [id, rig] of this.islandRigs) {
        rig.isHovered = nextHover?.kind === '2035' && nextHover.id === id;
      }
      for (const [id, rig] of this.classicRigs) {
        rig.isHovered = nextHover?.kind === '2026' && nextHover.id === id;
      }
      this.renderer.domElement.style.cursor = nextHover ? 'pointer' : 'grab';
      this.container.setAttribute('data-hover-3d', nextHover ? 'true' : 'false');
      this.callbacks.onHover(nextHover);
      this.needsSceneStep = true;
      this.scheduleRender();
    }
  };

  private getViewportCameraMetrics(
    width: number,
    height: number,
  ): { fov: number; zoomScale: number; isMobile: boolean } {
    const aspect = width / Math.max(1, height);
    const isMobile = width < 640;
    const fov = aspect < 0.95 ? 50 : aspect < 1.25 ? 45 : 40;
    const zoomScale =
      aspect < 1.25
        ? Math.min(1.36, Math.max(0.98, 1.1 / Math.max(0.55, aspect)))
        : 1.0;
    return { fov, zoomScale, isMobile };
  }

  public handleResize(): void {
    if (this.isDisposed) return;
    const width = Math.max(this.container.clientWidth, 280);
    const height = Math.max(this.container.clientHeight, 240);
    const metrics = this.getViewportCameraMetrics(width, height);
    this.camera.fov = metrics.fov;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this.computeTargetPixelRatio(width, height));
    this.renderer.setSize(width, height);

    if (
      !this.selection &&
      Math.abs(metrics.zoomScale - this.lastZoomScale) > 0.04
    ) {
      if (this.targetProgress >= 0.5) {
        this.camera.position
          .copy(DEFAULT_CAMERA_POS)
          .multiplyScalar(metrics.zoomScale);
        this.controls.target.copy(DEFAULT_CAMERA_TARGET);
      } else {
        this.camera.position.set(
          0.0,
          19.4 * metrics.zoomScale,
          19.2 * metrics.zoomScale,
        );
        this.controls.target.set(0.0, 0.1, 0.55);
      }
      _camPosTarget.copy(this.camera.position);
      _camTargetTarget.copy(this.controls.target);
      this.isCameraTweening = false;
      this.controls.update();
    }
    this.lastZoomScale = metrics.zoomScale;

    this.scheduleRender();
  }

  public setMode(mode: ModelMode): void {
    this.targetProgress = mode === '2035' ? 1.0 : 0.0;
    // Clear selection if switching between 2026 and 2035 sets
    if (this.selection && this.selection.kind !== mode) {
      this.applySelection(null, false);
    }
    const { zoomScale } = this.getViewportCameraMetrics(
      Math.max(this.container.clientWidth, 280),
      Math.max(this.container.clientHeight, 240),
    );
    if (mode === '2026') {
      _camPosTarget.set(0.0, 19.4 * zoomScale, 19.2 * zoomScale);
      _camTargetTarget.set(0.0, 0.1, 0.55);
      this.isCameraTweening = true;
    } else if (!this.selection) {
      this.resetCamera();
    }
    this.needsSceneStep = true;
    this.scheduleRender();
  }

  public setUserSelfTestMarker(
    coords: { uX: number; uY: number; uZ: number } | null,
  ): void {
    if (!coords) {
      this.hasUserMarker = false;
      this.userMarker.rootGroup.visible = false;
      this.scheduleRender();
      return;
    }
    const world = scoreToWorldCoords(coords.uX, coords.uY, coords.uZ);
    this.hasUserMarker = true;
    this.userWorldPos = world;
    this.userMarker.rootGroup.position.set(world.x, 0, world.z);
    this.userMarker.beaconGroup.position.y = world.y;

    const posAttr = this.userMarker.plumbGeo.getAttribute(
      'position',
    ) as THREE.BufferAttribute;
    posAttr.setXYZ(0, 0, 0.04, 0);
    posAttr.setXYZ(1, 0, world.y, 0);
    posAttr.needsUpdate = true;
    this.userMarker.plumbLine.computeLineDistances();

    this.userMarker.rootGroup.visible = this.currentProgress > 0.45;
    this.needsSceneStep = true;
    this.scheduleRender();
  }

  public applySelection(selection: SelectionPayload | null, tweenCamera = true): void {
    this.selection = selection;
    for (const [id, rig] of this.islandRigs) {
      rig.isSelected = selection?.kind === '2035' && selection.id === id;
    }
    for (const [id, rig] of this.classicRigs) {
      rig.isSelected = selection?.kind === '2026' && selection.id === id;
    }

    if (selection && tweenCamera) {
      const width = Math.max(this.container.clientWidth, 280);
      const height = Math.max(this.container.clientHeight, 240);
      const { isMobile } = this.getViewportCameraMetrics(width, height);
      const shiftX = width > 900 ? 2.4 : 0;
      const shiftYMobile = isMobile ? (this.fullscreenZoom ? -0.45 : 0.05) : 0;

      if (selection.kind === '2035') {
        const rig = this.islandRigs.get(selection.id as MilieuId);
        if (rig) {
          const snap = interpolateMilieuFrame(rig.spec, this.targetProgress);
          _camTargetTarget.set(
            snap.x + shiftX,
            snap.elevation * 0.72 + shiftYMobile,
            snap.z,
          );
          const offX = isMobile ? 1.35 : snap.x >= 0 ? 4.8 : -4.2;
          _camPosTarget.set(
            snap.x + shiftX + offX,
            Math.max(4.4, snap.elevation + (isMobile ? 3.4 : 3.8)),
            snap.z + (isMobile ? 8.6 : 9.4),
          );
          this.isCameraTweening = true;
        }
      } else {
        const rig = this.classicRigs.get(selection.id);
        if (rig) {
          const shift2026 = width > 900 ? 2.0 : 0;
          _camTargetTarget.set(
            rig.spec.pos.x + shift2026,
            0.2 + (isMobile && this.fullscreenZoom ? -0.35 : 0),
            rig.spec.pos.z,
          );
          _camPosTarget.set(
            rig.spec.pos.x + shift2026 + (isMobile ? 1.0 : 2.4),
            isMobile ? 8.8 : 9.8,
            rig.spec.pos.z + (isMobile ? 8.8 : 9.4),
          );
          this.isCameraTweening = true;
        }
      }
    }
    this.needsSceneStep = true;
    this.scheduleRender();
  }

  public setFullscreenZoom(enabled: boolean): void {
    this.fullscreenZoom = enabled;
    this.controls.enableZoom = enabled;
  }

  public zoomByStep(direction: 'in' | 'out'): void {
    const factor = direction === 'in' ? 0.8 : 1.25;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const currentDist = Math.max(0.01, offset.length());
    const nextDist = THREE.MathUtils.clamp(
      currentDist * factor,
      this.controls.minDistance,
      this.controls.maxDistance,
    );
    offset.setLength(nextDist);
    _camTargetTarget.copy(this.controls.target);
    _camPosTarget.copy(this.controls.target).add(offset);
    this.isCameraTweening = true;
    this.needsSceneStep = true;
    this.scheduleRender();
  }

  public resetCamera(): void {
    const { zoomScale } = this.getViewportCameraMetrics(
      Math.max(this.container.clientWidth, 280),
      Math.max(this.container.clientHeight, 240),
    );
    _camPosTarget.copy(DEFAULT_CAMERA_POS).multiplyScalar(zoomScale);
    _camTargetTarget.copy(DEFAULT_CAMERA_TARGET);
    this.isCameraTweening = true;
    this.needsSceneStep = true;
    this.scheduleRender();
  }

  private stepAnimations(dt: number): boolean {
    const safeDt = Math.min(dt, 0.25);
    let moving = false;

    this.currentProgress = THREE.MathUtils.damp(
      this.currentProgress,
      this.targetProgress,
      4.8,
      safeDt,
    );
    if (Math.abs(this.currentProgress - this.targetProgress) > 0.002) {
      moving = true;
    } else {
      this.currentProgress = this.targetProgress;
    }

    const riftTarget = smootherstep(0.32, 0.85, this.currentProgress);
    this.currentRiftOpacity = THREE.MathUtils.damp(
      this.currentRiftOpacity,
      riftTarget,
      8.0,
      safeDt,
    );
    if (Math.abs(this.currentRiftOpacity - riftTarget) > 0.008) {
      moving = true;
    }

    // Scale Z-axis mast smoothly during 2026 <-> 2035 transition
    if (this.zAxisGroup) {
      const zScale = smootherstep(0.15, 0.92, this.currentProgress);
      this.zAxisGroup.visible = zScale > 0.04;
      this.zAxisGroup.scale.y = Math.max(0.05, zScale);
    }

    // Show user marker only when 2035 mode is active
    this.userMarker.rootGroup.visible =
      this.hasUserMarker && this.currentProgress > 0.45;

    // 1. Update 6 Floating 2035 Islands (Scheiben)
    const has2035Selection = this.selection?.kind === '2035';
    for (const rig of this.islandRigs.values()) {
      const frame = interpolateMilieuFrame(rig.spec, this.currentProgress);
      rig.currentX = frame.x;
      rig.currentZ = frame.z;
      rig.currentElevation = frame.elevation;
      rig.currentScale = frame.scale;

      rig.rootGroup.visible = frame.opacity2035 > 0.015;
      rig.rootGroup.position.set(frame.x, 0, frame.z);
      rig.islandGroup.position.y = frame.elevation;
      rig.islandGroup.scale.set(frame.scale, 1, frame.scale);

      // Update vertical plumb line endpoint cleanly when elevation changes
      if (Math.abs(rig.lastPlumbElevation - frame.elevation) > 0.005) {
        const posAttr = rig.plumbGeo.getAttribute('position') as THREE.BufferAttribute;
        posAttr.setXYZ(0, 0, 0.04, 0);
        posAttr.setXYZ(1, 0, Math.max(0.05, frame.elevation - 0.1), 0);
        posAttr.needsUpdate = true;
        rig.plumbLine.computeLineDistances();
        rig.lastPlumbElevation = frame.elevation;
      }

      const plumbAlpha = smootherstep(0.28, 0.85, this.currentProgress);
      rig.plumbLine.visible = plumbAlpha > 0.04;
      rig.plumbMat.opacity =
        (rig.isSelected ? 0.95 : has2035Selection ? 0.25 : 0.7) * plumbAlpha;

      const focusMul =
        has2035Selection && !rig.isSelected ? 0.3 : 1.0;

      const baseSlabOp = (this.isSoftwareGl ? 0.78 : 0.76) * frame.opacity2035 * focusMul;
      const targetEm = rig.isSelected ? 0.34 : rig.isHovered ? 0.26 : 0.16;
      for (const mat of rig.slabMaterials) {
        if (Math.abs(mat.opacity - baseSlabOp) > 0.004) {
          mat.opacity = THREE.MathUtils.damp(mat.opacity, baseSlabOp, 10, safeDt);
          moving = true;
        } else {
          mat.opacity = baseSlabOp;
        }
        if (Math.abs(mat.emissiveIntensity - targetEm) > 0.004) {
          mat.emissiveIntensity = THREE.MathUtils.damp(
            mat.emissiveIntensity,
            targetEm,
            10,
            safeDt,
          );
          moving = true;
        } else {
          mat.emissiveIntensity = targetEm;
        }
      }

      rig.undersideMat.opacity = 0.94 * frame.opacity2035 * focusMul;
      rig.anchorMat.opacity = 0.95 * frame.opacity2035 * focusMul;
      rig.shadowMat.opacity = 0.65 * frame.opacity2035 * focusMul;
      rig.labelSprite.position.y = frame.elevation + 0.85;
      rig.labelSprite.visible = frame.opacity2035 > 0.08;
      rig.labelMat.opacity =
        (rig.isSelected ? 1.0 : has2035Selection ? 0.34 : 0.95) * frame.opacity2035;

      const targetEdgeOp =
        (rig.isSelected ? 1.0 : rig.isHovered ? 0.9 : 0.72) *
        frame.opacity2035 *
        focusMul;
      for (const edgeMat of rig.edgeMaterials) {
        if (Math.abs(edgeMat.opacity - targetEdgeOp) > 0.004) {
          edgeMat.opacity = THREE.MathUtils.damp(edgeMat.opacity, targetEdgeOp, 10, safeDt);
          moving = true;
        } else {
          edgeMat.opacity = targetEdgeOp;
        }
      }
    }

    // 2. Update 10 Classic Overlapping 2026 Ellipses
    const classicFade = 1 - smootherstep(0.08, 0.55, this.currentProgress);
    this.classicGroup.visible = classicFade > 0.015;
    const has2026Selection = this.selection?.kind === '2026';

    if (this.classicGroup.visible) {
      for (const rig of this.classicRigs.values()) {
        const targetFillOp =
          (rig.isSelected ? 0.52 : rig.isHovered ? 0.42 : has2026Selection ? 0.15 : 0.3) *
          classicFade;
        const targetEdgeOp =
          (rig.isSelected ? 1.0 : rig.isHovered ? 0.98 : has2026Selection ? 0.42 : 0.9) *
          classicFade;
        rig.labelSprite.visible = classicFade > 0.08;
        rig.labelMat.opacity =
          (rig.isSelected ? 1.0 : has2026Selection ? 0.32 : 0.88) * classicFade;
        if (Math.abs(rig.fillMat.opacity - targetFillOp) > 0.004) {
          rig.fillMat.opacity = THREE.MathUtils.damp(
            rig.fillMat.opacity,
            targetFillOp,
            10,
            safeDt,
          );
          moving = true;
        } else {
          rig.fillMat.opacity = targetFillOp;
        }
        if (Math.abs(rig.edgeMat.opacity - targetEdgeOp) > 0.004) {
          rig.edgeMat.opacity = THREE.MathUtils.damp(
            rig.edgeMat.opacity,
            targetEdgeOp,
            10,
            safeDt,
          );
          moving = true;
        } else {
          rig.edgeMat.opacity = targetEdgeOp;
        }
      }
    }

    // 3. Floor Rifts in 2035 Mode
    this.riftsGroup.visible = this.currentRiftOpacity > 0.02;
    for (let i = 0; i < this.riftMaterials.length; i++) {
      const baseOp = i % 2 === 0 ? 0.58 : 0.28;
      this.riftMaterials[i].opacity = baseOp * this.currentRiftOpacity;
    }

    // 4. Camera Tweening
    if (this.isCameraTweening) {
      this.camera.position.x = THREE.MathUtils.damp(
        this.camera.position.x,
        _camPosTarget.x,
        5.0,
        safeDt,
      );
      this.camera.position.y = THREE.MathUtils.damp(
        this.camera.position.y,
        _camPosTarget.y,
        5.0,
        safeDt,
      );
      this.camera.position.z = THREE.MathUtils.damp(
        this.camera.position.z,
        _camPosTarget.z,
        5.0,
        safeDt,
      );
      this.controls.target.x = THREE.MathUtils.damp(
        this.controls.target.x,
        _camTargetTarget.x,
        5.0,
        safeDt,
      );
      this.controls.target.y = THREE.MathUtils.damp(
        this.controls.target.y,
        _camTargetTarget.y,
        5.0,
        safeDt,
      );
      this.controls.target.z = THREE.MathUtils.damp(
        this.controls.target.z,
        _camTargetTarget.z,
        5.0,
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
    const isMobile = width < 640;

    // Project User Self-Test Marker Label (axis labels are fixed in 3D world space on the floor rim)
    _vec3.set(this.userWorldPos.x, this.userWorldPos.y + 0.62, this.userWorldPos.z);
    _vec3.project(this.camera);
    const uScreen = ndcToScreen(_vec3.x, _vec3.y, _vec3.z, width, height);
    const userVisible =
      this.hasUserMarker && this.currentProgress > 0.45 && uScreen.visible;

    const clampMarginX = isMobile ? 88 : 110;
    const clampMarginY = isMobile ? 36 : 42;
    const userMarkerPosition: ProjectedLabelPosition = {
      id: 'user-marker',
      x: Math.round(Math.min(width - clampMarginX, Math.max(clampMarginX, uScreen.x))),
      y: Math.round(Math.min(height - clampMarginY, Math.max(clampMarginY, uScreen.y))),
      visible: userVisible,
    };

    this.callbacks.onLabelsFrame(EMPTY_AXIS_POSITIONS, userMarkerPosition);
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
      this.isTicking = true;
      let stillMoving = false;
      try {
        const now = performance.now();
        const dt = Math.max(0.001, (now - this.lastTickMs) / 1000);
        this.lastTickMs = now;
        if (this.needsSceneStep) {
          stillMoving = this.stepAnimations(dt);
          this.needsSceneStep = stillMoving;
        }
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        if (this.hasUserMarker) {
          this.projectAndEmitLabels();
        }
      } finally {
        this.isTicking = false;
      }

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

  private scheduleRender(): void {
    if (this.isDisposed || this.isTicking) return;
    if (this.isSoftwareGl) {
      this.requestRender();
      return;
    }
    if (!this.isVisibleInViewport || this.gpuRafScheduled) return;
    this.gpuRafScheduled = true;
    this.lastTickMs = performance.now();
    this.frameId = requestAnimationFrame(this.tickGpu);
  }

  private tickGpu = (): void => {
    this.gpuRafScheduled = false;
    if (this.isDisposed || !this.isVisibleInViewport) return;

    this.isTicking = true;
    let stillMoving = false;
    let controlsMoved = false;
    try {
      const now = performance.now();
      const dt = Math.max(0.001, (now - this.lastTickMs) / 1000);
      this.lastTickMs = now;
      if (this.needsSceneStep) {
        stillMoving = this.stepAnimations(dt);
        this.needsSceneStep = stillMoving;
      }
      controlsMoved = this.controls.update();
      this.renderer.render(this.scene, this.camera);
      if (this.hasUserMarker) {
        this.projectAndEmitLabels();
      }
    } finally {
      this.isTicking = false;
    }

    if ((stillMoving || controlsMoved) && !this.gpuRafScheduled) {
      this.gpuRafScheduled = true;
      this.frameId = requestAnimationFrame(this.tickGpu);
    }
  };

  public dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();
    this.intersectionObserver?.disconnect();

    const dom = this.renderer.domElement;
    dom.removeEventListener('wheel', this.onCanvasWheel, { capture: true });
    dom.removeEventListener('touchstart', this.onTouchStart, { capture: true });
    dom.removeEventListener('touchend', this.onTouchEnd, { capture: true });
    dom.removeEventListener('touchcancel', this.onTouchEnd, { capture: true });
    dom.removeEventListener('pointerdown', this.onPointerDownCapture, { capture: true });
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('pointerup', this.onPointerUp);
    dom.removeEventListener('pointercancel', this.onPointerCancel);
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('pointerleave', this.onPointerLeave);
    dom.removeEventListener('webglcontextlost', this.onWebglContextLost);
    dom.removeEventListener('webglcontextrestored', this.onWebglContextRestored);

    this.controls.dispose();
    this.envTexture?.dispose();

    this.scene.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh ||
        obj instanceof THREE.LineSegments ||
        obj instanceof THREE.Line
      ) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      } else if (obj instanceof THREE.Sprite) {
        obj.material.map?.dispose();
        obj.material.dispose();
      }
    });

    this.renderer.dispose();
    if (dom.parentElement === this.container) {
      this.container.removeChild(dom);
    }
  }
}
