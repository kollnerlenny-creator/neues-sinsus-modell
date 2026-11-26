import * as THREE from 'three';
import type { ClassicMilieu2026Spec, MilieuSpec, ShapeVariant } from '../data/milieus';

export interface FloatingIslandRig {
  spec: MilieuSpec;
  rootGroup: THREE.Group;
  islandGroup: THREE.Group;
  floorAnchorGroup: THREE.Group;
  plumbLine: THREE.Line;
  plumbGeo: THREE.BufferGeometry;
  plumbMat: THREE.LineDashedMaterial;
  hitMesh: THREE.Mesh;
  slabMaterials: THREE.MeshStandardMaterial[];
  undersideMat: THREE.MeshLambertMaterial;
  edgeMaterials: THREE.LineBasicMaterial[];
  anchorMat: THREE.MeshLambertMaterial;
  shadowMat: THREE.MeshBasicMaterial;
  labelSprite: THREE.Sprite;
  labelMat: THREE.SpriteMaterial;
  currentX: number;
  currentZ: number;
  currentElevation: number;
  currentScale: number;
  lastPlumbElevation: number;
  isHovered: boolean;
  isSelected: boolean;
}

export interface Classic2026Rig {
  spec: ClassicMilieu2026Spec;
  rootGroup: THREE.Group;
  hitMesh: THREE.Mesh;
  fillMat: THREE.MeshLambertMaterial;
  edgeMat: THREE.LineBasicMaterial;
  labelSprite: THREE.Sprite;
  labelMat: THREE.SpriteMaterial;
  isHovered: boolean;
  isSelected: boolean;
}

export interface UserMarkerRig {
  rootGroup: THREE.Group;
  beaconGroup: THREE.Group;
  plumbLine: THREE.Line;
  plumbGeo: THREE.BufferGeometry;
  floorDot: THREE.Mesh;
}

function createOrganicContour(
  radii: number[],
  baseRadius: number,
  rotationOffset = 0,
): THREE.Shape {
  const count = radii.length;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rotationOffset;
    const r = radii[i] * baseRadius;
    pts.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r));
  }

  const curve3 = new THREE.CatmullRomCurve3(
    pts.map((p) => new THREE.Vector3(p.x, p.y, 0)),
    true,
    'catmullrom',
    0.55,
  );
  const sampled = curve3.getPoints(26);
  const shape = new THREE.Shape();
  shape.moveTo(sampled[0].x, sampled[0].y);
  for (let i = 1; i < sampled.length; i++) {
    shape.lineTo(sampled[i].x, sampled[i].y);
  }
  shape.closePath();
  return shape;
}

function createFracturedShapes(baseRadius: number): THREE.Shape[] {
  const left = new THREE.Shape();
  const r = baseRadius;
  left.moveTo(-0.14 * r, -0.82 * r);
  left.bezierCurveTo(-0.75 * r, -0.88 * r, -1.02 * r, -0.35 * r, -0.96 * r, 0.22 * r);
  left.bezierCurveTo(-0.88 * r, 0.72 * r, -0.36 * r, 0.92 * r, -0.04 * r, 0.78 * r);
  left.lineTo(-0.18 * r, 0.35 * r);
  left.lineTo(-0.06 * r, 0.02 * r);
  left.lineTo(-0.22 * r, -0.38 * r);
  left.closePath();

  const right = new THREE.Shape();
  right.moveTo(0.12 * r, -0.78 * r);
  right.lineTo(0.02 * r, -0.36 * r);
  right.lineTo(0.18 * r, 0.04 * r);
  right.lineTo(0.08 * r, 0.38 * r);
  right.lineTo(0.22 * r, 0.80 * r);
  right.bezierCurveTo(0.66 * r, 0.86 * r, 1.02 * r, 0.45 * r, 0.96 * r, -0.10 * r);
  right.bezierCurveTo(0.90 * r, -0.62 * r, 0.52 * r, -0.86 * r, 0.12 * r, -0.78 * r);
  right.closePath();

  return [left, right];
}

function getShapesForVariant(variant: ShapeVariant, radius: number): THREE.Shape[] {
  switch (variant) {
    case 'tower_triangle':
      return [createOrganicContour([1.02, 0.86, 0.96, 0.8, 1.0, 0.88, 0.82, 0.94], radius, 0.35)];
    case 'block_rectangle':
      return [createOrganicContour([1.0, 1.08, 0.95, 1.06, 0.98, 1.08, 0.94, 1.04], radius, 0.4)];
    case 'slender_pillar':
      return [createOrganicContour([0.94, 0.82, 1.04, 0.86, 0.96, 0.8, 1.02, 0.86], radius, -0.2)];
    case 'fractured_shards':
      return createFracturedShapes(radius);
    case 'broad_plateau':
      return [createOrganicContour([1.06, 0.92, 1.02, 0.86, 1.08, 0.95, 0.88, 1.0, 0.92], radius, 0.15)];
    case 'flat_slab':
      return [createOrganicContour([1.04, 0.9, 0.96, 1.04, 0.88, 0.98, 1.02, 0.88], radius, -0.45)];
  }
}

let sharedLightShadowTex: THREE.CanvasTexture | null = null;
function getSoftGroundShadowTexture(): THREE.CanvasTexture {
  if (sharedLightShadowTex) return sharedLightShadowTex;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.08,
      size / 2,
      size / 2,
      size * 0.5,
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  sharedLightShadowTex = tex;
  return tex;
}

function createIslandBadgeTexture(
  title: string,
  subtitle: string | undefined,
  accentHex: string,
  maxAnisotropy: number,
): { texture: THREE.CanvasTexture; aspect: number } {
  const logicalWidth = 460;
  const logicalHeight = subtitle ? 112 : 78;
  const dpr = 2;
  const canvas = document.createElement('canvas');
  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    ctx.fillStyle = 'rgba(10, 12, 16, 0.94)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(6, 6, logicalWidth - 12, logicalHeight - 12, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.roundRect(24, 14, logicalWidth - 48, 4.5, 2.5);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 32px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, logicalWidth / 2, subtitle ? 47 : logicalHeight / 2 + 2);

    if (subtitle) {
      ctx.fillStyle = accentHex;
      ctx.font = '600 23px "JetBrains Mono", "Plus Jakarta Sans", monospace';
      ctx.fillText(subtitle, logicalWidth / 2, 83);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return { texture, aspect: logicalWidth / logicalHeight };
}

/**
 * Builds a floating translucent 3D organic disc/slab island for the 2035 state,
 * with beveled translucent geometry, vertical plumb line, and sharp HiDPI floating label.
 */
export function buildFloatingIslandRig(
  spec: MilieuSpec,
  maxAnisotropy = 4,
): FloatingIslandRig {
  const rootGroup = new THREE.Group();
  rootGroup.name = `island_${spec.id}`;
  rootGroup.position.set(spec.pos2035.x, 0, spec.pos2035.z);

  const islandGroup = new THREE.Group();
  islandGroup.position.y = spec.elevation2035;
  rootGroup.add(islandGroup);

  const floorAnchorGroup = new THREE.Group();
  rootGroup.add(floorAnchorGroup);

  const shapes = getShapesForVariant(spec.shapeVariant, spec.footprintRadius);
  const baseColor = new THREE.Color(spec.colorHex);
  const brightEdgeColor = baseColor.clone().lerp(new THREE.Color('#ffffff'), 0.42);

  const slabMaterials: THREE.MeshStandardMaterial[] = [];
  const edgeMaterials: THREE.LineBasicMaterial[] = [];

  // 1. Soft contact shadow projection on floor directly under island
  const shadowGeo = new THREE.CircleGeometry(spec.footprintRadius * 1.14, 24);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getSoftGroundShadowTexture(),
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.position.y = 0.015;
  floorAnchorGroup.add(shadowDisc);

  // 2. Floor anchor dot + ring at (0, 0.024, 0) where the plumb line meets the floor
  const anchorMat = new THREE.MeshLambertMaterial({
    color: baseColor,
    emissive: baseColor,
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.95,
  });
  const dotGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.03, 14);
  const dotMesh = new THREE.Mesh(dotGeo, anchorMat);
  dotMesh.position.y = 0.025;
  floorAnchorGroup.add(dotMesh);

  const anchorRingGeo = new THREE.RingGeometry(0.22, 0.28, 20);
  anchorRingGeo.rotateX(-Math.PI / 2);
  const anchorRingMat = new THREE.MeshBasicMaterial({
    color: brightEdgeColor,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });
  const anchorRing = new THREE.Mesh(anchorRingGeo, anchorRingMat);
  anchorRing.position.y = 0.022;
  floorAnchorGroup.add(anchorRing);

  // 3. Dashed vertical plumb line from floor dot up to underside of floating island
  const plumbPts = [
    new THREE.Vector3(0, 0.04, 0),
    new THREE.Vector3(0, spec.elevation2035 - 0.08, 0),
  ];
  const plumbGeo = new THREE.BufferGeometry().setFromPoints(plumbPts);
  const plumbMat = new THREE.LineDashedMaterial({
    color: brightEdgeColor,
    dashSize: 0.2,
    gapSize: 0.14,
    transparent: true,
    opacity: 0.72,
  });
  const plumbLine = new THREE.Line(plumbGeo, plumbMat);
  plumbLine.computeLineDistances();
  rootGroup.add(plumbLine);

  // 4. Matte dark-graphite underside chassis plate (lightweight Lambert shader)
  const undersideMat = new THREE.MeshLambertMaterial({
    color: new THREE.Color('#1c1e24'),
    transparent: true,
    opacity: 0.94,
  });

  // 5. Build beveled translucent floating island slab(s) using sleek PBR StandardMaterial
  for (const shape of shapes) {
    const basePlateGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.06,
      bevelEnabled: false,
      curveSegments: 10,
    });
    basePlateGeo.rotateX(-Math.PI / 2);
    const basePlateMesh = new THREE.Mesh(basePlateGeo, undersideMat);
    basePlateMesh.position.y = -0.14;
    basePlateMesh.scale.set(0.95, 1, 0.95);
    islandGroup.add(basePlateMesh);

    const slabGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.055,
      bevelSegments: 1,
      curveSegments: 12,
    });
    slabGeo.rotateX(-Math.PI / 2);

    const slabMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: new THREE.Color(spec.emissiveHex),
      emissiveIntensity: 0.2,
      roughness: 0.18,
      metalness: 0.12,
      transparent: true,
      opacity: 0.8,
      envMapIntensity: 1.35,
    });
    slabMaterials.push(slabMat);

    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    slabMesh.position.y = -0.06;
    slabMesh.userData.milieuId = spec.id;
    islandGroup.add(slabMesh);

    const edgesGeo = new THREE.EdgesGeometry(slabGeo, 28);
    const edgeMat = new THREE.LineBasicMaterial({
      color: brightEdgeColor,
      transparent: true,
      opacity: 0.76,
    });
    edgeMaterials.push(edgeMat);
    const edgeLines = new THREE.LineSegments(edgesGeo, edgeMat);
    edgeLines.position.y = -0.06;
    islandGroup.add(edgeLines);
  }

  // 6. Sharp 2x HiDPI floating 3D title placard directly above the slab
  const { texture: badgeTex, aspect: badgeAspect } = createIslandBadgeTexture(
    spec.shortName,
    `${spec.share2035} % · Resilienz ${spec.resilienceScore}`,
    spec.colorHex,
    maxAnisotropy,
  );
  const labelMat = new THREE.SpriteMaterial({
    map: badgeTex,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
  });
  const labelSprite = new THREE.Sprite(labelMat);
  labelSprite.position.set(0, spec.elevation2035 + 0.85, 0);
  labelSprite.scale.set(3.2, 3.2 / badgeAspect, 1);
  rootGroup.add(labelSprite);

  // 7. Simplified invisible raycast hit proxy enveloping the floating island (generous for smartphone touch)
  const hitGeo = new THREE.CylinderGeometry(
    spec.footprintRadius * 1.28,
    spec.footprintRadius * 1.28,
    1.15,
    18,
  );
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.position.y = 0.16;
  hitMesh.userData.milieuId = spec.id;
  hitMesh.userData.kind = '2035';
  hitMesh.layers.set(1);
  islandGroup.add(hitMesh);

  return {
    spec,
    rootGroup,
    islandGroup,
    floorAnchorGroup,
    plumbLine,
    plumbGeo,
    plumbMat,
    hitMesh,
    slabMaterials,
    undersideMat,
    edgeMaterials,
    anchorMat,
    shadowMat,
    labelSprite,
    labelMat,
    currentX: spec.pos2035.x,
    currentZ: spec.pos2035.z,
    currentElevation: spec.elevation2035,
    currentScale: spec.scale2035,
    lastPlumbElevation: spec.elevation2035,
    isHovered: false,
    isSelected: false,
  };
}

/**
 * Builds one of the 10 classic overlapping 2D SINUS ellipses for the 2026 floor view,
 * with crisp HiDPI title badge floating just above the ellipse.
 */
export function buildClassic2026Rig(
  spec: ClassicMilieu2026Spec,
  maxAnisotropy = 4,
): Classic2026Rig {
  const rootGroup = new THREE.Group();
  rootGroup.name = `classic2026_${spec.id}`;
  rootGroup.position.set(spec.pos.x, spec.layerOffset, spec.pos.z);
  rootGroup.rotation.y = spec.rotationY;

  const shape = new THREE.Shape();
  shape.absellipse(0, 0, spec.radiusX, spec.radiusZ, 0, Math.PI * 2, false, 0);

  const discGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.025,
    bevelEnabled: false,
    curveSegments: 22,
  });
  discGeo.rotateX(-Math.PI / 2);

  const color = new THREE.Color(spec.colorHex);
  const brightEdge = color.clone().lerp(new THREE.Color('#ffffff'), 0.28);
  const fillMat = new THREE.MeshLambertMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.16,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const discMesh = new THREE.Mesh(discGeo, fillMat);
  rootGroup.add(discMesh);

  // Crisp luminous perimeter outline
  const pts = shape.getPoints(36).map((p) => new THREE.Vector3(p.x, 0.028, -p.y));
  pts.push(pts[0].clone());
  const outlineGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const edgeMat = new THREE.LineBasicMaterial({
    color: brightEdge,
    transparent: true,
    opacity: 0.9,
  });
  const outline = new THREE.Line(outlineGeo, edgeMat);
  rootGroup.add(outline);

  // Sharp 2x HiDPI title placard above the 2026 ellipse
  const { texture: cBadgeTex, aspect: cBadgeAspect } = createIslandBadgeTexture(
    spec.shortName,
    undefined,
    spec.colorHex,
    maxAnisotropy,
  );
  const labelMat = new THREE.SpriteMaterial({
    map: cBadgeTex,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  const labelSprite = new THREE.Sprite(labelMat);
  labelSprite.position.set(0, 0.34, 0);
  labelSprite.scale.set(2.15, 2.15 / cBadgeAspect, 1);
  rootGroup.add(labelSprite);

  // Invisible raycast proxy on layer 1 (generous height for mobile touch)
  const hitGeo = new THREE.CylinderGeometry(
    Math.max(spec.radiusX, spec.radiusZ) * 1.05,
    Math.max(spec.radiusX, spec.radiusZ) * 1.05,
    0.58,
    14,
  );
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.scale.set(
    spec.radiusX / Math.max(spec.radiusX, spec.radiusZ),
    1,
    spec.radiusZ / Math.max(spec.radiusX, spec.radiusZ),
  );
  hitMesh.position.y = 0.08;
  hitMesh.userData.classicId = spec.id;
  hitMesh.userData.kind = '2026';
  hitMesh.layers.set(1);
  rootGroup.add(hitMesh);

  return {
    spec,
    rootGroup,
    hitMesh,
    fillMat,
    edgeMat,
    labelSprite,
    labelMat,
    isHovered: false,
    isSelected: false,
  };
}

/**
 * Builds the User Self-Test 3D position marker (luminous beacon sphere + halo ring + vertical plumb line).
 */
export function buildUserMarkerRig(): UserMarkerRig {
  const rootGroup = new THREE.Group();
  rootGroup.visible = false;

  const beaconGroup = new THREE.Group();
  rootGroup.add(beaconGroup);

  const sphereGeo = new THREE.SphereGeometry(0.26, 24, 24);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0xf7f8f8,
    emissive: 0xffffff,
    emissiveIntensity: 0.4,
    roughness: 0.18,
    metalness: 0.25,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  beaconGroup.add(sphere);

  const ringGeo = new THREE.TorusGeometry(0.42, 0.04, 12, 32);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 0.55,
    roughness: 0.22,
    metalness: 0.45,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  beaconGroup.add(ring);

  const plumbGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.03, 0),
    new THREE.Vector3(0, 3.0, 0),
  ]);
  const plumbMat = new THREE.LineDashedMaterial({
    color: 0xf7f8f8,
    dashSize: 0.16,
    gapSize: 0.12,
    transparent: true,
    opacity: 0.85,
  });
  const plumbLine = new THREE.Line(plumbGeo, plumbMat);
  plumbLine.computeLineDistances();
  rootGroup.add(plumbLine);

  const dotGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 20);
  const dotMat = new THREE.MeshStandardMaterial({
    color: 0xf7f8f8,
    emissive: 0xffffff,
    emissiveIntensity: 0.35,
    roughness: 0.25,
  });
  const floorDot = new THREE.Mesh(dotGeo, dotMat);
  floorDot.position.y = 0.03;
  rootGroup.add(floorDot);

  return {
    rootGroup,
    beaconGroup,
    plumbLine,
    plumbGeo,
    floorDot,
  };
}
