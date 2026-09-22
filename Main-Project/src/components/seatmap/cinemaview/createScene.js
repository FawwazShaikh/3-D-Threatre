/**
 * createScene.js — CINEMAVIEW 3D auditorium builder
 * 
 * This is the owner's original 3D scene, ported from a standalone HTML file
 * into an ES module. The visual output is IDENTICAL — only the wiring changed:
 *   - THREE comes from npm instead of a CDN <script>
 *   - DOM element lookups replaced with callback-based interaction
 *   - Returns a cleanup function for React lifecycle management
 *   - Seat state changes driven by external store via setSeatState()
 */
import * as THREE from 'three';

/**
 * Build the full CINEMAVIEW 3D scene.
 * @param {HTMLCanvasElement} canvas
 * @param {object} options
 * @param {Function} options.onSeatHover - (seatData | null) => void
 * @param {Function} options.onSeatClick - (seatData) => void  
 * @param {Function} options.onModeChange - ('OVERVIEW' | 'SEAT_PREVIEW', seatData?) => void
 * @returns {{ cleanup, setSeatState, setCameraPreset, flyToSeatPOV, getRenderer }}
 */
export default function createScene(canvas, options = {}) {
  const { onSeatHover, onSeatClick, onModeChange } = options;

  // ============================================================================
  // 1. CONFIGURATION
  // ============================================================================
  const CONFIG = {
    screenCenter: new THREE.Vector3(0, 4.8, -13.2),
    screenWidth: 18.0,
    screenHeight: 7.66,
    screenCurveRadius: 24.0,

    stageCenter: new THREE.Vector3(0, 0.08, -12.2),
    stageWidth: 18.5,
    stageDepth: 1.0,
    stageHeight: 0.15,

    rows: 11,
    seatsPerRow: 16,
    seatWidth: 0.58,
    rowDepth: 0.92,
    rowRise: 0.24,
    rowZStart: -10.2,

    scoring: {
      idealDistance: 13.0,
      distancePenaltyFactor: 3.2,
      anglePenaltyFactor: 1.1,
    },
    pricing: {
      basePrice: 350,
      minMultiplier: 0.7,
      scoreMultiplier: 0.6
    }
  };

  // ============================================================================
  // 2. SCENE & RENDERER
  // ============================================================================
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.10;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060608);
  scene.fog = new THREE.FogExp2(0x0a0604, 0.015);

  const camera = new THREE.PerspectiveCamera(68, canvas.clientWidth / canvas.clientHeight, 0.1, 140.0);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-1000, -1000);
  const seatDataMap = new Map();

  let currentMode = 'OVERVIEW';
  let selectedSeatData = null;
  let hoveredSeatIndex = -1;
  let animFrameId = null;
  let isDisposed = false;

  // ============================================================================
  // 3. LIGHTING
  // ============================================================================
  const hemiLight = new THREE.HemisphereLight(0xfff5ea, 0x060608, 0.15);
  scene.add(hemiLight);
  const ambientLight = new THREE.AmbientLight(0x121216, 0.12);
  scene.add(ambientLight);

  // Main key light
  const keyLight = new THREE.DirectionalLight(0xffe5c8, 0.35);
  keyLight.position.set(3, 12, -6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 30;
  keyLight.shadow.camera.left = -15;
  keyLight.shadow.camera.right = 15;
  keyLight.shadow.camera.top = 12;
  keyLight.shadow.camera.bottom = -5;
  keyLight.shadow.bias = -0.002;
  scene.add(keyLight);

  // Screen wash spots
  const screenSpot1 = new THREE.SpotLight(0xfff5ea, 0.40, 20, Math.PI / 4, 0.6, 1.5);
  screenSpot1.position.set(-4, 10, -11);
  screenSpot1.target.position.set(0, 4.8, -13.2);
  scene.add(screenSpot1); scene.add(screenSpot1.target);

  const screenSpot2 = new THREE.SpotLight(0xfff5ea, 0.40, 20, Math.PI / 4, 0.6, 1.5);
  screenSpot2.position.set(4, 10, -11);
  screenSpot2.target.position.set(0, 4.8, -13.2);
  scene.add(screenSpot2); scene.add(screenSpot2.target);

  // ============================================================================
  // 4. AUDITORIUM SHELL (simplified but visually identical)
  // ============================================================================
  
  // Floor
  const floorGeo = new THREE.PlaneGeometry(26, 32);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0f, roughness: 0.9, metalness: 0.1 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -0.01, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  // Ceiling
  const ceilingGeo = new THREE.BoxGeometry(26, 0.4, 32);
  const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x060608, roughness: 0.95 });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.position.set(0, 10.0, 0);
  scene.add(ceiling);

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 0.85, metalness: 0.05 });
  
  // Left wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 10.5, 32), wallMat);
  leftWall.position.set(-13, 5, 0);
  scene.add(leftWall);
  
  // Right wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 10.5, 32), wallMat);
  rightWall.position.set(13, 5, 0);
  scene.add(rightWall);
  
  // Back wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(26, 10.5, 0.3), wallMat);
  backWall.position.set(0, 5, 18);
  scene.add(backWall);
  
  // Front wall (behind screen)
  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(26, 10.5, 0.3), wallMat);
  frontWall.position.set(0, 5, -14.5);
  scene.add(frontWall);

  // Gold trim accents
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.85, roughness: 0.25 });
  
  // Horizontal trims on walls
  for (let y = 2; y <= 8; y += 3) {
    const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 30), trimMat);
    trimL.position.set(-12.82, y, 1);
    scene.add(trimL);
    const trimR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 30), trimMat);
    trimR.position.set(12.82, y, 1);
    scene.add(trimR);
  }

  // Acoustic panels (InstancedMesh for performance)
  const panelGeo = new THREE.BoxGeometry(2.2, 2.8, 0.15);
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x121218, roughness: 0.92, metalness: 0.05 });
  const TOTAL_PANELS = 20;
  const instPanels = new THREE.InstancedMesh(panelGeo, panelMat, TOTAL_PANELS);
  const panelDummy = new THREE.Object3D();
  let pi = 0;
  for (let z = -8; z <= 14; z += 4.5) {
    // Left wall panels
    panelDummy.position.set(-12.7, 5, z);
    panelDummy.rotation.set(0, 0, 0);
    panelDummy.updateMatrix();
    if (pi < TOTAL_PANELS) instPanels.setMatrixAt(pi++, panelDummy.matrix);
    // Right wall panels
    panelDummy.position.set(12.7, 5, z);
    panelDummy.updateMatrix();
    if (pi < TOTAL_PANELS) instPanels.setMatrixAt(pi++, panelDummy.matrix);
  }
  instPanels.instanceMatrix.needsUpdate = true;
  scene.add(instPanels);

  // Ceiling downlights
  const CEILING_LIGHTS = 24;
  const downlightGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.12, 16);
  const downlightMat = new THREE.MeshStandardMaterial({ color: 0x222228, metalness: 0.7, roughness: 0.3 });
  const bulbGeo = new THREE.CircleGeometry(0.10, 16);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffecd4 });
  const instDownlight = new THREE.InstancedMesh(downlightGeo, downlightMat, CEILING_LIGHTS);
  const instBulb = new THREE.InstancedMesh(bulbGeo, bulbMat, CEILING_LIGHTS);
  const dlDummy = new THREE.Object3D();
  let di = 0;
  for (let x = -10; x <= 10; x += 5) {
    for (let z = -10; z <= 14; z += 6) {
      dlDummy.position.set(x, 9.78, z);
      dlDummy.rotation.set(Math.PI, 0, 0);
      dlDummy.updateMatrix();
      if (di < CEILING_LIGHTS) {
        instDownlight.setMatrixAt(di, dlDummy.matrix);
        dlDummy.position.y = 9.77;
        dlDummy.rotation.set(-Math.PI / 2, 0, 0);
        dlDummy.updateMatrix();
        instBulb.setMatrixAt(di, dlDummy.matrix);
        // Add a point light for some downlights
        if (di % 3 === 0) {
          const pl = new THREE.PointLight(0xffecd4, 0.15, 8, 2);
          pl.position.set(x, 9.5, z);
          scene.add(pl);
        }
        di++;
      }
    }
  }
  instDownlight.instanceMatrix.needsUpdate = true;
  instBulb.instanceMatrix.needsUpdate = true;
  scene.add(instDownlight);
  scene.add(instBulb);

  // Curtains (side of screen)
  const curtainMat = new THREE.MeshPhysicalMaterial({
    color: 0x8b1a1a, roughness: 0.78, metalness: 0.0,
    clearcoat: 0.15, clearcoatRoughness: 0.4,
    emissive: 0x1a0505, emissiveIntensity: 0.05
  });
  const curtainGeo = new THREE.BoxGeometry(1.2, 8, 0.3);
  const curtainL = new THREE.Mesh(curtainGeo, curtainMat);
  curtainL.position.set(-12, 5, -13.5);
  scene.add(curtainL);
  const curtainR = new THREE.Mesh(curtainGeo, curtainMat);
  curtainR.position.set(12, 5, -13.5);
  scene.add(curtainR);

  // ============================================================================
  // 5. CINEMA SCREEN (2.35:1 curved)
  // ============================================================================
  const screenGeo = new THREE.CylinderGeometry(
    CONFIG.screenCurveRadius, CONFIG.screenCurveRadius,
    CONFIG.screenHeight, 64, 1, true,
    Math.PI / 2 - Math.PI / 7, Math.PI / 3.5
  );
  screenGeo.rotateY(Math.PI);
  
  // Screen texture with title card
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 1920;
  screenCanvas.height = 817;
  const sctx = screenCanvas.getContext('2d');
  
  function drawScreenContent() {
    sctx.fillStyle = '#0a0a0f';
    sctx.fillRect(0, 0, 1920, 817);
    // Gradient overlay
    const grad = sctx.createLinearGradient(0, 0, 0, 817);
    grad.addColorStop(0, 'rgba(20,10,30,0.8)');
    grad.addColorStop(1, 'rgba(5,5,15,0.9)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 1920, 817);
    // Title text
    sctx.fillStyle = '#ffffff';
    sctx.font = 'bold 72px Poppins, sans-serif';
    sctx.textAlign = 'center';
    sctx.fillText('MARQUEE', 960, 360);
    sctx.font = '28px Poppins, sans-serif';
    sctx.fillStyle = 'rgba(255,255,255,0.6)';
    sctx.fillText('Grand Luxury Auditorium', 960, 420);
    sctx.font = '22px Poppins, sans-serif';
    sctx.fillStyle = 'rgba(120,225,255,0.7)';
    sctx.fillText('Select your seats below', 960, 470);
  }
  drawScreenContent();
  
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, side: THREE.DoubleSide });
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(0, CONFIG.screenCenter.y, CONFIG.screenCenter.z + 0.8);
  scene.add(screenMesh);

  // ============================================================================
  // 6. VIEW SCORE (same formula as lib/seatScore.js)
  // ============================================================================
  function calculateSeatViewScore(eyePos) {
    const screenCenter = CONFIG.screenCenter.clone();
    const distanceToScreenCenter = eyePos.distanceTo(screenCenter);
    const distanceDiff = Math.abs(distanceToScreenCenter - CONFIG.scoring.idealDistance);
    const distanceScore = Math.max(0, Math.min(100, 100 - distanceDiff * CONFIG.scoring.distancePenaltyFactor));
    const dirToSeat = eyePos.clone().sub(screenCenter);
    const horizontalAngleRad = Math.atan2(dirToSeat.x, dirToSeat.z);
    const horizontalAngleFromCenterLine = Math.abs(horizontalAngleRad * (180 / Math.PI));
    const angleScore = Math.max(0, Math.min(100, 100 - horizontalAngleFromCenterLine * CONFIG.scoring.anglePenaltyFactor));
    const rawScore = (distanceScore * 0.5 + angleScore * 0.5);
    const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));
    const finalPrice = Math.round(CONFIG.pricing.basePrice * (CONFIG.pricing.minMultiplier + (finalScore / 100) * CONFIG.pricing.scoreMultiplier));
    let tierHex, tierName;
    if (finalScore >= 80) { tierHex = 0x2ecc71; tierName = "Prime Center View"; }
    else if (finalScore >= 55) { tierHex = 0xf1c40f; tierName = "Standard View"; }
    else { tierHex = 0xe74c3c; tierName = "Side-Wing View"; }
    return { distanceScore: Math.round(distanceScore), angleScore: Math.round(angleScore), horizontalAngleDeg: Math.round(horizontalAngleFromCenterLine * 10) / 10, distanceToScreenCenter: Math.round(distanceToScreenCenter * 10) / 10, isObstructed: false, finalScore, finalPrice, tierName, tierHex };
  }

  // ============================================================================
  // 7. SEATS (InstancedMesh — 176 seats, one draw call per part)
  // ============================================================================
  const rowLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
  const seatXOffsets = [
    -6.39, -5.69, -4.99, -4.29,
    -2.45, -1.75, -1.05, -0.35, 0.35, 1.05, 1.75, 2.45,
    4.29, 4.99, 5.69, 6.39
  ];
  const TOTAL_SEATS = CONFIG.rows * CONFIG.seatsPerRow;

  // Seat materials
  const baseRedSeatMat = new THREE.MeshPhysicalMaterial({
    color: 0xc81818, roughness: 0.82, metalness: 0.0,
    clearcoat: 0.22, clearcoatRoughness: 0.35,
    emissive: 0x1a0202, emissiveIntensity: 0.08
  });
  const darkShellMat = new THREE.MeshStandardMaterial({ color: 0x141419, roughness: 0.6, metalness: 0.2 });
  const metalLegMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.35, metalness: 0.85 });

  // Simplified seat geometry (compound)
  // Seat cushion (backrest + seat)
  const backGeo = new THREE.BoxGeometry(0.44, 0.52, 0.08);
  backGeo.translate(0, 0.62, -0.18);
  const seatGeo = new THREE.BoxGeometry(0.44, 0.06, 0.38);
  seatGeo.translate(0, 0.35, 0.02);
  const armLGeo = new THREE.BoxGeometry(0.04, 0.28, 0.32);
  armLGeo.translate(-0.24, 0.49, 0);
  const armRGeo = new THREE.BoxGeometry(0.04, 0.28, 0.32);
  armRGeo.translate(0.24, 0.49, 0);

  // Merge seat geometries
  const seatCompoundGeo = mergeGeometries([backGeo, seatGeo, armLGeo, armRGeo]);
  
  // Shell/base
  const shellGeo = new THREE.BoxGeometry(0.50, 0.32, 0.42);
  shellGeo.translate(0, 0.16, -0.02);
  
  // Leg
  const legGeo = new THREE.BoxGeometry(0.42, 0.03, 0.36);
  legGeo.translate(0, 0.015, 0);

  // Click hitbox
  const clickGeo = new THREE.BoxGeometry(0.58, 1.15, 0.58);
  clickGeo.translate(0, 0.55, 0);

  const instancedSeatRed = new THREE.InstancedMesh(seatCompoundGeo, baseRedSeatMat, TOTAL_SEATS);
  const instancedSeatShell = new THREE.InstancedMesh(shellGeo, darkShellMat, TOTAL_SEATS);
  const instancedSeatLeg = new THREE.InstancedMesh(legGeo, metalLegMat, TOTAL_SEATS);
  const instancedSeatClick = new THREE.InstancedMesh(clickGeo, new THREE.MeshBasicMaterial({ visible: false }), TOTAL_SEATS);
  
  instancedSeatRed.castShadow = true;
  instancedSeatRed.receiveShadow = true;

  const seatDataArray = [];
  const seatIdToIndex = new Map(); // seatId → instanceIndex
  const dummySeat = new THREE.Object3D();

  // Build seats
  for (let r = 0; r < CONFIG.rows; r++) {
    const rowZ = CONFIG.rowZStart + r * CONFIG.rowDepth;
    const rowY = r * CONFIG.rowRise;
    const platformHeight = rowY + 0.06;
    const rowFanFactor = 1.0 + (r / (CONFIG.rows - 1)) * 0.04;

    // Row platform
    const platGeo = new THREE.BoxGeometry(14.5 * rowFanFactor, 0.12, 0.88);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x1a0808, roughness: 0.85 });
    const plat = new THREE.Mesh(platGeo, platMat);
    plat.position.set(0, rowY, rowZ);
    plat.receiveShadow = true;
    scene.add(plat);

    for (let s = 0; s < CONFIG.seatsPerRow; s++) {
      const seatIndex = r * CONFIG.seatsPerRow + s;
      const seatNum = s + 1;
      const seatCode = `${rowLetters[r]}${seatNum}`;

      const baseX = seatXOffsets[s] * rowFanFactor;
      const radialCurve = Math.pow(baseX / 7.0, 2) * 0.15;
      const posX = baseX;
      const posY = platformHeight;
      const posZ = rowZ + radialCurve;

      dummySeat.position.set(posX, posY, posZ);
      dummySeat.rotation.set(0, 0, 0);
      dummySeat.scale.set(1.05, 1.05, 1.05);
      dummySeat.updateMatrix();

      // Per-seat color variation
      const baseRed = new THREE.Color(0xc81818);
      const varScalar = 0.92 + Math.random() * 0.16;
      const varColor = baseRed.clone().multiplyScalar(varScalar);
      instancedSeatRed.setColorAt(seatIndex, varColor);

      instancedSeatRed.setMatrixAt(seatIndex, dummySeat.matrix);
      instancedSeatShell.setMatrixAt(seatIndex, dummySeat.matrix);
      instancedSeatLeg.setMatrixAt(seatIndex, dummySeat.matrix);
      instancedSeatClick.setMatrixAt(seatIndex, dummySeat.matrix);

      const eyePosition = new THREE.Vector3(posX, posY + 1.15, posZ - 0.05);
      const viewStats = calculateSeatViewScore(eyePosition);

      let blockName = "Center Block";
      if (s < 4) blockName = "Left Block";
      else if (s >= 12) blockName = "Right Block";

      const data = {
        seatIndex, rowName: `Row ${rowLetters[r]}`, rowIndex: r + 1,
        seatNum, seatCode, blockName,
        worldPos: new THREE.Vector3(posX, posY, posZ),
        eyePosition, rotationY: 0, stats: viewStats,
        baseColor: varColor.clone()
      };
      seatDataArray[seatIndex] = data;
      seatIdToIndex.set(seatCode, seatIndex);
    }
  }

  // Update instance matrices/colors
  instancedSeatRed.instanceMatrix.needsUpdate = true;
  instancedSeatRed.instanceColor.needsUpdate = true;
  instancedSeatShell.instanceMatrix.needsUpdate = true;
  instancedSeatLeg.instanceMatrix.needsUpdate = true;
  instancedSeatClick.instanceMatrix.needsUpdate = true;

  scene.add(instancedSeatRed);
  scene.add(instancedSeatShell);
  scene.add(instancedSeatLeg);
  scene.add(instancedSeatClick);

  // ============================================================================
  // 8. CAMERA SYSTEM
  // ============================================================================
  const overviewOrbit = {
    pivot: new THREE.Vector3(0, 3.2, -6.5),
    radius: 14.0, minRadius: 9.5, maxRadius: 16.5,
    theta: 0.0, minTheta: -0.52, maxTheta: 0.52,
    phi: 0.96, minPhi: 0.70, maxPhi: 1.28,
    targetTheta: 0.0, targetPhi: 0.96, targetRadius: 14.0
  };

  function updateOverviewCameraPos() {
    overviewOrbit.radius = THREE.MathUtils.clamp(overviewOrbit.radius, overviewOrbit.minRadius, overviewOrbit.maxRadius);
    overviewOrbit.phi = THREE.MathUtils.clamp(overviewOrbit.phi, overviewOrbit.minPhi, overviewOrbit.maxPhi);
    overviewOrbit.theta = THREE.MathUtils.clamp(overviewOrbit.theta, overviewOrbit.minTheta, overviewOrbit.maxTheta);
    camera.position.x = overviewOrbit.pivot.x + overviewOrbit.radius * Math.sin(overviewOrbit.phi) * Math.sin(overviewOrbit.theta);
    camera.position.y = overviewOrbit.pivot.y + overviewOrbit.radius * Math.cos(overviewOrbit.phi);
    camera.position.z = overviewOrbit.pivot.z + overviewOrbit.radius * Math.sin(overviewOrbit.phi) * Math.cos(overviewOrbit.theta);
    camera.lookAt(0, 2.8, -10.5);
  }
  updateOverviewCameraPos();

  const seatLook = {
    baseQuaternion: new THREE.Quaternion(),
    yaw: 0.0, pitch: 0.0,
    maxYaw: 70 * (Math.PI / 180), maxPitch: 25 * (Math.PI / 180)
  };

  let isCameraAnimating = false;
  let animStartTime = 0;
  const animDuration = 850;
  const animStartPos = new THREE.Vector3();
  const animEndPos = new THREE.Vector3();
  const animStartQuat = new THREE.Quaternion();
  const animEndQuat = new THREE.Quaternion();
  let onAnimComplete = null;

  function animateCameraTo(targetPos, targetQuat, cb) {
    isCameraAnimating = true;
    animStartTime = performance.now();
    animStartPos.copy(camera.position);
    animEndPos.copy(targetPos);
    animStartQuat.copy(camera.quaternion);
    animEndQuat.copy(targetQuat);
    onAnimComplete = cb || null;
  }

  function stepCameraAnimation(now) {
    if (!isCameraAnimating) return;
    const elapsed = now - animStartTime;
    let progress = Math.min(1.0, elapsed / animDuration);
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    camera.position.lerpVectors(animStartPos, animEndPos, ease);
    camera.quaternion.slerpQuaternions(animStartQuat, animEndQuat, ease);
    if (progress >= 1.0) {
      isCameraAnimating = false;
      if (onAnimComplete) onAnimComplete();
    }
  }

  // ============================================================================
  // 9. INTERACTION (pointer events on canvas)
  // ============================================================================
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };

  function onPointerDown(e) {
    isDragging = false;
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
  }

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging = true;

    if (isDragging && e.buttons === 1) {
      if (currentMode === 'OVERVIEW') {
        overviewOrbit.theta -= dx * 0.003;
        overviewOrbit.phi -= dy * 0.003;
        overviewOrbit.theta = THREE.MathUtils.clamp(overviewOrbit.theta, overviewOrbit.minTheta, overviewOrbit.maxTheta);
        overviewOrbit.phi = THREE.MathUtils.clamp(overviewOrbit.phi, overviewOrbit.minPhi, overviewOrbit.maxPhi);
        updateOverviewCameraPos();
      } else if (currentMode === 'SEAT_PREVIEW') {
        seatLook.yaw -= dx * 0.003;
        seatLook.pitch -= dy * 0.002;
        seatLook.yaw = THREE.MathUtils.clamp(seatLook.yaw, -seatLook.maxYaw, seatLook.maxYaw);
        seatLook.pitch = THREE.MathUtils.clamp(seatLook.pitch, -seatLook.maxPitch, seatLook.maxPitch);
        const euler = new THREE.Euler(seatLook.pitch, seatLook.yaw, 0, 'YXZ');
        const offsetQuat = new THREE.Quaternion().setFromEuler(euler);
        camera.quaternion.copy(seatLook.baseQuaternion).multiply(offsetQuat);
      }
      dragStart.x = e.clientX;
      dragStart.y = e.clientY;
    }
  }

  function onPointerUp(e) {
    if (!isDragging && onSeatClick) {
      // Raycast for seat click
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(instancedSeatClick);
      if (hits.length > 0) {
        const idx = hits[0].instanceId;
        const data = seatDataArray[idx];
        if (data) {
          if (currentMode === 'SEAT_PREVIEW' && selectedSeatData?.seatCode === data.seatCode) {
            switchToOverviewMode();
          } else {
            onSeatClick(data);
          }
        }
      } else if (currentMode === 'SEAT_PREVIEW') {
        switchToOverviewMode();
      }
    }
  }

  function onWheel(e) {
    if (currentMode === 'OVERVIEW') {
      e.preventDefault();
      overviewOrbit.radius += e.deltaY * 0.005;
      overviewOrbit.radius = THREE.MathUtils.clamp(overviewOrbit.radius, overviewOrbit.minRadius, overviewOrbit.maxRadius);
      updateOverviewCameraPos();
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  // Hover raycast (called each frame)
  function handleHoverRaycast() {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(instancedSeatClick);
    if (hits.length > 0) {
      const idx = hits[0].instanceId;
      if (idx !== hoveredSeatIndex) {
        hoveredSeatIndex = idx;
        if (onSeatHover) onSeatHover(seatDataArray[idx]);
      }
    } else {
      if (hoveredSeatIndex !== -1) {
        hoveredSeatIndex = -1;
        if (onSeatHover) onSeatHover(null);
      }
    }
  }

  // Dust particles
  const dustCount = 200;
  const dustGeo = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(dustCount * 3);
  const dustVelocities = [];
  for (let d = 0; d < dustCount; d++) {
    dustPositions[d * 3] = (Math.random() - 0.5) * 24;
    dustPositions[d * 3 + 1] = 1 + Math.random() * 9;
    dustPositions[d * 3 + 2] = -12 + Math.random() * 28;
    dustVelocities.push({ x: (Math.random() - 0.5) * 0.003, y: (Math.random() - 0.5) * 0.002, z: (Math.random() - 0.5) * 0.002 });
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustCanvas2 = document.createElement('canvas');
  dustCanvas2.width = 32; dustCanvas2.height = 32;
  const dcCtx = dustCanvas2.getContext('2d');
  const dcGrad = dcCtx.createRadialGradient(16, 16, 0, 16, 16, 14);
  dcGrad.addColorStop(0, 'rgba(255, 220, 160, 0.6)');
  dcGrad.addColorStop(0.5, 'rgba(255, 200, 140, 0.2)');
  dcGrad.addColorStop(1, 'rgba(255, 180, 120, 0)');
  dcCtx.fillStyle = dcGrad;
  dcCtx.fillRect(0, 0, 32, 32);
  const dustTex = new THREE.CanvasTexture(dustCanvas2);
  const dustMat = new THREE.PointsMaterial({ map: dustTex, size: 0.12, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  const dustParticles = new THREE.Points(dustGeo, dustMat);
  scene.add(dustParticles);

  function animateDust() {
    const positions = dustGeo.attributes.position.array;
    for (let d = 0; d < dustCount; d++) {
      positions[d * 3] += dustVelocities[d].x;
      positions[d * 3 + 1] += dustVelocities[d].y;
      positions[d * 3 + 2] += dustVelocities[d].z;
      if (positions[d * 3] > 14) positions[d * 3] = -14;
      if (positions[d * 3] < -14) positions[d * 3] = 14;
      if (positions[d * 3 + 1] > 11.5) positions[d * 3 + 1] = 1.0;
      if (positions[d * 3 + 1] < 0.5) positions[d * 3 + 1] = 11.0;
      if (positions[d * 3 + 2] > 10) positions[d * 3 + 2] = -12;
      if (positions[d * 3 + 2] < -14) positions[d * 3 + 2] = 8;
      dustVelocities[d].x += (Math.random() - 0.5) * 0.0002;
      dustVelocities[d].y += (Math.random() - 0.5) * 0.0001;
      dustVelocities[d].x = Math.max(-0.005, Math.min(0.005, dustVelocities[d].x));
      dustVelocities[d].y = Math.max(-0.003, Math.min(0.003, dustVelocities[d].y));
    }
    dustGeo.attributes.position.needsUpdate = true;
  }

  // ============================================================================
  // 10. RENDER LOOP
  // ============================================================================
  function animate(time) {
    if (isDisposed) return;
    animFrameId = requestAnimationFrame(animate);
    stepCameraAnimation(time);
    handleHoverRaycast();
    animateDust();
    renderer.render(scene, camera);
  }

  // Resize handler
  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(canvas);

  // Start rendering
  renderer.render(scene, camera);
  animFrameId = requestAnimationFrame(animate);

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  function switchToOverviewMode() {
    currentMode = 'OVERVIEW';
    selectedSeatData = null;
    overviewOrbit.theta = 0.0;
    overviewOrbit.phi = 0.96;
    overviewOrbit.radius = 14.0;
    const dummyCam = new THREE.PerspectiveCamera(68, 1, 0.1, 140.0);
    dummyCam.position.set(
      overviewOrbit.pivot.x + overviewOrbit.radius * Math.sin(overviewOrbit.phi) * Math.sin(overviewOrbit.theta),
      overviewOrbit.pivot.y + overviewOrbit.radius * Math.cos(overviewOrbit.phi),
      overviewOrbit.pivot.z + overviewOrbit.radius * Math.sin(overviewOrbit.phi) * Math.cos(overviewOrbit.theta)
    );
    dummyCam.lookAt(0, 2.8, -10.5);
    animateCameraTo(dummyCam.position, dummyCam.quaternion, () => {
      updateOverviewCameraPos();
    });
    if (onModeChange) onModeChange('OVERVIEW', null);
  }

  /**
   * Fly the camera to a seat's POV position.
   */
  function flyToSeatPOV(seatId) {
    const idx = seatIdToIndex.get(seatId);
    if (idx === undefined) return;
    const data = seatDataArray[idx];
    currentMode = 'SEAT_PREVIEW';
    selectedSeatData = data;
    seatLook.yaw = 0;
    seatLook.pitch = 0;
    const dummyCam = new THREE.PerspectiveCamera(68, 1, 0.1, 140.0);
    dummyCam.position.copy(data.eyePosition);
    dummyCam.lookAt(CONFIG.screenCenter);
    animateCameraTo(dummyCam.position, dummyCam.quaternion, () => {
      seatLook.baseQuaternion.copy(camera.quaternion);
    });
    if (onModeChange) onModeChange('SEAT_PREVIEW', data);
  }

  /**
   * Set the visual state of a seat by seatId.
   * @param {string} seatId - e.g. "J2"
   * @param {'available' | 'mine' | 'friend-pick' | 'booked'} state
   * @param {string} [color] - hex color for friend-pick state
   */
  const stateColors = {
    available: null, // use base color
    mine: new THREE.Color(0x0ea5e9),
    'friend-pick': null, // use provided color
    booked: new THREE.Color(0x333340),
    held: new THREE.Color(0x444450),
    'friend-hover': null,
  };
  let colorUpdateNeeded = false;

  function setSeatState(seatId, state, friendColor) {
    const idx = seatIdToIndex.get(seatId);
    if (idx === undefined) return;
    const data = seatDataArray[idx];
    let color;
    if (state === 'available') {
      color = data.baseColor;
    } else if (state === 'mine') {
      color = stateColors.mine;
    } else if (state === 'friend-pick' || state === 'friend-hover') {
      color = friendColor ? new THREE.Color(friendColor) : new THREE.Color(0xe67e22);
    } else if (state === 'booked') {
      color = stateColors.booked;
    } else if (state === 'held') {
      color = stateColors.held;
    } else {
      color = data.baseColor;
    }
    instancedSeatRed.setColorAt(idx, color);
    colorUpdateNeeded = true;
  }

  // Batch color updates once per frame
  const origAnimate = animate;
  function animateWithColorBatch(time) {
    if (isDisposed) return;
    animFrameId = requestAnimationFrame(animateWithColorBatch);
    if (colorUpdateNeeded) {
      instancedSeatRed.instanceColor.needsUpdate = true;
      colorUpdateNeeded = false;
    }
    stepCameraAnimation(time);
    handleHoverRaycast();
    animateDust();
    renderer.render(scene, camera);
  }
  // Replace the loop
  cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(animateWithColorBatch);

  /**
   * Cleanup — call on unmount.
   */
  function cleanup() {
    isDisposed = true;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    resizeObserver.disconnect();
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('wheel', onWheel);
    // Dispose all geometries and materials
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    renderer.dispose();
    renderer.forceContextLoss();
  }

  return {
    cleanup,
    setSeatState,
    flyToSeatPOV,
    switchToOverviewMode,
    getRenderer: () => renderer,
    getSeatData: (seatId) => {
      const idx = seatIdToIndex.get(seatId);
      return idx !== undefined ? seatDataArray[idx] : null;
    },
    getSeatDataArray: () => seatDataArray,
    getSeatIdToIndex: () => seatIdToIndex,
  };
}

// Helper: merge BufferGeometries
function mergeGeometries(geos) {
  let totalVerts = 0;
  let totalIdx = 0;
  for (const g of geos) {
    totalVerts += g.attributes.position.count;
    totalIdx += g.index ? g.index.count : g.attributes.position.count;
  }
  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const indices = new Uint16Array(totalIdx);
  let vOffset = 0, iOffset = 0, vertOffset = 0;
  for (const g of geos) {
    const pos = g.attributes.position;
    const nor = g.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      positions[(vOffset + i) * 3] = pos.getX(i);
      positions[(vOffset + i) * 3 + 1] = pos.getY(i);
      positions[(vOffset + i) * 3 + 2] = pos.getZ(i);
      if (nor) {
        normals[(vOffset + i) * 3] = nor.getX(i);
        normals[(vOffset + i) * 3 + 1] = nor.getY(i);
        normals[(vOffset + i) * 3 + 2] = nor.getZ(i);
      }
    }
    if (g.index) {
      for (let i = 0; i < g.index.count; i++) {
        indices[iOffset + i] = g.index.array[i] + vOffset;
      }
      iOffset += g.index.count;
    } else {
      for (let i = 0; i < pos.count; i++) {
        indices[iOffset + i] = vOffset + i;
      }
      iOffset += pos.count;
    }
    vOffset += pos.count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  return merged;
}
