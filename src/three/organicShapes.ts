import * as THREE from 'three';
import type { MilieuSpec, ShapeVariant } from '../data/milieus';

export interface MilieuRig {
  spec: MilieuSpec;
  rootGroup: THREE.Group;
  footprintGroup: THREE.Group;
  coreGroup: THREE.Group;
  topCapGroup: THREE.Group;
  downArrowsGroup: THREE.Group | null;
  hitMesh: THREE.Mesh;
  coreMaterials: THREE.MeshPhysicalMaterial[];
  edgeMaterials: THREE.LineBasicMaterial[];
  baseRimMaterial: THREE.MeshStandardMaterial;
  currentX: number;
  currentZ: number;
  currentHeight: number;
  currentScale: number;
  isHovered: boolean;
  isSelected: boolean;
}

/**
 * Generates a smooth, closed organic "SINUS potato" 2D Shape from polar control points.
 */
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

  // Build closed Catmull-Rom spline sampled smoothly into a Shape
  const curve3 = new THREE.CatmullRomCurve3(
    pts.map((p) => new THREE.Vector3(p.x, p.y, 0)),
    true,
    'catmullrom',
    0.55,
  );
  const sampled = curve3.getPoints(56);
  const shape = new THREE.Shape();
  shape.moveTo(sampled[0].x, sampled[0].y);
  for (let i = 1; i < sampled.length; i++) {
    shape.lineTo(sampled[i].x, sampled[i].y);
  }
  shape.closePath();
  return shape;
}

/**
 * Creates two fractured organic halves for the "Erodierte Mitte" milieu.
 */
function createFracturedShapes(baseRadius: number): THREE.Shape[] {
  const left = new THREE.Shape();
  const r = baseRadius;
  left.moveTo(-0.14 * r, -0.82 * r);
  left.bezierCurveTo(-0.75 * r, -0.88 * r, -1.02 * r, -0.35 * r, -0.96 * r, 0.22 * r);
  left.bezierCurveTo(-0.88 * r, 0.72 * r, -0.36 * r, 0.92 * r, -0.04 * r, 0.78 * r);
  // Jagged fracture seam down the middle
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
      return [createOrganicContour([1.05, 0.82, 0.96, 0.74, 1.02, 0.86, 0.78, 0.92], radius, 0.35)];
    case 'block_rectangle':
      return [createOrganicContour([1.02, 1.12, 0.95, 1.08, 0.98, 1.10, 0.94, 1.06], radius, 0.4)];
    case 'slender_pillar':
      return [createOrganicContour([0.92, 0.78, 1.06, 0.84, 0.96, 0.76, 1.02, 0.85], radius, -0.2)];
    case 'fractured_shards':
      return createFracturedShapes(radius);
    case 'broad_plateau':
      return [createOrganicContour([1.08, 0.92, 1.04, 0.82, 1.10, 0.96, 0.86, 1.02, 0.92], radius, 0.15)];
    case 'flat_slab':
      return [createOrganicContour([1.06, 0.88, 0.96, 1.08, 0.86, 0.98, 1.04, 0.85], radius, -0.45)];
  }
}

/**
 * Creates a soft radial shadow canvas texture once and reuses it across pedestals.
 */
let sharedShadowTexture: THREE.CanvasTexture | null = null;
function getContactShadowTexture(): THREE.CanvasTexture {
  if (sharedShadowTexture) return sharedShadowTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.1,
      size / 2,
      size / 2,
      size * 0.5,
    );
    grad.addColorStop(0, 'rgba(2, 6, 23, 0.65)');
    grad.addColorStop(0.55, 'rgba(2, 6, 23, 0.28)');
    grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  sharedShadowTexture = tex;
  return tex;
}

/**
 * Builds a complete multi-part composite 3D pedestal for a SINUS milieu.
 */
export function buildMilieuRig(
  spec: MilieuSpec,
  isSoftwareGl: boolean,
): MilieuRig {
  const rootGroup = new THREE.Group();
  rootGroup.name = `milieu_${spec.id}`;
  rootGroup.position.set(spec.pos2035.x, 0, spec.pos2035.z);

  const footprintGroup = new THREE.Group();
  rootGroup.add(footprintGroup);

  const coreGroup = new THREE.Group();
  footprintGroup.add(coreGroup);

  const topCapGroup = new THREE.Group();
  topCapGroup.position.y = spec.height2035;
  footprintGroup.add(topCapGroup);

  const shapes = getShapesForVariant(spec.shapeVariant, spec.footprintRadius);
  const baseColor = new THREE.Color(spec.colorHex);
  const brightEdgeColor = baseColor.clone().lerp(new THREE.Color('#ffffff'), 0.35);

  const coreMaterials: THREE.MeshPhysicalMaterial[] = [];
  const edgeMaterials: THREE.LineBasicMaterial[] = [];

  // 1. Contact shadow grounding disc at y = 0.015
  const shadowGeo = new THREE.CircleGeometry(spec.footprintRadius * 1.28, 32);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getContactShadowTexture(),
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.position.y = 0.015;
  footprintGroup.add(shadowDisc);

  // 2. Matte dark metallic base collar (varied roughness >= 0.25 from acrylic core)
  const baseRimMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#131c31'),
    emissive: baseColor.clone().multiplyScalar(0.14),
    roughness: 0.72,
    metalness: 0.32,
  });

  // 3. Build extruded acrylic column(s) + top cap + glowing perimeter edges
  for (const shape of shapes) {
    // Base collar
    const plinthGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.05,
      bevelSegments: 2,
      curveSegments: 24,
    });
    plinthGeo.rotateX(-Math.PI / 2);
    const plinthMesh = new THREE.Mesh(plinthGeo, baseRimMaterial);
    plinthMesh.position.y = 0.02;
    plinthMesh.receiveShadow = !isSoftwareGl;
    footprintGroup.add(plinthMesh);

    // Main translucent acrylic column (normalized to height = 1.0 so coreGroup.scale.y drives exact height)
    const bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 1.0,
      bevelEnabled: false,
      curveSegments: 28,
    });
    bodyGeo.rotateX(-Math.PI / 2);

    const coreMat = new THREE.MeshPhysicalMaterial({
      color: baseColor,
      emissive: new THREE.Color(spec.emissiveHex),
      emissiveIntensity: 0.22,
      roughness: 0.16,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.12,
      transparent: true,
      opacity: isSoftwareGl ? 0.76 : 0.78,
      transmission: isSoftwareGl ? 0 : 0.22,
      ior: 1.48,
      thickness: 0.8,
      envMapIntensity: 1.15,
    });
    coreMaterials.push(coreMat);

    const bodyMesh = new THREE.Mesh(bodyGeo, coreMat);
    bodyMesh.castShadow = !isSoftwareGl;
    bodyMesh.receiveShadow = !isSoftwareGl;
    bodyMesh.userData.milieuId = spec.id;
    coreGroup.add(bodyMesh);

    // Vertical glowing contour ribs on core
    const bodyEdges = new THREE.EdgesGeometry(bodyGeo, 28);
    const bodyEdgeMat = new THREE.LineBasicMaterial({
      color: brightEdgeColor,
      transparent: true,
      opacity: 0.42,
    });
    edgeMaterials.push(bodyEdgeMat);
    const bodyEdgeLines = new THREE.LineSegments(bodyEdges, bodyEdgeMat);
    coreGroup.add(bodyEdgeLines);

    // Top beveled crown cap (stays un-squashed at topCapGroup.position.y = height)
    const capGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.035,
      bevelSegments: 3,
      curveSegments: 28,
    });
    capGeo.rotateX(-Math.PI / 2);

    const capMat = coreMat.clone();
    capMat.opacity = 0.92;
    capMat.emissiveIntensity = 0.34;
    coreMaterials.push(capMat);

    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = -0.02;
    capMesh.userData.milieuId = spec.id;
    topCapGroup.add(capMesh);

    // Glowing top perimeter outline
    const capEdges = new THREE.EdgesGeometry(capGeo, 22);
    const capEdgeMat = new THREE.LineBasicMaterial({
      color: brightEdgeColor,
      transparent: true,
      opacity: 0.92,
    });
    edgeMaterials.push(capEdgeMat);
    const capEdgeLines = new THREE.LineSegments(capEdges, capEdgeMat);
    capEdgeLines.position.y = -0.02;
    topCapGroup.add(capEdgeLines);
  }

  // 4. Accent detail: subtle inner strata ring for tall Avantgarde / Digital-Adaptiv towers
  if (spec.id === 'avantgarde' || spec.id === 'digital_adaptiv') {
    const ringGeo = new THREE.TorusGeometry(spec.footprintRadius * 0.62, 0.035, 10, 42);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshStandardMaterial({
      color: brightEdgeColor,
      emissive: baseColor,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.7,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.08;
    topCapGroup.add(ringMesh);
  }

  // 5. Accent detail for Erodierte Mitte: downward dashed arrows showing descent pressure
  let downArrowsGroup: THREE.Group | null = null;
  if (spec.id === 'erodierte_mitte') {
    downArrowsGroup = new THREE.Group();
    const arrowOffsets = [
      { x: -1.85, z: 1.55 },
      { x: 0.0, z: 2.25 },
      { x: 1.85, z: 1.55 },
    ];
    const dashMat = new THREE.LineDashedMaterial({
      color: 0xf59e0b,
      dashSize: 0.24,
      gapSize: 0.14,
      transparent: true,
      opacity: 0.9,
    });
    const tipGeo = new THREE.ConeGeometry(0.14, 0.34, 12);
    tipGeo.rotateX(Math.PI); // point down
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.7,
      roughness: 0.3,
      metalness: 0.2,
    });

    for (const off of arrowOffsets) {
      const pts = [
        new THREE.Vector3(off.x, 1.55, off.z),
        new THREE.Vector3(off.x, 0.32, off.z),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const dashedLine = new THREE.Line(lineGeo, dashMat);
      dashedLine.computeLineDistances();
      downArrowsGroup.add(dashedLine);

      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(off.x, 0.22, off.z);
      downArrowsGroup.add(tip);
    }
    footprintGroup.add(downArrowsGroup);
  }

  // 6. Simplified invisible raycast hit proxy (clean cylinder enveloping footprint, scaled with height)
  const hitGeo = new THREE.CylinderGeometry(
    spec.footprintRadius * 1.05,
    spec.footprintRadius * 1.05,
    1.0,
    16,
  );
  hitGeo.translate(0, 0.5, 0);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.userData.milieuId = spec.id;
  hitMesh.layers.set(1);
  coreGroup.add(hitMesh);

  // Initialize starting transforms to 2035
  coreGroup.scale.y = spec.height2035;

  return {
    spec,
    rootGroup,
    footprintGroup,
    coreGroup,
    topCapGroup,
    downArrowsGroup,
    hitMesh,
    coreMaterials,
    edgeMaterials,
    baseRimMaterial,
    currentX: spec.pos2035.x,
    currentZ: spec.pos2035.z,
    currentHeight: spec.height2035,
    currentScale: spec.scale2035,
    isHovered: false,
    isSelected: false,
  };
}
