import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  AXIS_LABELS,
  CLASSIC_MILIEUS_2026,
  MILIEUS,
  RIFT_LINES,
  type MilieuId,
  type ModelMode,
} from '../data/milieus';
import {
  clamp01,
  interpolateMilieuFrame,
  ndcToScreen,
  resolveLabelOverlaps,
  scoreToWorldCoords,
  smootherstep,
  type LabelLayoutInput,
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

const _vec3 = new THREE.Vector3();
const _camTargetTarget = new THREE.Vector3();
const _camPosTarget = new THREE.Vector3();

const DEFAULT_CAMERA_POS = new THREE.Vector3(10.8, 14.1, 21.8);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0.0, 2.2, 0.35);

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
  private classicGroup: THREE.Group;
  private riftsGroup: THREE.Group;
  private riftMaterials: THREE.MeshBasicMaterial[] = [];
  private zAxisGroup: THREE.Group | null = null;
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
  private lastTickMs = 0;

  private frameId = 0;
  private renderBusy = false;
  private renderDirty = false;
  private isDisposed = false;
  private lastHoverRaycast = 0;
  private lastZoomScale = 1.0;

  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareGl();

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 240);

    // 1. Dark Linear Editorial Scene (#0b0c0e)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0c0e);
    this.scene.fog = new THREE.FogExp2(0x0b0c0e, 0.0072);

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
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    this.container.appendChild(this.renderer.domElement);

    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

    // 4. Studio Environment Reflections
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;
    pmrem.dispose();

    // 5. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(DEFAULT_CAMERA_TARGET);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 8.5;
    this.controls.maxDistance = 70;
    this.controls.minPolarAngle = 0.16;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.06;
    this.controls.update();

    this.controls.addEventListener('start', () => {
      this.isCameraTweening = false;
    });

    this.controls.addEventListener('change', () => {
      if (this.isSoftwareGl) {
        this.requestRender();
      }
    });

    // 6. Lighting Rig
    this.setupLighting();

    // 7. Light Floor Plate, Fine Grid & Dark Axis Beams
    this.setupCoordinateFloorAndAxes();

    // 8. 6 Floating 2035 Islands (with on-bubble labels)
    for (const spec of MILIEUS) {
      const rig = buildFloatingIslandRig(spec, this.isSoftwareGl, maxAnisotropy);
      this.scene.add(rig.rootGroup);
      this.islandRigs.set(spec.id, rig);
      this.interactables2035.push(rig.hitMesh);
    }

    // 9. 10 Classic Overlapping 2026 SINUS Ellipses (with on-bubble labels)
    this.classicGroup = new THREE.Group();
    this.classicGroup.visible = false;
    this.scene.add(this.classicGroup);
    for (const spec of CLASSIC_MILIEUS_2026) {
      const rig = buildClassic2026Rig(spec, maxAnisotropy);
      this.classicGroup.add(rig.rootGroup);
      this.classicRigs.set(spec.id, rig);
      this.interactables2026.push(rig.hitMesh);
    }

    // 10. Subtle Crimson Separation Rifts on 2035 Floor
    this.riftsGroup = new THREE.Group();
    this.scene.add(this.riftsGroup);
    this.buildRiftLines();

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

    this.lastTickMs = performance.now();
    if (this.isSoftwareGl) {
      this.requestRender();
    } else {
      this.tickGpu();
    }
  }

  private setupLighting(): void {
    const hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x0f172a, 0.92);
    hemiLight.position.set(0, 24, 0);
    this.scene.add(hemiLight);

    const ambient = new THREE.AmbientLight(0x1e293b, 0.45);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfffcf5, 1.45);
    keyLight.position.set(12, 22, 12);
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

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.85);
    rimLight.position.set(-14, 14, -15);
    this.scene.add(rimLight);
  }

  private setupCoordinateFloorAndAxes(): void {
    // Matte obsidian architectural floor plate
    const floorGeo = new THREE.PlaneGeometry(23, 18.5);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x101216,
      roughness: 0.92,
      metalness: 0.08,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.025;
    floorMesh.receiveShadow = !this.isSoftwareGl;
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

  private buildRiftLines(): void {
    for (const rift of RIFT_LINES) {
      const pts = rift.points.map((p) => new THREE.Vector3(p.x, 0.026, p.z));
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);

      const coreGeo = new THREE.TubeGeometry(curve, 44, 0.032, 8, false);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xe11d48,
        transparent: true,
        opacity: 0.58,
      });
      this.riftMaterials.push(coreMat);
      this.riftsGroup.add(new THREE.Mesh(coreGeo, coreMat));

      const haloGeo = new THREE.TubeGeometry(curve, 44, 0.1, 8, false);
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

  private getActiveInteractables(): THREE.Object3D[] {
    return this.currentProgress >= 0.45
      ? this.interactables2035
      : this.interactables2026;
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
    if (dist > 6) return;

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
    const now = performance.now();
    if (now - this.lastHoverRaycast < 45) return;
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
      this.callbacks.onHover(nextHover);
      if (this.isSoftwareGl) this.requestRender();
    }
  };

  private getViewportCameraMetrics(
    width: number,
    height: number,
  ): { fov: number; zoomScale: number; isMobile: boolean } {
    const aspect = width / Math.max(1, height);
    const isMobile = width < 640;
    const fov = aspect < 0.95 ? 46 : aspect < 1.2 ? 42 : 40;
    const zoomScale =
      aspect < 1.25
        ? Math.min(1.74, Math.max(1.0, 1.34 / Math.max(0.5, aspect)))
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

    if (this.isSoftwareGl) {
      this.requestRender();
    }
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
    if (this.isSoftwareGl) this.requestRender();
  }

  public setUserSelfTestMarker(
    coords: { uX: number; uY: number; uZ: number } | null,
  ): void {
    if (!coords) {
      this.hasUserMarker = false;
      this.userMarker.rootGroup.visible = false;
      if (this.isSoftwareGl) this.requestRender();
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
    if (this.isSoftwareGl) this.requestRender();
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
      const shiftX = width > 900 ? 1.5 : 0;
      const shiftYMobile = isMobile ? -0.95 : 0;

      if (selection.kind === '2035') {
        const rig = this.islandRigs.get(selection.id as MilieuId);
        if (rig) {
          const snap = interpolateMilieuFrame(rig.spec, this.targetProgress);
          _camTargetTarget.set(
            snap.x + shiftX,
            snap.elevation * 0.72 + shiftYMobile,
            snap.z,
          );
          const offX = isMobile ? 2.6 : snap.x >= 0 ? 4.8 : -4.2;
          _camPosTarget.set(
            snap.x + shiftX + offX,
            Math.max(5.5, snap.elevation + (isMobile ? 5.2 : 3.8)),
            snap.z + (isMobile ? 11.4 : 9.2),
          );
          this.isCameraTweening = true;
        }
      } else {
        const rig = this.classicRigs.get(selection.id);
        if (rig) {
          const shift2026 = width > 900 ? 1.2 : 0;
          _camTargetTarget.set(
            rig.spec.pos.x + shift2026,
            0.25 + (isMobile ? -0.7 : 0),
            rig.spec.pos.z,
          );
          _camPosTarget.set(
            rig.spec.pos.x + shift2026 + (isMobile ? 1.4 : 2.4),
            isMobile ? 11.5 : 9.8,
            rig.spec.pos.z + (isMobile ? 11.5 : 9.4),
          );
          this.isCameraTweening = true;
        }
      }
    }
    if (this.isSoftwareGl) this.requestRender();
  }

  public resetCamera(): void {
    const { zoomScale } = this.getViewportCameraMetrics(
      Math.max(this.container.clientWidth, 280),
      Math.max(this.container.clientHeight, 240),
    );
    _camPosTarget.copy(DEFAULT_CAMERA_POS).multiplyScalar(zoomScale);
    _camTargetTarget.copy(DEFAULT_CAMERA_TARGET);
    this.isCameraTweening = true;
    if (this.isSoftwareGl) this.requestRender();
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

    // Compute horizontal camera azimuth so on-bubble text stays upright from any 360° orbit angle
    const cameraAzimuth = Math.atan2(
      this.camera.position.x - this.controls.target.x,
      this.camera.position.z - this.controls.target.z,
    );

    // 1. Update 6 Floating 2035 Islands
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
        has2035Selection && !rig.isSelected ? 0.34 : 1.0;
      const baseSlabOp = (this.isSoftwareGl ? 0.78 : 0.76) * frame.opacity2035 * focusMul;

      for (const mat of rig.slabMaterials) {
        mat.opacity = THREE.MathUtils.damp(mat.opacity, baseSlabOp, 10, safeDt);
        const targetEm = rig.isSelected ? 0.34 : rig.isHovered ? 0.26 : 0.16;
        mat.emissiveIntensity = THREE.MathUtils.damp(
          mat.emissiveIntensity,
          targetEm,
          10,
          safeDt,
        );
      }

      rig.undersideMat.opacity = 0.94 * frame.opacity2035 * focusMul;
      rig.anchorMat.opacity = 0.95 * frame.opacity2035 * focusMul;
      rig.shadowMat.opacity = 0.65 * frame.opacity2035 * focusMul;

      const targetEdgeOp =
        (rig.isSelected ? 1.0 : rig.isHovered ? 0.9 : 0.72) *
        frame.opacity2035 *
        focusMul;
      for (const edgeMat of rig.edgeMaterials) {
        edgeMat.opacity = THREE.MathUtils.damp(edgeMat.opacity, targetEdgeOp, 10, safeDt);
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
        rig.fillMat.opacity = THREE.MathUtils.damp(
          rig.fillMat.opacity,
          targetFillOp,
          10,
          safeDt,
        );
        rig.edgeMat.opacity = THREE.MathUtils.damp(
          rig.edgeMat.opacity,
          targetEdgeOp,
          10,
          safeDt,
        );
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
    const hasSelection = this.selection !== null;
    const isMobile = width < 640;
    const rightSafe = hasSelection && width > 900 ? 400 : isMobile ? 10 : 28;
    const margins = {
      left: isMobile ? 10 : 28,
      right: rightSafe,
      top: isMobile ? 56 : 54,
      bottom: isMobile ? 42 : 42,
    };

    const show2035Badges = this.currentProgress >= 0.45;
    const showAxes = !hasSelection;

    const jointInputs: LabelLayoutInput[] = [];
    const visMap: Record<string, boolean> = {};

    // Project visible bubbles as fixed collision obstacles so axis badges are pushed cleanly around them
    if (showAxes) {
      if (show2035Badges) {
        for (const rig of this.islandRigs.values()) {
          if (!rig.rootGroup.visible) continue;
          _vec3.set(rig.currentX, rig.currentElevation + 0.25, rig.currentZ);
          _vec3.project(this.camera);
          const bs = ndcToScreen(_vec3.x, _vec3.y, _vec3.z, width, height);
          if (bs.visible) {
            jointInputs.push({
              id: `obs:${rig.spec.id}`,
              x: bs.x,
              y: bs.y,
              width: isMobile ? 104 : 144,
              height: isMobile ? 64 : 90,
              priority: 220,
              fixed: true,
            });
          }
        }
      } else {
        for (const rig of this.classicRigs.values()) {
          _vec3.set(rig.spec.pos.x, 0.1, rig.spec.pos.z);
          _vec3.project(this.camera);
          const bs = ndcToScreen(_vec3.x, _vec3.y, _vec3.z, width, height);
          if (bs.visible) {
            jointInputs.push({
              id: `obs:${rig.spec.id}`,
              x: bs.x,
              y: bs.y,
              width: isMobile ? 76 : 108,
              height: isMobile ? 44 : 64,
              priority: 220,
              fixed: true,
            });
          }
        }
      }
    }

    const zScale = this.zAxisGroup ? this.zAxisGroup.scale.y : 1;
    for (const ax of AXIS_LABELS) {
      const skipOnMobile =
        isMobile && (ax.id === 'axis-x-mid' || ax.id === 'axis-y-mid');
      const worldY =
        ax.id === 'axis-z-top'
          ? 0.55 + zScale * (isMobile ? 8.15 : 7.65)
          : ax.worldPos.y;
      _vec3.set(ax.worldPos.x, worldY, ax.worldPos.z);
      _vec3.project(this.camera);
      const screen = ndcToScreen(_vec3.x, _vec3.y, _vec3.z, width, height);
      const zAllowed = ax.id !== 'axis-z-top' || show2035Badges;
      const visible = showAxes && !skipOnMobile && zAllowed && screen.visible;
      visMap[`axis:${ax.id}`] = visible;
      if (visible) {
        jointInputs.push({
          id: `axis:${ax.id}`,
          x: screen.x,
          y: screen.y,
          width: isMobile ? 96 : 190,
          height: isMobile ? 22 : 38,
          priority: ax.id === 'axis-z-top' ? 20 : 10,
        });
      }
    }

    // Project User Self-Test Marker Label
    _vec3.set(this.userWorldPos.x, this.userWorldPos.y + 0.62, this.userWorldPos.z);
    _vec3.project(this.camera);
    const uScreen = ndcToScreen(_vec3.x, _vec3.y, _vec3.z, width, height);
    const userVisible =
      this.hasUserMarker && this.currentProgress > 0.45 && uScreen.visible;
    visMap['user-marker'] = userVisible;
    if (userVisible) {
      jointInputs.push({
        id: 'user-marker',
        x: uScreen.x,
        y: uScreen.y,
        width: isMobile ? 148 : 176,
        height: isMobile ? 46 : 54,
        priority: 150,
      });
    }

    const resolvedAll = resolveLabelOverlaps(jointInputs, width, height, margins);
    const resolvedById = Object.fromEntries(resolvedAll.map((r) => [r.id, r]));

    const axisPositions: Record<string, ProjectedLabelPosition> = {};
    for (const ax of AXIS_LABELS) {
      const key = `axis:${ax.id}`;
      const r = resolvedById[key];
      axisPositions[ax.id] = {
        id: ax.id,
        x: r ? r.x : 0,
        y: r ? r.y : 0,
        visible: Boolean(visMap[key] && r),
      };
    }

    const resolvedUser = resolvedById['user-marker'];
    const userMarkerPosition: ProjectedLabelPosition = {
      id: 'user-marker',
      x: resolvedUser ? resolvedUser.x : Math.round(uScreen.x),
      y: resolvedUser ? resolvedUser.y : Math.round(uScreen.y),
      visible: Boolean(userVisible && resolvedUser),
    };

    this.callbacks.onLabelsFrame(axisPositions, userMarkerPosition);
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
      }
    });

    this.renderer.dispose();
    if (dom.parentElement === this.container) {
      this.container.removeChild(dom);
    }
  }
}
