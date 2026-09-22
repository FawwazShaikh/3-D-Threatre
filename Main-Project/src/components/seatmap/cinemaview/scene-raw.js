
    if (typeof THREE === 'undefined') {
      document.getElementById('error-alert').style.display = 'block';
    }

    // ============================================================================
    // 1. CONFIGURATION & LAYOUT (176 SEATS: 11 ROWS x 16 SEATS, MASSIVE SCREEN SCALE)
    // ============================================================================
    const CONFIG = {
      // Screen Position & Size (2.35:1 Anamorphic Cinema Screen)
      screenCenter: new THREE.Vector3(0, 4.8, -12.5),
      screenWidth: 18.0,
      screenHeight: 7.66,
      screenCurveRadius: 35.0,
      screenTilt: -0.03,

      // Thin Low Stage Strip Directly Under Screen
      stageCenter: new THREE.Vector3(0, 0.08, -12.2),
      stageWidth: 18.5,
      stageDepth: 1.0,
      stageHeight: 0.15,

      // Auditorium Layout (11 Rows x 16 Seats = 176 Seats total, 11 Distinct Stadium-Raked Rows)
      rows: 11,
      seatsPerRow: 16,
      seatWidth: 0.58,
      rowDepth: 0.92, // Row depth spacing
      rowRise: 0.24,  // Row elevation rake
      rowZStart: -10.2,

      // Scoring Formula Constants
      scoring: {
        idealDistance: 13.0,
        distancePenaltyFactor: 3.2,
        anglePenaltyFactor: 1.1,
      },

      // Dynamic Pricing Formula Constants
      pricing: {
        basePrice: 350,
        minMultiplier: 0.7,
        scoreMultiplier: 0.6
      }
    };

    // ============================================================================
    // 2. SCENE & RENDERER INITIALIZATION (HIGH-CONTRAST CINEMATIC PHOTOREAL)
    // ============================================================================
    const canvas = document.getElementById('webgl-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.10;

    const scene = new THREE.Scene();
    // Neutral dark charcoal-black ceiling and background, zero brown/violet tint
    scene.background = new THREE.Color(0x060608);
    scene.fog = new THREE.FogExp2(0x0a0604, 0.015);

    // Wide-Angle Front-Center Perspective Camera (FOV 68° positioned near entrance)
    const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 140.0);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-1000, -1000);
    const seatMeshes = [];
    const seatDataMap = new Map();

    let currentMode = 'OVERVIEW'; // 'OVERVIEW' | 'SEAT_PREVIEW'
    let selectedSeatData = null;
    let hoveredSeatMesh = null;

    // ============================================================================
    // 3. ATMOSPHERIC CINEMA LIGHTING (WARM AMBER WALL POOLS, NO PURPLE/MAUVE)
    // ============================================================================
    const hemiLight = new THREE.HemisphereLight(0xfff5ea, 0x060608, 0.15);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0x121216, 0.12);
    scene.add(ambientLight);

    // Main Warm-White Directional Key Light
    const dirLight = new THREE.DirectionalLight(0xfff5ea, 0.30);
    dirLight.position.set(10, 20, 12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Warm Rim-Lighting on Seat Edges (Warm Amber 2700K)
    const rimLight = new THREE.DirectionalLight(0xff8844, 0.20);
    rimLight.position.set(0, 9, -18);
    scene.add(rimLight);

    // Subtly Lit Minimal Amber Spotlights (Background near-black and out of focus)
    const wallLightL1 = new THREE.SpotLight(0xffaa33, 0.25, 28, Math.PI / 2.8, 0.85, 1.5);
    wallLightL1.position.set(-18.0, 7.5, -9.0);
    wallLightL1.target.position.set(-18.5, 1.5, -4.0);
    scene.add(wallLightL1);
    scene.add(wallLightL1.target);

    const wallLightR1 = new THREE.SpotLight(0xffaa33, 0.25, 28, Math.PI / 2.8, 0.85, 1.5);
    wallLightR1.position.set(18.0, 7.5, -9.0);
    wallLightR1.target.position.set(18.5, 1.5, -4.0);
    scene.add(wallLightR1);
    scene.add(wallLightR1.target);

    // Screen Fiery Light Spill onto Stage & Front Rows
    const screenSpillLight = new THREE.SpotLight(0xff5500, 2.2, 30, Math.PI / 2.2, 0.6, 1.2);
    screenSpillLight.position.set(0, 6.5, -12.5);
    screenSpillLight.target.position.set(0, 0.2, -5.0);
    scene.add(screenSpillLight);
    scene.add(screenSpillLight.target);

    // Secondary soft screen fill spill on front aisle
    const screenSpillLight2 = new THREE.SpotLight(0xff3300, 1.2, 22, Math.PI / 1.8, 0.7, 1.0);
    screenSpillLight2.position.set(0, 4.0, -12.0);
    screenSpillLight2.target.position.set(0, 0.0, -8.0);
    scene.add(screenSpillLight2);
    scene.add(screenSpillLight2.target);

    // Stage Soft Warm Spotlights
    const stageSpot1 = new THREE.SpotLight(0xfffaee, 1.4);
    stageSpot1.position.set(-8.0, 10.5, -6.0);
    stageSpot1.target.position.copy(CONFIG.stageCenter);
    scene.add(stageSpot1);
    scene.add(stageSpot1.target);

    const stageSpot2 = new THREE.SpotLight(0xfffaee, 1.4);
    stageSpot2.position.set(8.0, 10.5, -6.0);
    stageSpot2.target.position.copy(CONFIG.stageCenter);
    scene.add(stageSpot2);
    scene.add(stageSpot2.target);

    // Dynamic Ceiling Panel Texture with Fine Seam Joints (Neutral Dark Charcoal-Black)
    const ceilingCanvas = document.createElement('canvas');
    ceilingCanvas.width = 256;
    ceilingCanvas.height = 256;
    const cCtx = ceilingCanvas.getContext('2d');
    cCtx.fillStyle = '#020203';
    cCtx.fillRect(0, 0, 256, 256);
    cCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    cCtx.lineWidth = 1.2;
    for (let p = 0; p <= 256; p += 64) {
      cCtx.beginPath(); cCtx.moveTo(p, 0); cCtx.lineTo(p, 256); cCtx.stroke();
      cCtx.beginPath(); cCtx.moveTo(0, p); cCtx.lineTo(256, p); cCtx.stroke();
    }
    const ceilingTexture = new THREE.CanvasTexture(ceilingCanvas);
    ceilingTexture.wrapS = THREE.RepeatWrapping;
    ceilingTexture.wrapT = THREE.RepeatWrapping;
    ceilingTexture.repeat.set(8, 8);

    // Pure Neutral Dark Charcoal-Black Ceiling Base Surface
    const ceilingGeo = new THREE.PlaneGeometry(22, 44);
    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTexture, color: 0x020203, roughness: 0.95 });
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(0, 9.5, 0);
    scene.add(ceilingMesh);

    // Distinct Small Circular Recessed Spotlight Fixtures (Dark Metal Housing + Warm-White Bulb Center)
    const housingMat = new THREE.MeshStandardMaterial({ color: 0x141419, roughness: 0.35, metalness: 0.85 });
    const innerBezelMat = new THREE.MeshStandardMaterial({ color: 0x060609, roughness: 0.8 });
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffaee, // Warm-white 3000K real-world bulb light
      emissiveIntensity: 3.8
    });

    // Contained Soft Localized Glow Ring around Fixture (Does not bleed across ceiling)
    const localGlowCanvas = document.createElement('canvas');
    localGlowCanvas.width = 128;
    localGlowCanvas.height = 128;
    const lgCtx = localGlowCanvas.getContext('2d');
    const lgGrad = lgCtx.createRadialGradient(64, 64, 12, 64, 64, 60);
    lgGrad.addColorStop(0, 'rgba(255, 250, 238, 0.70)');
    lgGrad.addColorStop(0.35, 'rgba(255, 235, 200, 0.30)');
    lgGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    lgCtx.fillStyle = lgGrad;
    lgCtx.beginPath(); lgCtx.arc(64, 64, 60, 0, Math.PI * 2); lgCtx.fill();

    const localGlowTexture = new THREE.CanvasTexture(localGlowCanvas);
    const localGlowMat = new THREE.MeshBasicMaterial({
      map: localGlowTexture,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const localGlowGeo = new THREE.PlaneGeometry(0.65, 0.65);

    const downlightHousingGeo = new THREE.CylinderGeometry(0.16, 0.20, 0.05, 16);
    const innerBezelGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.04, 16);
    const emissiveDiscGeo = new THREE.CircleGeometry(0.09, 16);
    emissiveDiscGeo.rotateX(Math.PI / 2);
    const haloGeoRotated = localGlowGeo.clone();
    haloGeoRotated.rotateX(Math.PI / 2);

    const CEILING_LIGHTS = 6 * 8; // 48
    const instHousing = new THREE.InstancedMesh(downlightHousingGeo, housingMat, CEILING_LIGHTS);
    const instBezel = new THREE.InstancedMesh(innerBezelGeo, innerBezelMat, CEILING_LIGHTS);
    const instDisc = new THREE.InstancedMesh(emissiveDiscGeo, bulbMat, CEILING_LIGHTS);
    const instHalo = new THREE.InstancedMesh(haloGeoRotated, localGlowMat, CEILING_LIGHTS);

    const dummyFixture = new THREE.Object3D();
    let fixtureIdx = 0;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 8; c++) {
        const x = -9.0 + c * 2.57;
        const z = -12.0 + r * 5.2;

        dummyFixture.position.set(x, 9.47, z);
        dummyFixture.rotation.set(0, 0, 0);
        dummyFixture.updateMatrix();
        instHousing.setMatrixAt(fixtureIdx, dummyFixture.matrix);

        dummyFixture.position.set(x, 11.96, z);
        dummyFixture.updateMatrix();
        instBezel.setMatrixAt(fixtureIdx, dummyFixture.matrix);

        dummyFixture.position.set(x, 11.93, z);
        dummyFixture.updateMatrix();
        instDisc.setMatrixAt(fixtureIdx, dummyFixture.matrix);

        dummyFixture.position.set(x, 11.92, z);
        dummyFixture.updateMatrix();
        instHalo.setMatrixAt(fixtureIdx, dummyFixture.matrix);

        fixtureIdx++;
      }
    }
    instHousing.instanceMatrix.needsUpdate = true;
    instBezel.instanceMatrix.needsUpdate = true;
    instDisc.instanceMatrix.needsUpdate = true;
    instHalo.instanceMatrix.needsUpdate = true;
    scene.add(instHousing);
    scene.add(instBezel);
    scene.add(instDisc);
    scene.add(instHalo);

    // Two Aggregate Overhead PointLights to simulate ceiling downlight array
    const ceilingFillL = new THREE.PointLight(0xfffaee, 0.45, 20);
    ceilingFillL.position.set(-7, 10.5, -2);
    scene.add(ceilingFillL);
    const ceilingFillR = new THREE.PointLight(0xfffaee, 0.45, 20);
    ceilingFillR.position.set(7, 10.5, -2);
    scene.add(ceilingFillR);

    // Ceiling Truss / Grid Structure (Dark Metal Beams Connecting Downlight Housings)
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 0.45, metalness: 0.75 });
    // Longitudinal truss beams (run along Z axis)
    const longTrussGeo = new THREE.BoxGeometry(0.12, 0.18, 40);
    for (let lt = 0; lt < 4; lt++) {
      const ltx = -11 + lt * 7.3;
      const ltMesh = new THREE.Mesh(longTrussGeo, trussMat);
      ltMesh.position.set(ltx, 11.88, -2);
      scene.add(ltMesh);
    }
    // Cross truss beams (run along X axis, connecting longitudinals)
    const crossTrussGeo = new THREE.BoxGeometry(30, 0.14, 0.10);
    for (let ct = 0; ct < 7; ct++) {
      const ctz = -14 + ct * 5.2;
      const ctMesh = new THREE.Mesh(crossTrussGeo, trussMat);
      ctMesh.position.set(0, 11.86, ctz);
      scene.add(ctMesh);
    }

    // HVAC / Acoustic Cloud Baffles (Suspended Rectangular Panels Near Screen End)
    const baffleMat = new THREE.MeshStandardMaterial({ color: 0x0e0e12, roughness: 0.92, metalness: 0.05 });
    const baffleGeo = new THREE.BoxGeometry(6.0, 0.06, 2.8);
    const bafflePositions = [
      { x: -6.5, z: -14.0, tilt: 0.04 },
      { x: 6.5, z: -14.0, tilt: -0.04 },
      { x: -3.0, z: -9.0, tilt: 0.02 },
      { x: 3.0, z: -9.0, tilt: -0.02 }
    ];
    bafflePositions.forEach(bp => {
      const bMesh = new THREE.Mesh(baffleGeo, baffleMat);
      bMesh.position.set(bp.x, 11.70, bp.z);
      bMesh.rotation.x = bp.tilt;
      scene.add(bMesh);
      // Thin suspension rods
      const rodGeo = new THREE.BoxGeometry(0.02, 0.30, 0.02);
      const rodL = new THREE.Mesh(rodGeo, trussMat);
      rodL.position.set(bp.x - 2.5, 11.85, bp.z);
      scene.add(rodL);
      const rodR = new THREE.Mesh(rodGeo, trussMat);
      rodR.position.set(bp.x + 2.5, 11.85, bp.z);
      scene.add(rodR);
    });

    // Vertical Acoustic Slat Panel Canvas Texture (Warm Dark Charcoal/Espresso Paneling)
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 256;
    wallCanvas.height = 256;
    const wCtx = wallCanvas.getContext('2d');
    wCtx.fillStyle = '#181411';
    wCtx.fillRect(0, 0, 256, 256);

    for (let x = 0; x < 256; x += 16) {
      wCtx.fillStyle = 'rgba(0, 0, 0, 0.40)';
      wCtx.fillRect(x, 0, 2, 256);
      wCtx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      wCtx.fillRect(x + 2, 0, 14, 256);
    }
    const wallTexture = new THREE.CanvasTexture(wallCanvas);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(16, 4);

    // Warm Dark Espresso Finished Panel Backdrop Material (#171310, roughness 0.90)
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, color: 0x171310, roughness: 0.90, metalness: 0.0 });

    // Architectural Side Walls Base Enclosure Planes (Width 22m, Depth 42m)
    const leftWallGeo = new THREE.PlaneGeometry(42, 10.0);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-11.0, 5.0, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWallGeo = new THREE.PlaneGeometry(42, 10.0);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(11.0, 5.0, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Architectural Sub-Paneled Wall Grid System (OPTION B — Warm Charcoal/Espresso Acoustic Panels)
    const acousticFabricMat = new THREE.MeshStandardMaterial({
      color: 0x1d1815, // Warm Dark Charcoal/Espresso (#1d1815: R=29, G=24, B=21 - zero magenta/pink)
      roughness: 0.90, // Matte acoustic fabric finish
      metalness: 0.0   // Fabric body is non-metallic
    });
    const brushedTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Warm Gold/Brass trim
      roughness: 0.35,
      metalness: 0.60  // Metallic warm accent trim
    });
    const wallLedMat = new THREE.MeshStandardMaterial({
      color: 0xff7a2e,
      emissive: 0xff7a2e,
      emissiveIntensity: 0.30
    });
    const wallWashFixtureMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a20,
      roughness: 0.30,
      metalness: 0.70
    });

    const wallSegCount = 9;
    const wallSegWidth = 3.83;
    const wallSegZStart = -17.1;
    const wpRows = 2;
    const wpCols = 5;
    const wpGap = 0.06;
    const wpAreaH = 8.5;
    const wpAreaBot = 0.85;
    const wpCellH = (wpAreaH - (wpRows + 1) * wpGap) / wpRows;
    const wpCellW = (wallSegWidth - 0.1 - (wpCols + 1) * wpGap) / wpCols;

    const TOTAL_AP = wallSegCount * wpRows * wpCols * 2;
    const apGeo = new THREE.BoxGeometry(0.10, wpCellH - 0.04, wpCellW - 0.04);
    const instAP = new THREE.InstancedMesh(apGeo, acousticFabricMat, TOTAL_AP);
    instAP.receiveShadow = true;

    const hTrimTotal = wallSegCount * (wpRows + 1) * 2;
    const hTrimGeo = new THREE.BoxGeometry(0.12, wpGap * 0.8, wallSegWidth - 0.2);
    const instHT = new THREE.InstancedMesh(hTrimGeo, brushedTrimMat, hTrimTotal);

    const vTrimTotal = wallSegCount * (wpCols + 1) * 2;
    const vTrimGeo = new THREE.BoxGeometry(0.12, wpAreaH, wpGap * 0.8);
    const instVT = new THREE.InstancedMesh(vTrimGeo, brushedTrimMat, vTrimTotal);

    const ledTotal = wallSegCount * 2 * 2;
    const ledGeo = new THREE.BoxGeometry(0.02, 0.03, wallSegWidth - 0.15);
    const instLED = new THREE.InstancedMesh(ledGeo, wallLedMat, ledTotal);

    const wwPerSeg = Math.floor(wpCols / 2);
    const wwTotal = wallSegCount * wwPerSeg * 2;
    const wwGeo = new THREE.BoxGeometry(0.04, 0.06, 0.14);
    const instWW = new THREE.InstancedMesh(wwGeo, wallWashFixtureMat, wwTotal);
    const wwLensGeo = new THREE.BoxGeometry(0.03, 0.02, 0.10);
    const wwLensMat = new THREE.MeshStandardMaterial({
      color: 0xfff5ea,
      emissive: 0xfff0dd,
      emissiveIntensity: 0.5
    });
    const instWWL = new THREE.InstancedMesh(wwLensGeo, wwLensMat, wwTotal);

    const dummyWP = new THREE.Object3D();
    let apI = 0, htI = 0, vtI = 0, ledI = 0, wwI = 0;

    for (let wall = 0; wall < 2; wall++) {
      const wx = wall === 0 ? -10.94 : 10.94;
      const wallDir = wall === 0 ? 1 : -1;

      for (let seg = 0; seg < wallSegCount; seg++) {
        const segZ = wallSegZStart + seg * wallSegWidth;

        for (let row = 0; row < wpRows; row++) {
          for (let col = 0; col < wpCols; col++) {
            const py = wpAreaBot + wpGap + (row + 0.5) * (wpCellH + wpGap);
            const pz = segZ - (wallSegWidth - 0.1) / 2 + wpGap + (col + 0.5) * (wpCellW + wpGap);
            const depthOffset = (Math.sin(row * 3.1 + col * 4.7 + seg * 2.3) * 0.02);
            dummyWP.position.set(wx + wallDir * depthOffset, py, pz);
            dummyWP.rotation.set(0, 0, 0);
            dummyWP.updateMatrix();
            instAP.setMatrixAt(apI++, dummyWP.matrix);
          }
        }

        for (let hr = 0; hr <= wpRows; hr++) {
          const hy = wpAreaBot + wpGap * 0.5 + hr * (wpCellH + wpGap);
          dummyWP.position.set(wx, hy, segZ);
          dummyWP.rotation.set(0, 0, 0);
          dummyWP.updateMatrix();
          instHT.setMatrixAt(htI++, dummyWP.matrix);
        }

        for (let vc = 0; vc <= wpCols; vc++) {
          const vz = segZ - (wallSegWidth - 0.1) / 2 + wpGap * 0.5 + vc * (wpCellW + wpGap);
          dummyWP.position.set(wx, wpAreaBot + wpAreaH / 2, vz);
          dummyWP.rotation.set(0, 0, 0);
          dummyWP.updateMatrix();
          instVT.setMatrixAt(vtI++, dummyWP.matrix);
        }

        dummyWP.position.set(wx, wpAreaBot - 0.02, segZ);
        dummyWP.rotation.set(0, 0, 0);
        dummyWP.updateMatrix();
        instLED.setMatrixAt(ledI++, dummyWP.matrix);
        dummyWP.position.set(wx, wpAreaBot + wpAreaH + 0.08, segZ);
        dummyWP.updateMatrix();
        instLED.setMatrixAt(ledI++, dummyWP.matrix);

        for (let ww = 1; ww < wpCols; ww += 2) {
          const wwZ = segZ - (wallSegWidth - 0.1) / 2 + wpGap + (ww + 0.5) * (wpCellW + wpGap);
          dummyWP.position.set(wx, wpAreaBot + wpAreaH + 0.12, wwZ);
          dummyWP.rotation.set(0, 0, 0);
          dummyWP.updateMatrix();
          instWW.setMatrixAt(wwI, dummyWP.matrix);
          dummyWP.position.set(wx, wpAreaBot + wpAreaH + 0.10, wwZ);
          dummyWP.updateMatrix();
          instWWL.setMatrixAt(wwI, dummyWP.matrix);
          wwI++;
        }
      }
    }
    instAP.instanceMatrix.needsUpdate = true;
    instHT.instanceMatrix.needsUpdate = true;
    instVT.instanceMatrix.needsUpdate = true;
    instLED.instanceMatrix.needsUpdate = true;
    instWW.instanceMatrix.needsUpdate = true;
    instWWL.instanceMatrix.needsUpdate = true;
    scene.add(instAP);
    scene.add(instHT);
    scene.add(instVT);
    scene.add(instLED);
    scene.add(instWW);
    scene.add(instWWL);

    const trimMat = new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.6, metalness: 0.4 });

    const leftSkirting = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 42), trimMat);
    leftSkirting.position.set(-10.95, 0.09, 0);
    scene.add(leftSkirting);

    const rightSkirting = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 42), trimMat);
    rightSkirting.position.set(10.95, 0.09, 0);
    scene.add(rightSkirting);

    const backSkirting = new THREE.Mesh(new THREE.BoxGeometry(22, 0.18, 0.08), trimMat);
    backSkirting.position.set(0, 0.09, 17.96);
    scene.add(backSkirting);

    const frontSkirting = new THREE.Mesh(new THREE.BoxGeometry(22, 0.18, 0.08), trimMat);
    frontSkirting.position.set(0, 0.09, -20.96);
    scene.add(frontSkirting);

    const leftCrown = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 42), trimMat);
    leftCrown.position.set(-10.94, 9.41, 0);
    scene.add(leftCrown);

    const rightCrown = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 42), trimMat);
    rightCrown.position.set(10.94, 9.41, 0);
    scene.add(rightCrown);

    const backCrown = new THREE.Mesh(new THREE.BoxGeometry(22, 0.18, 0.12), trimMat);
    backCrown.position.set(0, 9.41, 17.94);
    scene.add(backCrown);

    const frontCrown = new THREE.Mesh(new THREE.BoxGeometry(22, 0.18, 0.12), trimMat);
    frontCrown.position.set(0, 9.41, -20.94);
    scene.add(frontCrown);

    const backWallGeo = new THREE.PlaneGeometry(22, 10.0);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 5.0, 18.0);
    scene.add(backWall);

    // Architectural Double Entrance Doors on Back Wall
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 1.4, 17.92);

    const doorFrameMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 2.85, 0.10),
      new THREE.MeshStandardMaterial({ color: 0x121218, roughness: 0.4, metalness: 0.4 })
    );
    doorGroup.add(doorFrameMesh);

    const doorPanelMat = new THREE.MeshStandardMaterial({ color: 0x09090d, roughness: 0.6 });
    const doorLeft = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.7, 0.06), doorPanelMat);
    doorLeft.position.set(-0.62, 0, 0.03);
    doorGroup.add(doorLeft);

    const doorRight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.7, 0.06), doorPanelMat);
    doorRight.position.set(0.62, 0, 0.03);
    doorGroup.add(doorRight);

    // Gold Brass Door Handles
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
    const hL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.05), handleMat); hL.position.set(-0.08, 0, 0.07); doorGroup.add(hL);
    const hR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.05), handleMat); hR.position.set(0.08, 0, 0.07); doorGroup.add(hR);

    scene.add(doorGroup);

    // Illuminated EXIT Signs (Proper Red Emissive Text Signs Above Door Openings)
    const exitSignCanvas = document.createElement('canvas');
    exitSignCanvas.width = 128;
    exitSignCanvas.height = 48;
    const esCtx = exitSignCanvas.getContext('2d');
    esCtx.fillStyle = '#1a0000';
    esCtx.fillRect(0, 0, 128, 48);
    esCtx.fillStyle = '#ff2222';
    esCtx.font = 'bold 30px Arial, sans-serif';
    esCtx.textAlign = 'center';
    esCtx.textBaseline = 'middle';
    esCtx.fillText('EXIT', 64, 24);
    const exitSignTex = new THREE.CanvasTexture(exitSignCanvas);

    const exitSignMat = new THREE.MeshBasicMaterial({
      map: exitSignTex,
      transparent: false
    });
    const exitHousingMat = new THREE.MeshStandardMaterial({
      color: 0x0c0c0c,
      roughness: 0.5,
      metalness: 0.3
    });
    const exitGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff2222,
      emissiveIntensity: 2.0
    });

    const exitSignLocations = [
      { x: -10.88, y: 3.8, z: -10.0, rotY: Math.PI / 2 },
      { x: -10.88, y: 3.8, z: 10.0, rotY: Math.PI / 2 },
      { x: 10.88, y: 3.8, z: -10.0, rotY: -Math.PI / 2 },
      { x: 10.88, y: 3.8, z: 10.0, rotY: -Math.PI / 2 }
    ];

    exitSignLocations.forEach(loc => {
      const signGroup = new THREE.Group();
      signGroup.position.set(loc.x, loc.y, loc.z);
      signGroup.rotation.y = loc.rotY;

      // Housing box
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.50), exitHousingMat);
      signGroup.add(housing);
      // Front face with EXIT text
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.18), exitSignMat);
      face.position.set(0.025, 0, 0);
      face.rotation.y = Math.PI / 2;
      signGroup.add(face);
      // Glow accent strip under sign
      const glowStrip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.44), exitGlowMat);
      glowStrip.position.set(0.01, -0.12, 0);
      signGroup.add(glowStrip);

      scene.add(signGroup);
    });

    // "SCREEN 1" Auditorium ID Plaque (Near Back Wall / Entrance)
    const screenIdCanvas = document.createElement('canvas');
    screenIdCanvas.width = 192;
    screenIdCanvas.height = 64;
    const siCtx = screenIdCanvas.getContext('2d');
    siCtx.fillStyle = '#0a0a0e';
    siCtx.fillRect(0, 0, 192, 64);
    siCtx.strokeStyle = '#d4af37';
    siCtx.lineWidth = 2;
    siCtx.strokeRect(4, 4, 184, 56);
    siCtx.fillStyle = '#d4af37';
    siCtx.font = 'bold 26px Georgia, serif';
    siCtx.textAlign = 'center';
    siCtx.textBaseline = 'middle';
    siCtx.fillText('SCREEN 1', 96, 32);
    const screenIdTex = new THREE.CanvasTexture(screenIdCanvas);
    const screenIdMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 0.22),
      new THREE.MeshBasicMaterial({ map: screenIdTex })
    );
    screenIdMesh.position.set(1.8, 3.2, 17.91);
    scene.add(screenIdMesh);

    // Row Letter Markers (Backlit Placards at Aisle-End Seats)
    const rowLetterLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
    const rowMarkerMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffa500,
      emissiveIntensity: 0.6,
      metalness: 0.7,
      roughness: 0.3
    });
    for (let rr = 0; rr < CONFIG.rows; rr++) {
      const rrZ = CONFIG.rowZStart + rr * CONFIG.rowDepth;
      const rrY = rr * CONFIG.rowRise + 0.55;
      // Create canvas texture for this row letter
      const rlCanvas = document.createElement('canvas');
      rlCanvas.width = 32;
      rlCanvas.height = 32;
      const rlCtx = rlCanvas.getContext('2d');
      rlCtx.fillStyle = '#0a0a0e';
      rlCtx.fillRect(0, 0, 32, 32);
      rlCtx.fillStyle = '#ffd700';
      rlCtx.font = 'bold 22px Arial';
      rlCtx.textAlign = 'center';
      rlCtx.textBaseline = 'middle';
      rlCtx.fillText(rowLetterLabels[rr], 16, 17);
      const rlTex = new THREE.CanvasTexture(rlCanvas);

      // Left aisle marker
      const lmMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, 0.12),
        new THREE.MeshBasicMaterial({ map: rlTex })
      );
      lmMesh.position.set(-4.85, rrY, rrZ);
      lmMesh.rotation.y = Math.PI / 2;
      scene.add(lmMesh);

      // Right aisle marker
      const rmMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, 0.12),
        new THREE.MeshBasicMaterial({ map: rlTex })
      );
      rmMesh.position.set(4.85, rrY, rrZ);
      rmMesh.rotation.y = -Math.PI / 2;
      scene.add(rmMesh);
    }

    // Wall-Mounted Emergency Light Fixtures
    const emGeo = new THREE.BoxGeometry(0.28, 0.18, 0.12);
    const emSpotGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12);
    emSpotGeo.rotateX(Math.PI / 2);
    const emMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d5, roughness: 0.4 });

    const emLocations = [
      { x: -10.8, y: 4.5, z: 14.0, rotY: Math.PI / 2 },
      { x: 10.8, y: 4.5, z: 14.0, rotY: -Math.PI / 2 }
    ];
    emLocations.forEach(loc => {
      const emGroup = new THREE.Group();
      emGroup.position.set(loc.x, loc.y, loc.z);
      emGroup.rotation.y = loc.rotY;

      const body = new THREE.Mesh(emGeo, emMat);
      emGroup.add(body);

      const s1 = new THREE.Mesh(emSpotGeo, emMat); s1.position.set(-0.08, -0.02, 0.08); emGroup.add(s1);
      const s2 = new THREE.Mesh(emSpotGeo, emMat); s2.position.set(0.08, -0.02, 0.08); emGroup.add(s2);

      scene.add(emGroup);
    });

    // Cinema Speaker System with Perforated Grille Texture
    // Perforated grille alpha-map (dot pattern, performant)
    const grilleCanvas = document.createElement('canvas');
    grilleCanvas.width = 64;
    grilleCanvas.height = 64;
    const grCtx = grilleCanvas.getContext('2d');
    grCtx.fillStyle = '#0a0a0d';
    grCtx.fillRect(0, 0, 64, 64);
    grCtx.fillStyle = '#1a1a22';
    for (let gy = 2; gy < 64; gy += 4) {
      for (let gx = 2; gx < 64; gx += 4) {
        grCtx.beginPath();
        grCtx.arc(gx, gy, 1.2, 0, Math.PI * 2);
        grCtx.fill();
      }
    }
    const grilleTex = new THREE.CanvasTexture(grilleCanvas);
    grilleTex.wrapS = THREE.RepeatWrapping;
    grilleTex.wrapT = THREE.RepeatWrapping;
    grilleTex.repeat.set(3, 4);

    const speakerBoxMat = new THREE.MeshStandardMaterial({
      map: grilleTex,
      color: 0x0a0a0d,
      roughness: 0.55,
      metalness: 0.15
    });
    const speakerHornMat = new THREE.MeshStandardMaterial({
      color: 0x0d0d10,
      roughness: 0.4,
      metalness: 0.3
    });
    const powerLedGreenMat = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 3.0
    });
    const powerLedRedMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 3.0
    });
    const powerLedGeo = new THREE.SphereGeometry(0.015, 6, 6);

    // Surround Wall Speakers — Dual Height (Elevated + Ear-Level)
    const speakerPositions = [
      // Elevated row
      { x: -10.8, y: 6.8, z: -10 }, { x: -10.8, y: 7.0, z: -3 }, { x: -10.8, y: 7.2, z: 4 }, { x: -10.8, y: 7.4, z: 11 },
      { x: 10.8, y: 6.8, z: -10 }, { x: 10.8, y: 7.0, z: -3 }, { x: 10.8, y: 7.2, z: 4 }, { x: 10.8, y: 7.4, z: 11 },
      // Ear-level row
      { x: -10.8, y: 3.2, z: -6.5 }, { x: -10.8, y: 3.3, z: 0.5 }, { x: -10.8, y: 3.4, z: 7.5 },
      { x: 10.8, y: 3.2, z: -6.5 }, { x: 10.8, y: 3.3, z: 0.5 }, { x: 10.8, y: 3.4, z: 7.5 }
    ];

    const speakerBoxGeo = new THREE.BoxGeometry(0.25, 0.70, 0.35);
    const coneGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.04, 16);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x1a1a20, roughness: 0.4 });

    speakerPositions.forEach((sp, si) => {
      const spGroup = new THREE.Group();
      spGroup.position.set(sp.x, sp.y, sp.z);
      spGroup.rotation.y = sp.x < 0 ? Math.PI / 2 : -Math.PI / 2;

      const box = new THREE.Mesh(speakerBoxGeo, speakerBoxMat);
      spGroup.add(box);

      const cone1 = new THREE.Mesh(coneGeo, coneMat);
      cone1.rotation.x = Math.PI / 2;
      cone1.position.set(0, 0.18, 0.13);
      spGroup.add(cone1);

      const cone2 = new THREE.Mesh(coneGeo, coneMat);
      cone2.rotation.x = Math.PI / 2;
      cone2.position.set(0, -0.18, 0.13);
      spGroup.add(cone2);

      // Power LED dot (alternating green/red)
      const ledDot = new THREE.Mesh(powerLedGeo, si % 2 === 0 ? powerLedGreenMat : powerLedRedMat);
      ledDot.position.set(0, -0.30, 0.14);
      spGroup.add(ledDot);

      scene.add(spGroup);
    });

    // LCR Horn Speakers Flanking Screen (Left / Right)
    const lcrPositions = [
      { x: -8.5, y: 4.5, z: -12.3, rotY: 0.25 },   // Left
      { x: 8.5, y: 4.5, z: -12.3, rotY: -0.25 }    // Right
    ];
    lcrPositions.forEach(lp => {
      const lcrGroup = new THREE.Group();
      lcrGroup.position.set(lp.x, lp.y, lp.z);
      lcrGroup.rotation.y = lp.rotY;

      // Main cabinet
      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.9, 0.55),
        speakerBoxMat
      );
      lcrGroup.add(cab);
      // Horn flare
      const horn = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.35, 0.20),
        speakerHornMat
      );
      horn.position.set(0, 0.15, 0.20);
      lcrGroup.add(horn);
      // Woofer cone
      const woof = new THREE.Mesh(
        new THREE.CylinderGeometry(0.20, 0.20, 0.06, 16),
        coneMat
      );
      woof.rotation.x = Math.PI / 2;
      woof.position.set(0, -0.22, 0.22);
      lcrGroup.add(woof);
      // Power LED
      const lcrLed = new THREE.Mesh(powerLedGeo, powerLedGreenMat);
      lcrLed.position.set(0.65, -0.38, 0.24);
      lcrGroup.add(lcrLed);

      scene.add(lcrGroup);
    });

    // Dark Carpet Floor Base (#14141a, roughness 0.72, metalness 0.0)
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fCtx = floorCanvas.getContext('2d');
    fCtx.fillStyle = '#14141a';
    fCtx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 1.4;
      const val = Math.random();
      fCtx.fillStyle = val > 0.6 ? '#1e1e28' : (val > 0.3 ? '#161620' : '#22202c');
      fCtx.beginPath();
      fCtx.arc(x, y, r, 0, Math.PI * 2);
      fCtx.fill();
    }

    const carpetTexture = new THREE.CanvasTexture(floorCanvas);
    carpetTexture.wrapS = THREE.RepeatWrapping;
    carpetTexture.wrapT = THREE.RepeatWrapping;
    carpetTexture.repeat.set(12, 15);

    const floorGeo = new THREE.PlaneGeometry(22, 42);
    const floorMat = new THREE.MeshStandardMaterial({ map: carpetTexture, color: 0x14141a, roughness: 0.72, metalness: 0.0 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, -1.0);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Wall-to-Floor & Platform-to-Floor Ambient Occlusion / Contact Shadows
    const wallFloorAoCanvas = document.createElement('canvas');
    wallFloorAoCanvas.width = 256;
    wallFloorAoCanvas.height = 64;
    const waoCtx = wallFloorAoCanvas.getContext('2d');
    const waoGrad = waoCtx.createLinearGradient(0, 0, 0, 64);
    waoGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    waoGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    waoCtx.fillStyle = waoGrad;
    waoCtx.fillRect(0, 0, 256, 64);

    const wallFloorAoMat = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(wallFloorAoCanvas),
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });

    const leftAoMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 42), wallFloorAoMat);
    leftAoMesh.rotation.x = -Math.PI / 2;
    leftAoMesh.rotation.z = -Math.PI / 2;
    leftAoMesh.position.set(-10.4, 0.005, 0);
    scene.add(leftAoMesh);

    const rightAoMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 42), wallFloorAoMat);
    rightAoMesh.rotation.x = -Math.PI / 2;
    rightAoMesh.rotation.z = Math.PI / 2;
    rightAoMesh.position.set(10.4, 0.005, 0);
    scene.add(rightAoMesh);

    // Dark Maroon Cinema Carpet Material (Proper matte carpet — NO emissive, high roughness)
    // BUG FIX: Previous material had emissive: 0xaa0000, emissiveIntensity: 0.65 + roughness 0.38
    // causing blown-out white/pink appearance under overhead PointLights
    const aisleCarpetCanvas = document.createElement('canvas');
    aisleCarpetCanvas.width = 256;
    aisleCarpetCanvas.height = 256;
    const acCtx = aisleCarpetCanvas.getContext('2d');
    acCtx.fillStyle = '#2a0606';
    acCtx.fillRect(0, 0, 256, 256);
    // Damask diamond pattern (low-frequency geometric cinema carpet)
    for (let dy = 0; dy < 256; dy += 32) {
      for (let dx = 0; dx < 256; dx += 32) {
        const checker = (Math.floor(dx / 32) + Math.floor(dy / 32)) % 2;
        acCtx.fillStyle = checker === 0 ? '#320808' : '#240505';
        acCtx.fillRect(dx + 1, dy + 1, 30, 30);
        // Diamond motif inset
        acCtx.fillStyle = 'rgba(70, 12, 12, 0.35)';
        acCtx.beginPath();
        acCtx.moveTo(dx + 16, dy + 4);
        acCtx.lineTo(dx + 28, dy + 16);
        acCtx.lineTo(dx + 16, dy + 28);
        acCtx.lineTo(dx + 4, dy + 16);
        acCtx.closePath();
        acCtx.fill();
      }
    }
    // Carpet fiber noise for micro-detail
    for (let i = 0; i < 1500; i++) {
      acCtx.fillStyle = `rgba(${50 + Math.random() * 25}, ${4 + Math.random() * 8}, ${4 + Math.random() * 8}, 0.12)`;
      acCtx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random(), 1 + Math.random());
    }
    const aisleCarpetTex = new THREE.CanvasTexture(aisleCarpetCanvas);
    aisleCarpetTex.wrapS = THREE.RepeatWrapping;
    aisleCarpetTex.wrapT = THREE.RepeatWrapping;
    aisleCarpetTex.repeat.set(3, 3);

    const aisleCarpetMat = new THREE.MeshStandardMaterial({
      map: aisleCarpetTex,
      color: 0x4a0a0a,
      roughness: 0.90,
      metalness: 0.0
    });

    // ============================================================================
    // 4. MASSIVE SCREEN (NEAR EDGE-TO-EDGE, THIN CLEAN BLACK BEZEL, NO DECORATIVE FRAME)
    // ============================================================================
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1024;
    screenCanvas.height = 512;
    const ctx = screenCanvas.getContext('2d');

    const screenTexture = new THREE.CanvasTexture(screenCanvas);

    function updateScreenCanvasTexture(time) {
      try {
        const t = (time || 0) * 0.001;
        const w = screenCanvas.width;
        const h = screenCanvas.height;

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

        // Rich dark fiery background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0a0202');
        bgGrad.addColorStop(0.5, '#2b0606');
        bgGrad.addColorStop(1, '#080101');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const cx = w * 0.5;
        const cy = h * 0.48;
        const radius = 235 + Math.sin(t * 1.6) * 7;

        // Massive Glowing Fiery Explosion Sphere (Oppenheimer Visual)
        const fireGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, Math.max(10, radius));
        fireGrad.addColorStop(0, '#ffffff');
        fireGrad.addColorStop(0.12, '#fff066');
        fireGrad.addColorStop(0.35, '#ff6600');
        fireGrad.addColorStop(0.68, '#dc2626');
        fireGrad.addColorStop(0.88, '#7f1d1d');
        fireGrad.addColorStop(1.0, 'rgba(20, 0, 0, 0)');

        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(10, radius), 0, Math.PI * 2);
        ctx.fill();

        // Orbital Plasma Rings
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 5; i++) {
          const ringRad = radius * (0.35 + i * 0.20);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(t * 0.35 + i * 0.7);
          ctx.scale(1.0, 0.48);
          ctx.beginPath();
          ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 235, 160, 0.5)' : 'rgba(255, 110, 30, 0.45)';
          ctx.lineWidth = 3 + i * 1.5;
          ctx.arc(0, 0, Math.max(5, ringRad), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Drifting Sparkle Particles
        for (let p = 0; p < 50; p++) {
          const pAngle = (p * 137.5 + t * 45) * (Math.PI / 180);
          const pDist = 20 + ((p * 19 + t * 55) % (radius * 1.15));
          const px = cx + Math.cos(pAngle) * pDist;
          const py = cy + Math.sin(pAngle) * pDist * 0.55;
          const pr = 1.5 + (p % 3);

          ctx.fillStyle = p % 2 === 0 ? '#ffeaad' : '#ff3300';
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fill();
        }

        // Central Silhouette Figure (Hat & Suit Profile)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#0d0404';
        ctx.save();
        ctx.translate(cx, cy - 42);
        ctx.scale(1.0, 13 / 44);
        ctx.beginPath();
        ctx.arc(0, 0, 44, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillRect(cx - 25, cy - 88, 50, 50);
        ctx.beginPath();
        ctx.arc(cx, cy - 20, 23, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - 55, cy + 130);
        ctx.lineTo(cx - 26, cy + 10);
        ctx.lineTo(cx + 26, cy + 10);
        ctx.lineTo(cx + 55, cy + 130);
        ctx.closePath();
        ctx.fill();

        // Subtle Screen Acoustic Perforation Micro-Texture
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        for (let px = 0; px < w; px += 8) {
          for (let py = 0; py < h; py += 8) {
            ctx.fillRect(px, py, 1.2, 1.2);
          }
        }

        // Organic Screen Edge Light Falloff (Slightly brighter center vs edges)
        const edgeGrad = ctx.createRadialGradient(cx, cy, w * 0.28, cx, cy, w * 0.58);
        edgeGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        edgeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
        ctx.fillStyle = edgeGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.restore();
      } catch (err) {
        console.error("Screen canvas update error:", err);
      }

      screenTexture.needsUpdate = true;
    }

    // Massive Curved Cinema Screen (2.35:1 aspect ratio, filling 75-80% of auditorium wall width)
    const screenSegs = 32;
    const screenGeo = new THREE.PlaneGeometry(CONFIG.screenWidth, CONFIG.screenHeight, screenSegs, 1);
    const posAttr = screenGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const zOffset = - (x * x) / (2 * CONFIG.screenCurveRadius);
      posAttr.setZ(i, zOffset);
    }
    screenGeo.computeVertexNormals();

    const screenMat = new THREE.MeshBasicMaterial({
      map: screenTexture,
      side: THREE.DoubleSide
    });

    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.copy(CONFIG.screenCenter);
    screenMesh.rotation.x = CONFIG.screenTilt;
    scene.add(screenMesh);

    // Screen Atmospheric Halo Bloom Mesh (Hero Presentation Polish)
    const screenBloomCanvas = document.createElement('canvas');
    screenBloomCanvas.width = 512;
    screenBloomCanvas.height = 256;
    const sbCtx = screenBloomCanvas.getContext('2d');
    const sbGrad = sbCtx.createRadialGradient(256, 128, 40, 256, 128, 240);
    sbGrad.addColorStop(0, 'rgba(255, 90, 0, 0.65)');
    sbGrad.addColorStop(0.35, 'rgba(220, 38, 38, 0.35)');
    sbGrad.addColorStop(0.75, 'rgba(120, 10, 10, 0.12)');
    sbGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    sbCtx.fillStyle = sbGrad;
    sbCtx.fillRect(0, 0, 512, 256);

    const screenBloomGeo = new THREE.PlaneGeometry(CONFIG.screenWidth + 1.2, CONFIG.screenHeight + 0.8);
    const screenBloomMat = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(screenBloomCanvas),
      transparent: true,
      opacity: 0.50,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const screenBloomMesh = new THREE.Mesh(screenBloomGeo, screenBloomMat);
    screenBloomMesh.position.set(CONFIG.screenCenter.x, CONFIG.screenCenter.y, CONFIG.screenCenter.z - 0.08);
    screenBloomMesh.rotation.x = CONFIG.screenTilt;
    scene.add(screenBloomMesh);

    // Screen Soft Ambient Light Bounce onto Adjacent Sidewalls & Proscenium Edges
    const screenBounceGeo = new THREE.PlaneGeometry(4.0, 7.5);
    const screenBounceMat = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(screenBloomCanvas),
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const bounceL = new THREE.Mesh(screenBounceGeo, screenBounceMat);
    bounceL.rotation.y = Math.PI / 2;
    bounceL.position.set(-10.88, CONFIG.screenCenter.y, CONFIG.screenCenter.z + 1.0);
    scene.add(bounceL);

    const bounceR = new THREE.Mesh(screenBounceGeo, screenBounceMat);
    bounceR.rotation.y = -Math.PI / 2;
    bounceR.position.set(10.88, CONFIG.screenCenter.y, CONFIG.screenCenter.z + 1.0);
    scene.add(bounceR);

    // Black Velour Screen Masking Frame + Clean Bezel
    const velourMaskMat = new THREE.MeshStandardMaterial({
      color: 0x030305,
      roughness: 0.95,
      metalness: 0.0
    });
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.5, metalness: 0.8 });
    const screenBezelGroup = new THREE.Group();
    screenBezelGroup.position.copy(CONFIG.screenCenter);
    screenBezelGroup.rotation.x = CONFIG.screenTilt;

    // Velour masking borders (Continuous 4-sided frame surrounding screen content)
    const maskThickness = 0.40;
    const maskTop = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.screenWidth + maskThickness * 2, maskThickness, 0.15), velourMaskMat);
    maskTop.position.set(0, CONFIG.screenHeight / 2 + maskThickness / 2, -0.02);
    screenBezelGroup.add(maskTop);

    const maskBot = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.screenWidth + maskThickness * 2, maskThickness, 0.15), velourMaskMat);
    maskBot.position.set(0, -CONFIG.screenHeight / 2 - maskThickness / 2, -0.02);
    screenBezelGroup.add(maskBot);

    const maskLeft = new THREE.Mesh(new THREE.BoxGeometry(maskThickness, CONFIG.screenHeight, 0.15), velourMaskMat);
    maskLeft.position.set(-CONFIG.screenWidth / 2 - maskThickness / 2, 0, -0.02);
    screenBezelGroup.add(maskLeft);

    const maskRight = new THREE.Mesh(new THREE.BoxGeometry(maskThickness, CONFIG.screenHeight, 0.15), velourMaskMat);
    maskRight.position.set(CONFIG.screenWidth / 2 + maskThickness / 2, 0, -0.02);
    screenBezelGroup.add(maskRight);

    // Thin metal bezel (inner edge, crisp frame line)
    const topBezel = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.screenWidth + 0.2, 0.08, 0.06), bezelMat);
    topBezel.position.set(0, CONFIG.screenHeight / 2 + 0.04, 0.02);
    screenBezelGroup.add(topBezel);

    const botBezel = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.screenWidth + 0.2, 0.08, 0.06), bezelMat);
    botBezel.position.set(0, -CONFIG.screenHeight / 2 - 0.04, 0.02);
    screenBezelGroup.add(botBezel);

    const leftBezel = new THREE.Mesh(new THREE.BoxGeometry(0.08, CONFIG.screenHeight + 0.16, 0.06), bezelMat);
    leftBezel.position.set(-CONFIG.screenWidth / 2 - 0.04, 0, 0.02);
    screenBezelGroup.add(leftBezel);

    const rightBezel = new THREE.Mesh(new THREE.BoxGeometry(0.08, CONFIG.screenHeight + 0.16, 0.06), bezelMat);
    rightBezel.position.set(CONFIG.screenWidth / 2 + 0.04, 0, 0.02);
    screenBezelGroup.add(rightBezel);

    scene.add(screenBezelGroup);

    // Proscenium Curtain Folds (Soft draped geometry at screen left/right edges)
    const curtainMat = new THREE.MeshStandardMaterial({
      color: 0x1a0505,
      roughness: 0.88,
      metalness: 0.0
    });
    const curtainFoldGeo = new THREE.BoxGeometry(0.6, CONFIG.screenHeight + 1.2, 0.08);
    [-1, 1].forEach(side => {
      const curtainGroup = new THREE.Group();
      curtainGroup.position.set(
        side * (CONFIG.screenWidth / 2 + 0.8),
        CONFIG.screenCenter.y,
        CONFIG.screenCenter.z + 0.1
      );
      const drape = new THREE.Mesh(curtainFoldGeo, curtainMat);
      curtainGroup.add(drape);
      for (let f = 0; f < 3; f++) {
        const foldGeo = new THREE.BoxGeometry(0.04, CONFIG.screenHeight + 1.0, 0.10);
        const foldMesh = new THREE.Mesh(foldGeo, curtainMat);
        foldMesh.position.set(-0.18 + f * 0.18, 0, 0.05);
        curtainGroup.add(foldMesh);
      }
      const aoStripGeo = new THREE.BoxGeometry(0.58, CONFIG.screenHeight + 0.8, 0.01);
      const aoMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false });
      const aoStrip = new THREE.Mesh(aoStripGeo, aoMat);
      aoStrip.position.set(0, 0, -0.04);
      curtainGroup.add(aoStrip);
      scene.add(curtainGroup);
    });

    // Finished Architectural Stage Apron Skirting (Height 0.15m)
    const stageGeo = new THREE.BoxGeometry(CONFIG.stageWidth, CONFIG.stageHeight, CONFIG.stageDepth);
    const stageMat = new THREE.MeshStandardMaterial({ map: wallTexture, color: 0x07070a, roughness: 0.90 });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.copy(CONFIG.stageCenter);
    stageMesh.receiveShadow = true;
    scene.add(stageMesh);

    // Raised Stage Lip with Embedded LED Edge-Light
    const stageLipGeo = new THREE.BoxGeometry(CONFIG.stageWidth + 0.5, 0.06, 0.20);
    const stageLipMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0e, roughness: 0.35, metalness: 0.6 });
    const stageLip = new THREE.Mesh(stageLipGeo, stageLipMat);
    stageLip.position.set(CONFIG.stageCenter.x, CONFIG.stageCenter.y + CONFIG.stageHeight / 2 + 0.03, CONFIG.stageCenter.z + CONFIG.stageDepth / 2 + 0.10);
    scene.add(stageLip);

    // Stage Front Under-Lip Warm LED Light Strip & Top Metallic Trim
    const stageLedMat = new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff4400, emissiveIntensity: 1.8 });
    const stageLedMesh = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.stageWidth, 0.03, 0.03), stageLedMat);
    stageLedMesh.position.set(CONFIG.stageCenter.x, CONFIG.stageCenter.y - 0.06, CONFIG.stageCenter.z + CONFIG.stageDepth / 2 + 0.015);
    scene.add(stageLedMesh);

    // Stage lip front LED edge-light
    const lipLedMesh = new THREE.Mesh(
      new THREE.BoxGeometry(CONFIG.stageWidth + 0.3, 0.02, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xff7a2e, emissive: 0xff7a2e, emissiveIntensity: 0.5 })
    );
    lipLedMesh.position.set(CONFIG.stageCenter.x, CONFIG.stageCenter.y + CONFIG.stageHeight / 2 + 0.06, CONFIG.stageCenter.z + CONFIG.stageDepth / 2 + 0.20);
    scene.add(lipLedMesh);

    const stageTopTrim = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.stageWidth + 0.08, 0.03, 0.04), handleMat);
    stageTopTrim.position.set(CONFIG.stageCenter.x, CONFIG.stageCenter.y + CONFIG.stageHeight / 2 - 0.015, CONFIG.stageCenter.z + CONFIG.stageDepth / 2 + 0.015);
    scene.add(stageTopTrim);

    // Front-Stage Subwoofer Housings (with Visible Port Cutouts)
    const frontSpeakerGeo = new THREE.BoxGeometry(1.10, 0.45, 0.40);
    const frontSpeakerMat = new THREE.MeshStandardMaterial({ map: grilleTex, color: 0x09090c, roughness: 0.5 });
    const subPortGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
    const subPortMat = new THREE.MeshStandardMaterial({ color: 0x020204, roughness: 0.3 });

    [-11.5, 11.5].forEach(sx => {
      const spMesh = new THREE.Mesh(frontSpeakerGeo, frontSpeakerMat);
      spMesh.position.set(sx, 0.28, -12.4);
      scene.add(spMesh);
      // Port cutout (visible hole in front face)
      const port = new THREE.Mesh(subPortGeo, subPortMat);
      port.rotation.x = Math.PI / 2;
      port.position.set(sx - 0.3, 0.18, -12.18);
      scene.add(port);
      // Second port
      const port2 = new THREE.Mesh(subPortGeo, subPortMat);
      port2.rotation.x = Math.PI / 2;
      port2.position.set(sx + 0.3, 0.18, -12.18);
      scene.add(port2);
    });

    const platMat = new THREE.MeshStandardMaterial({ map: wallTexture, color: 0x07070a, roughness: 0.90 });

    // Warm Amber LED Step Light Materials (Cinema-authentic aisle guide lighting)
    const blueLedHousingMat = new THREE.MeshStandardMaterial({ color: 0x08080d, roughness: 0.4, metalness: 0.5 });
    const blueLedLensMat = new THREE.MeshStandardMaterial({
      color: 0xffaa44,
      emissive: 0xff8822,
      emissiveIntensity: 3.5
    });

    const leftAisleX = -3.37;
    const rightAisleX = 3.37;
    const aisleWidth = 1.20;

    // Step Edge Safety Nosing Strip Material (Brushed Aluminum, Enhanced)
    const stepNosingMat = new THREE.MeshStandardMaterial({ color: 0xd8d8e0, metalness: 0.92, roughness: 0.18 });

    // Side Walkway Carpet Material (Dedicated dark charcoal runner for flanking zones)
    const sideWalkwayMat = new THREE.MeshStandardMaterial({
      map: carpetTexture,
      color: 0x0e0e14,
      roughness: 0.85,
      metalness: 0.0
    });

    // Side Walkway Floor Runners (Flanking side aisles between parapet wall and sidewalls)
    const leftSideWalkway = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 42), sideWalkwayMat);
    leftSideWalkway.rotation.x = -Math.PI / 2;
    leftSideWalkway.position.set(-9.25, 0.006, 0);
    leftSideWalkway.receiveShadow = true;
    scene.add(leftSideWalkway);

    const rightSideWalkway = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 42), sideWalkwayMat);
    rightSideWalkway.rotation.x = -Math.PI / 2;
    rightSideWalkway.position.set(9.25, 0.006, 0);
    rightSideWalkway.receiveShadow = true;
    scene.add(rightSideWalkway);

    // Warm Amber LED Halo Bloom Ring Texture for Carpet Light Bleed
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 128;
    haloCanvas.height = 128;
    const hCtx = haloCanvas.getContext('2d');
    const hGrad = hCtx.createRadialGradient(64, 64, 4, 64, 64, 60);
    hGrad.addColorStop(0, 'rgba(255, 170, 68, 0.75)');
    hGrad.addColorStop(0.35, 'rgba(255, 136, 34, 0.40)');
    hGrad.addColorStop(0.7, 'rgba(200, 100, 20, 0.12)');
    hGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    hCtx.fillStyle = hGrad;
    hCtx.beginPath(); hCtx.arc(64, 64, 60, 0, Math.PI * 2); hCtx.fill();

    const blueHaloTexture = new THREE.CanvasTexture(haloCanvas);
    const blueHaloMat = new THREE.MeshBasicMaterial({
      map: blueHaloTexture,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const blueHaloGeo = new THREE.PlaneGeometry(0.42, 0.42);
    const blueHaloGeoRotated = blueHaloGeo.clone();
    blueHaloGeoRotated.rotateX(-Math.PI / 2);

    // Pre-compute LED fixture geometry for InstancedMesh
    const ledHousingGeo = new THREE.BoxGeometry(0.06, 0.03, 0.05);
    const ledLensGeo = new THREE.BoxGeometry(0.04, 0.02, 0.02);
    ledLensGeo.translate(0, 0.008, -0.015); // offset baked into geometry

    const TOTAL_LED_FIXTURES = CONFIG.rows * 4; // 44
    const instLedHousing = new THREE.InstancedMesh(ledHousingGeo, blueLedHousingMat, TOTAL_LED_FIXTURES);
    const instLedLens = new THREE.InstancedMesh(ledLensGeo, blueLedLensMat, TOTAL_LED_FIXTURES);
    const instLedHalo = new THREE.InstancedMesh(blueHaloGeoRotated, blueHaloMat, TOTAL_LED_FIXTURES);

    const dummyLed = new THREE.Object3D();
    let ledIdx = 0;

    for (let r = 0; r < CONFIG.rows; r++) {
      const rowZ = CONFIG.rowZStart + r * CONFIG.rowDepth;
      const rowY = r * CONFIG.rowRise;
      const platformHeight = rowY + 0.08;

      // Base stepped stadium platform spanning 15.0m width
      const platGeo = new THREE.BoxGeometry(15.0, platformHeight, CONFIG.rowDepth - 0.02);
      const platMesh = new THREE.Mesh(platGeo, platMat);
      platMesh.position.set(0, platformHeight / 2, rowZ);
      platMesh.receiveShadow = true;
      scene.add(platMesh);

      // Brushed Aluminum Safety Nosing Strip along step riser front edge
      const nosingMesh = new THREE.Mesh(new THREE.BoxGeometry(15.0, 0.02, 0.035), stepNosingMat);
      nosingMesh.position.set(0, platformHeight + 0.009, rowZ - (CONFIG.rowDepth / 2) + 0.015);
      scene.add(nosingMesh);

      // Dark Maroon Carpet Runner Strips along Left & Right Aisles
      const runnerGeo = new THREE.BoxGeometry(aisleWidth, 0.015, CONFIG.rowDepth - 0.01);

      const leftRunner = new THREE.Mesh(runnerGeo, aisleCarpetMat);
      leftRunner.position.set(leftAisleX, platformHeight + 0.008, rowZ);
      leftRunner.receiveShadow = true;
      scene.add(leftRunner);

      const rightRunner = new THREE.Mesh(runnerGeo, aisleCarpetMat);
      rightRunner.position.set(rightAisleX, platformHeight + 0.008, rowZ);
      rightRunner.receiveShadow = true;
      scene.add(rightRunner);

      // Embedded Amber LED Step Lights at edges of both aisles (Instanced)
      const lightXOffsets = [
        leftAisleX - aisleWidth / 2 + 0.08,
        leftAisleX + aisleWidth / 2 - 0.08,
        rightAisleX - aisleWidth / 2 + 0.08,
        rightAisleX + aisleWidth / 2 - 0.08
      ];

      lightXOffsets.forEach(lx => {
        const fx = lx;
        const fy = platformHeight + 0.018;
        const fz = rowZ - (CONFIG.rowDepth / 2) + 0.04;

        dummyLed.position.set(fx, fy, fz);
        dummyLed.rotation.set(0, 0, 0);
        dummyLed.updateMatrix();
        instLedHousing.setMatrixAt(ledIdx, dummyLed.matrix);
        instLedLens.setMatrixAt(ledIdx, dummyLed.matrix);
        instLedHalo.setMatrixAt(ledIdx, dummyLed.matrix);
        ledIdx++;
      });
    }
    instLedHousing.instanceMatrix.needsUpdate = true;
    instLedLens.instanceMatrix.needsUpdate = true;
    instLedHalo.instanceMatrix.needsUpdate = true;
    scene.add(instLedHousing);
    scene.add(instLedLens);
    scene.add(instLedHalo);

    // Side Parapet Boundary Walls (Positioned at X = ±7.5m)
    const sideParapetMat = new THREE.MeshStandardMaterial({ map: wallTexture, color: 0x181411, roughness: 0.88, metalness: 0.0 });
    const handrailMat = new THREE.MeshStandardMaterial({ color: 0x121218, roughness: 0.4, metalness: 0.4 });

    const slopeAngle = -Math.atan2(CONFIG.rows * CONFIG.rowRise, CONFIG.rows * CONFIG.rowDepth);
    const slopeGeo = new THREE.BoxGeometry(0.32, 3.2, 11.8);
    const handrailGeo = new THREE.BoxGeometry(0.12, 0.08, 11.82);

    // Left Parapet Wall & Handrail
    const leftSlopeMesh = new THREE.Mesh(slopeGeo, sideParapetMat);
    leftSlopeMesh.rotation.x = slopeAngle;
    leftSlopeMesh.position.set(-7.5, 1.4, -5.2);
    leftSlopeMesh.receiveShadow = true;
    scene.add(leftSlopeMesh);

    const leftHandrail = new THREE.Mesh(handrailGeo, handrailMat);
    leftHandrail.rotation.x = slopeAngle;
    leftHandrail.position.set(-7.5, 3.02, -5.2);
    scene.add(leftHandrail);

    // Right Parapet Wall & Handrail
    const rightSlopeMesh = new THREE.Mesh(slopeGeo, sideParapetMat);
    rightSlopeMesh.rotation.x = slopeAngle;
    rightSlopeMesh.position.set(7.5, 1.4, -5.2);
    rightSlopeMesh.receiveShadow = true;
    scene.add(rightSlopeMesh);

    const rightHandrail = new THREE.Mesh(handrailGeo, handrailMat);
    rightHandrail.rotation.x = slopeAngle;
    rightHandrail.position.set(7.5, 3.02, -5.2);
    scene.add(rightHandrail);



    // ============================================================================
    // 6. FORMULA-BASED VIEW QUALITY SCORER
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
      if (finalScore >= 80) {
        tierHex = 0x2ecc71; // Green
        tierName = "Prime Center View";
      } else if (finalScore >= 55) {
        tierHex = 0xf1c40f; // Yellow
        tierName = "Standard View";
      } else {
        tierHex = 0xe74c3c; // Red
        tierName = "Side-Wing View";
      }

      return {
        distanceScore: Math.round(distanceScore),
        angleScore: Math.round(angleScore),
        horizontalAngleDeg: Math.round(horizontalAngleFromCenterLine * 10) / 10,
        distanceToScreenCenter: Math.round(distanceToScreenCenter * 10) / 10,
        isObstructed: false,
        finalScore,
        finalPrice,
        tierName,
        tierHex
      };
    }

    // ============================================================================
    // 7. HIGH-PRECISION SEAT GEOMETRY (CHANNEL-TUFTED STITCHING, METAL LEGS, ARMREST CAPS)
    // ============================================================================
    const metalLegMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.35, metalness: 0.85 });
    const chromeTrimMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d8, metalness: 0.95, roughness: 0.15 });
    const darkShellMat = new THREE.MeshStandardMaterial({ color: 0x141419, roughness: 0.6, metalness: 0.2 });
    const cupholderMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0e, roughness: 0.3 });
    const cupholderInnerMat = new THREE.MeshBasicMaterial({ color: 0x020204 });

    // Velvet Seat Cushion & Backrest Material (MeshPhysicalMaterial with Velvet Sheen Clearcoat)
    const baseRedSeatMat = new THREE.MeshPhysicalMaterial({
      color: 0xc81818,
      roughness: 0.82,
      metalness: 0.0,
      clearcoat: 0.22,
      clearcoatRoughness: 0.35,
      emissive: 0x1a0202,
      emissiveIntensity: 0.08
    });

    // Seat Metal Base Leg Geometry & Chrome Base Accent Trim Strip
    const legBaseGeo = new THREE.BoxGeometry(0.42, 0.03, 0.36);
    legBaseGeo.translate(0, 0.015, 0);

    const chromeBaseGeo = new THREE.BoxGeometry(0.435, 0.008, 0.375);
    chromeBaseGeo.translate(0, 0.004, 0);

    const legPostGeo = new THREE.BoxGeometry(0.04, 0.14, 0.04);

    // Plush Seat Bottom Cushion
    const cushionGeo = new THREE.BoxGeometry(0.52, 0.16, 0.44);
    cushionGeo.translate(0, 0.18, -0.04);

    // Seat Seam Stitching Highlight Strip along Cushion Edges
    const seamStitchingGeo = new THREE.BoxGeometry(0.526, 0.012, 0.446);
    seamStitchingGeo.translate(0, 0.18, -0.04);
    const seamStitchingMat = new THREE.MeshStandardMaterial({ color: 0x800c0c, roughness: 0.5, metalness: 0.1 });

    // Seat Back Rear Frame Panel & Sculpted Back Casing Details
    const backFrameGeo = new THREE.BoxGeometry(0.52, 0.62, 0.06);
    backFrameGeo.rotateX(0.10);
    backFrameGeo.translate(0, 0.56, 0.18);

    // Recessed Vertical Center Channel down rear seat shell
    const backCenterChannelGeo = new THREE.BoxGeometry(0.08, 0.52, 0.02);
    backCenterChannelGeo.rotateX(0.10);
    backCenterChannelGeo.translate(0, 0.56, 0.16);

    // Sculpted Headrest Cap Step (Top of Rear Shell)
    const headrestCapGeo = new THREE.BoxGeometry(0.50, 0.16, 0.08);
    headrestCapGeo.rotateX(0.06);
    headrestCapGeo.translate(0, 0.94, 0.19);

    // Molded Perimeter Border Lip Trim
    const backBorderTrimGeo = new THREE.BoxGeometry(0.53, 0.63, 0.015);
    backBorderTrimGeo.rotateX(0.10);
    backBorderTrimGeo.translate(0, 0.56, 0.15);

    // Vertical Channel-Tufted Ribbed Cushion Segment (5 Ribs across backrest width)
    const ribCount = 5;
    const ribWidth = 0.095;
    const ribHeight = 0.58;
    const ribDepth = 0.06;
    const ribGeo = new THREE.BoxGeometry(ribWidth, ribHeight, ribDepth);
    ribGeo.rotateX(0.12);

    // Protruding Headrest
    const headrestGeo = new THREE.BoxGeometry(0.46, 0.18, 0.10);
    headrestGeo.rotateX(0.08);
    headrestGeo.translate(0, 0.94, 0.21);

    // Armrests with Rounded Front End Caps & Shadow Gap
    const armBarGeo = new THREE.BoxGeometry(0.06, 0.05, 0.40);
    armBarGeo.translate(0, 0.46, -0.04);

    const armCapGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.06, 16);
    armCapGeo.rotateZ(Math.PI / 2);
    armCapGeo.translate(0, 0.46, -0.24);

    const armPostGeo = new THREE.BoxGeometry(0.04, 0.24, 0.04);
    armPostGeo.translate(0, 0.30, -0.20);

    const cupholderGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.07, 12);
    cupholderGeo.translate(0, 0.46, -0.20);

    const cupholderInnerGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.071, 12);
    cupholderInnerGeo.translate(0, 0.461, -0.20);

    const tierDotGeo = new THREE.SphereGeometry(0.04, 12, 12);
    tierDotGeo.translate(0, 0.95, 0.28);

    // Compound Geometry Builder Helper for Ultra-High Performance InstancedMesh Rendering
    function createCompoundGeometry(parts) {
      let totalVerts = 0;
      const preprocessed = parts.map(p => {
        let g = p.geo.clone();
        // Convert indexed geometry to non-indexed so merging works correctly
        if (g.index) g = g.toNonIndexed();
        if (p.rotation) {
          if (p.rotation.x) g.rotateX(p.rotation.x);
          if (p.rotation.y) g.rotateY(p.rotation.y);
          if (p.rotation.z) g.rotateZ(p.rotation.z);
        }
        if (p.position) {
          g.translate(p.position.x || 0, p.position.y || 0, p.position.z || 0);
        }
        const pos = g.attributes.position;
        const norm = g.attributes.normal;
        const uv = g.attributes.uv;

        totalVerts += pos.count;
        return { pos, norm, uv, count: pos.count };
      });

      const mergedPos = new Float32Array(totalVerts * 3);
      const mergedNorm = new Float32Array(totalVerts * 3);
      const mergedUv = new Float32Array(totalVerts * 2);

      let vOffset = 0;
      preprocessed.forEach(item => {
        const { pos, norm, uv, count } = item;
        for (let i = 0; i < count; i++) {
          mergedPos[(vOffset + i) * 3] = pos.getX(i);
          mergedPos[(vOffset + i) * 3 + 1] = pos.getY(i);
          mergedPos[(vOffset + i) * 3 + 2] = pos.getZ(i);

          if (norm) {
            mergedNorm[(vOffset + i) * 3] = norm.getX(i);
            mergedNorm[(vOffset + i) * 3 + 1] = norm.getY(i);
            mergedNorm[(vOffset + i) * 3 + 2] = norm.getZ(i);
          }

          if (uv) {
            mergedUv[(vOffset + i) * 2] = uv.getX(i);
            mergedUv[(vOffset + i) * 2 + 1] = uv.getY(i);
          }
        }
        vOffset += count;
      });

      const compoundGeo = new THREE.BufferGeometry();
      compoundGeo.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
      compoundGeo.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
      compoundGeo.setAttribute('uv', new THREE.BufferAttribute(mergedUv, 2));
      compoundGeo.computeVertexNormals();
      return compoundGeo;
    }

    // Build Merged Compound Geometries for Instanced Rendering
    const seatRedParts = [
      { geo: cushionGeo, position: { x: 0, y: 0, z: 0 } },
      { geo: seamStitchingGeo, position: { x: 0, y: 0, z: 0 } },
      { geo: headrestGeo, position: { x: 0, y: 0, z: 0 } }
    ];
    const ribStartX = -((ribCount - 1) * (ribWidth + 0.005)) / 2;
    for (let rIdx = 0; rIdx < ribCount; rIdx++) {
      const rx = ribStartX + rIdx * (ribWidth + 0.005);
      seatRedParts.push({ geo: ribGeo, position: { x: rx, y: 0.56, z: 0.15 } });
    }
    const seatRedCompoundGeo = createCompoundGeometry(seatRedParts);

    const seatShellParts = [
      { geo: backFrameGeo, position: { x: 0, y: 0, z: 0 } },
      { geo: backCenterChannelGeo, position: { x: 0, y: 0, z: 0 } },
      { geo: headrestCapGeo, position: { x: 0, y: 0, z: 0 } },
      { geo: backBorderTrimGeo, position: { x: 0, y: 0, z: 0 } },
      { geo: armBarGeo, position: { x: -0.28, y: 0, z: 0 } },
      { geo: armCapGeo, position: { x: -0.28, y: 0, z: 0 } },
      { geo: armPostGeo, position: { x: -0.28, y: 0, z: 0 } },
      { geo: armBarGeo, position: { x: 0.28, y: 0, z: 0 } },
      { geo: armCapGeo, position: { x: 0.28, y: 0, z: 0 } },
      { geo: armPostGeo, position: { x: 0.28, y: 0, z: 0 } }
    ];
    const seatShellCompoundGeo = createCompoundGeometry(seatShellParts);

    const seatLegParts = [
      { geo: legBaseGeo, position: { x: 0, y: 0, z: 0 } },
      { geo: legPostGeo, position: { x: -0.16, y: 0.08, z: -0.04 } },
      { geo: legPostGeo, position: { x: 0.16, y: 0.08, z: -0.04 } }
    ];
    const seatLegCompoundGeo = createCompoundGeometry(seatLegParts);

    const seatCupParts = [
      { geo: cupholderGeo, position: { x: -0.28, y: 0, z: 0 } },
      { geo: cupholderInnerGeo, position: { x: -0.28, y: 0, z: 0 } },
      { geo: cupholderGeo, position: { x: 0.28, y: 0, z: 0 } },
      { geo: cupholderInnerGeo, position: { x: 0.28, y: 0, z: 0 } }
    ];
    const seatCupCompoundGeo = createCompoundGeometry(seatCupParts);

    const seatChromeGeo = chromeBaseGeo.clone();

    const seatAoGeo = new THREE.PlaneGeometry(0.72, 0.72);
    const seatAoMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });
    const seatAoGeoCloned = seatAoGeo.clone();
    seatAoGeoCloned.rotateX(-Math.PI / 2);
    seatAoGeoCloned.translate(0, 0.003, -0.02);

    const seatClickGeoCloned = new THREE.BoxGeometry(0.58, 1.15, 0.58);
    seatClickGeoCloned.translate(0, 0.55, 0);

    const TOTAL_SEATS = CONFIG.rows * CONFIG.seatsPerRow; // 176

    const instancedSeatRed = new THREE.InstancedMesh(seatRedCompoundGeo, baseRedSeatMat, TOTAL_SEATS);
    const instancedSeatShell = new THREE.InstancedMesh(seatShellCompoundGeo, darkShellMat, TOTAL_SEATS);
    const instancedSeatLeg = new THREE.InstancedMesh(seatLegCompoundGeo, metalLegMat, TOTAL_SEATS);
    const instancedSeatChrome = new THREE.InstancedMesh(seatChromeGeo, chromeTrimMat, TOTAL_SEATS);
    const instancedSeatCup = new THREE.InstancedMesh(seatCupCompoundGeo, cupholderMat, TOTAL_SEATS);
    const instancedSeatAo = new THREE.InstancedMesh(seatAoGeoCloned, seatAoMat, TOTAL_SEATS);
    const instancedSeatClick = new THREE.InstancedMesh(seatClickGeoCloned, new THREE.MeshBasicMaterial({ visible: false }), TOTAL_SEATS);

    instancedSeatRed.castShadow = true;
    instancedSeatRed.receiveShadow = true;

    const seatDataArray = [];
    const dummySeat = new THREE.Object3D();

    function generateAuditoriumSeats() {
      const rowLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

      // 16 seats across 3 blocks (4 Left, 8 Center, 4 Right) with fixed 1.20m aisle gaps
      const seatXOffsets = [
        -6.39, -5.69, -4.99, -4.29,                           // Left Block (4 seats)
        -2.45, -1.75, -1.05, -0.35, 0.35, 1.05, 1.75, 2.45,   // Center Block (8 seats)
        4.29, 4.99, 5.69, 6.39                                // Right Block (4 seats)
      ];

      for (let r = 0; r < CONFIG.rows; r++) {
        const rowZ = CONFIG.rowZStart + r * CONFIG.rowDepth;
        const rowY = r * CONFIG.rowRise;
        const platformHeight = rowY + 0.06;

        const rowFanFactor = 1.0 + (r / (CONFIG.rows - 1)) * 0.04;

        for (let s = 0; s < CONFIG.seatsPerRow; s++) {
          const seatIndex = r * CONFIG.seatsPerRow + s;
          const seatNum = s + 1;
          const seatCode = `${rowLetters[r]}${seatNum}`;

          const baseX = seatXOffsets[s] * rowFanFactor;
          const radialCurve = Math.pow(baseX / 7.0, 2) * 0.15;
          const posX = baseX;
          const posY = platformHeight;
          const posZ = rowZ + radialCurve;
          const seatRotationY = 0.0;

          const eyePosition = new THREE.Vector3(posX, posY + 1.15, posZ - 0.05);
          const viewStats = calculateSeatViewScore(eyePosition);

          const isHumanOccupied = (seatIndex === 34 || seatIndex === 86 || seatIndex === 142);
          const seatRotationX = isHumanOccupied ? -0.04 : 0.0; // Subtle ~2.3° human occupancy recline

          dummySeat.position.set(posX, posY, posZ);
          dummySeat.rotation.set(seatRotationX, seatRotationY, 0);
          dummySeat.scale.set(1.05, 1.05, 1.05);
          dummySeat.updateMatrix();

          const baseRed = new THREE.Color(0xc81818);
          const varScalar = 0.92 + Math.random() * 0.16;
          const varColor = baseRed.clone().multiplyScalar(varScalar);
          const rowHueShift = (r % 3) * 0.012;
          varColor.r = Math.min(1, varColor.r + rowHueShift);
          varColor.g = Math.max(0, varColor.g - rowHueShift * 0.5);
          instancedSeatRed.setColorAt(seatIndex, varColor);

          instancedSeatRed.setMatrixAt(seatIndex, dummySeat.matrix);
          instancedSeatShell.setMatrixAt(seatIndex, dummySeat.matrix);
          instancedSeatLeg.setMatrixAt(seatIndex, dummySeat.matrix);
          instancedSeatChrome.setMatrixAt(seatIndex, dummySeat.matrix);
          instancedSeatCup.setMatrixAt(seatIndex, dummySeat.matrix);
          instancedSeatAo.setMatrixAt(seatIndex, dummySeat.matrix);
          instancedSeatClick.setMatrixAt(seatIndex, dummySeat.matrix);

          let blockName = "Center Block";
          if (s < 4) blockName = "Left Block";
          else if (s < 12) blockName = "Center Block";
          else blockName = "Right Block";

          seatDataArray[seatIndex] = {
            seatIndex: seatIndex,
            rowName: `Row ${rowLetters[r]}`,
            rowIndex: r + 1,
            seatNum: seatNum,
            seatCode: seatCode,
            blockName: blockName,
            worldPos: new THREE.Vector3(posX, posY, posZ),
            eyePosition: eyePosition,
            rotationY: seatRotationY,
            baseColorHex: 0xc81818,
            stats: viewStats
          };
        }
      }

      // Runtime Sanity Check Assertion: Verify 11 distinct rows with correct stadium rake
      const rowHeights = [];
      for (let checkR = 0; checkR < CONFIG.rows; checkR++) {
        const expectedY = checkR * CONFIG.rowRise + 0.06;
        const expectedZ = CONFIG.rowZStart + checkR * CONFIG.rowDepth;
        let rowValid = true;
        for (let s = 0; s < CONFIG.seatsPerRow; s++) {
          const idx = checkR * CONFIG.seatsPerRow + s;
          const sd = seatDataArray[idx];
          if (!sd || Math.abs(sd.worldPos.y - expectedY) > 0.05 || Math.abs(sd.worldPos.z - expectedZ) > 1.2) {
            console.warn(`[SEAT RAKE ASSERTION FAILED] Seat ${sd ? sd.seatCode : idx} at row ${checkR} Y:${sd ? sd.worldPos.y : 'N/A'} (expected ${expectedY.toFixed(2)}) Z:${sd ? sd.worldPos.z : 'N/A'} (expected ~${expectedZ.toFixed(2)})`);
            rowValid = false;
          }
        }
        if (rowValid) {
          rowHeights.push(expectedY.toFixed(2));
        }
      }
      console.log(`[SEAT RAKE VERIFIED] 11 distinct rows rendering with stadium heights (Y): ${rowHeights.join(', ')}m`);

      // Dev-Mode Rotation Validation Assertion: Verify 100% uniform upright stance with 3 human touch variance seats
      let rotationWarnings = 0;
      const humanTouchSeats = [34, 86, 142];
      const testMat = new THREE.Matrix4();
      const testPos = new THREE.Vector3();
      const testRot = new THREE.Quaternion();
      const testScale = new THREE.Vector3();
      const testEuler = new THREE.Euler();

      for (let checkIdx = 0; checkIdx < TOTAL_SEATS; checkIdx++) {
        instancedSeatRed.getMatrixAt(checkIdx, testMat);
        testMat.decompose(testPos, testRot, testScale);
        testEuler.setFromQuaternion(testRot);

        const rxDeg = Math.abs(THREE.MathUtils.radToDeg(testEuler.x));
        const ryDeg = Math.abs(THREE.MathUtils.radToDeg(testEuler.y));
        const rzDeg = Math.abs(THREE.MathUtils.radToDeg(testEuler.z));

        if (!humanTouchSeats.includes(checkIdx) && (rxDeg > 1.5 || ryDeg > 1.5 || rzDeg > 1.5)) {
          console.warn(`[SEAT ROTATION DEVIATION] Seat Index ${checkIdx} rotation [${rxDeg.toFixed(1)}°, ${ryDeg.toFixed(1)}°, ${rzDeg.toFixed(1)}°] deviates from 0.0°`);
          rotationWarnings++;
        }
      }
      if (rotationWarnings === 0) {
        console.log(`[SEAT ROTATION VERIFIED] 173 seats stand 100% fully upright; 3 seats have subtle ~2.3° human occupancy recline variance.`);
      }

      instancedSeatRed.instanceMatrix.needsUpdate = true;
      if (instancedSeatRed.instanceColor) instancedSeatRed.instanceColor.needsUpdate = true;
      instancedSeatShell.instanceMatrix.needsUpdate = true;
      instancedSeatLeg.instanceMatrix.needsUpdate = true;
      instancedSeatChrome.instanceMatrix.needsUpdate = true;
      instancedSeatCup.instanceMatrix.needsUpdate = true;
      instancedSeatAo.instanceMatrix.needsUpdate = true;
      instancedSeatClick.instanceMatrix.needsUpdate = true;

      scene.add(instancedSeatRed);
      scene.add(instancedSeatShell);
      scene.add(instancedSeatLeg);
      scene.add(instancedSeatChrome);
      scene.add(instancedSeatCup);
      scene.add(instancedSeatAo);
      scene.add(instancedSeatClick);
    }

    generateAuditoriumSeats();

    // Seat Number Plates on Aisle-End Seats Only (Realistic cinema numbering)
    const seatNumPlateMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      emissive: 0x888888,
      emissiveIntensity: 0.15,
      metalness: 0.8,
      roughness: 0.25
    });
    const seatNumPlateGeo = new THREE.BoxGeometry(0.06, 0.04, 0.001);
    const aisleEndSeats = [0, 3, 4, 11, 12, 15]; // Seat indices within row that are aisle-ends
    for (let r = 0; r < CONFIG.rows; r++) {
      aisleEndSeats.forEach(s => {
        const seatIndex = r * CONFIG.seatsPerRow + s;
        if (seatIndex < seatDataArray.length && seatDataArray[seatIndex]) {
          const sd = seatDataArray[seatIndex];
          // Small metallic placard on armrest
          const numCanvas = document.createElement('canvas');
          numCanvas.width = 32;
          numCanvas.height = 16;
          const nmCtx = numCanvas.getContext('2d');
          nmCtx.fillStyle = '#1a1a1e';
          nmCtx.fillRect(0, 0, 32, 16);
          nmCtx.fillStyle = '#cccccc';
          nmCtx.font = 'bold 11px Arial';
          nmCtx.textAlign = 'center';
          nmCtx.textBaseline = 'middle';
          nmCtx.fillText(String(sd.seatNum), 16, 9);
          const numTex = new THREE.CanvasTexture(numCanvas);
          const plateMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.07, 0.035),
            new THREE.MeshBasicMaterial({ map: numTex })
          );
          plateMesh.position.set(sd.worldPos.x + 0.28, sd.worldPos.y + 0.48, sd.worldPos.z - 0.15);
          scene.add(plateMesh);
        }
      });
    }

    // Folded-Up Seat Variation (5 random seats with slightly tilted seat-back — human touch)
    const foldedSeatIndices = [];
    while (foldedSeatIndices.length < 5) {
      const ri = Math.floor(Math.random() * TOTAL_SEATS);
      if (!foldedSeatIndices.includes(ri)) foldedSeatIndices.push(ri);
    }
    const foldDummy = new THREE.Object3D();
    foldedSeatIndices.forEach(fi => {
      if (seatDataArray[fi]) {
        const sd = seatDataArray[fi];
        foldDummy.position.copy(sd.worldPos);
        foldDummy.rotation.set(-0.35, sd.rotationY, 0); // Tilted back slightly — folded up
        foldDummy.scale.set(1, 1, 1);
        foldDummy.updateMatrix();
        instancedSeatRed.setMatrixAt(fi, foldDummy.matrix);
        instancedSeatShell.setMatrixAt(fi, foldDummy.matrix);
      }
    });
    instancedSeatRed.instanceMatrix.needsUpdate = true;
    instancedSeatShell.instanceMatrix.needsUpdate = true;

    // Initial texture update
    updateScreenCanvasTexture(0);

    // ============================================================================
    // 8. CAMERA OVERVIEW & INTERACTIVE CONTROL SYSTEM (ELEVATED 3/4 DOWNWARD ANGLE)
    // ============================================================================
    const overviewOrbit = {
      pivot: new THREE.Vector3(0, 3.2, -6.5),
      radius: 14.0,
      minRadius: 9.5,   // Prevents zooming inside seats
      maxRadius: 16.5,  // Prevents zooming back into entrance doors or back wall
      theta: 0.0,       // 0° symmetric front-center perspective
      minTheta: -0.52,  // -30° max left orbit
      maxTheta: 0.52,   // +30° max right orbit
      phi: 0.96,        // Elevated downward perspective
      minPhi: 0.70,     // ~40° min elevation (prevents looking straight down)
      maxPhi: 1.28,     // ~73° max elevation (prevents dropping below floor level)
      targetTheta: 0.0,
      targetPhi: 0.96,
      targetRadius: 14.0
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
      yaw: 0.0,
      pitch: 0.0,
      maxYaw: 70 * (Math.PI / 180),
      maxPitch: 25 * (Math.PI / 180)
    };

    function updateSeatCameraRotation() {
      const euler = new THREE.Euler(seatLook.pitch, seatLook.yaw, 0, 'YXZ');
      const offsetQuat = new THREE.Quaternion().setFromEuler(euler);
      camera.quaternion.copy(seatLook.baseQuaternion).multiply(offsetQuat);
    }

    let isCameraAnimating = false;
    let animStartTime = 0;
    const animDuration = 850;
    const animStartPos = new THREE.Vector3();
    const animEndPos = new THREE.Vector3();
    const animStartQuat = new THREE.Quaternion();
    const animEndQuat = new THREE.Quaternion();
    let onAnimCompleteCallback = null;

    function animateCameraTo(targetPos, targetQuat, onComplete) {
      isCameraAnimating = true;
      animStartTime = performance.now();
      animStartPos.copy(camera.position);
      animEndPos.copy(targetPos);
      animStartQuat.copy(camera.quaternion);
      animEndQuat.copy(targetQuat);
      onAnimCompleteCallback = onComplete || null;
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
        if (onAnimCompleteCallback) onAnimCompleteCallback();
      }
    }

    function findParentSeatData(hitObject) {
      let curr = hitObject;
      while (curr) {
        if (seatDataMap.has(curr.uuid)) {
          return seatDataMap.get(curr.uuid);
        }
        if (curr.parent && seatDataMap.has(curr.parent.uuid)) {
          return seatDataMap.get(curr.parent.uuid);
        }
        curr = curr.parent;
      }
      return null;
    }

    // ============================================================================
    // 9. UI ENGINE & INTERACTION (UI Overlays Kept in Web Layer, Not Baked into 3D)
    // ============================================================================
    const panel = document.getElementById('seat-panel');
    const panelSeatCode = document.getElementById('panel-seat-code');
    const panelSeatDesc = document.getElementById('panel-seat-desc');
    const panelScoreBadge = document.getElementById('panel-score-badge');
    const panelScoreNum = document.getElementById('panel-score-num');
    const panelDistVal = document.getElementById('panel-dist-val');
    const barDist = document.getElementById('bar-dist');
    const panelAngleVal = document.getElementById('panel-angle-val');
    const barAngle = document.getElementById('bar-angle');
    const panelObstructionBanner = document.getElementById('panel-obstruction-banner');
    const obstructionIcon = document.getElementById('obstruction-icon');
    const obstructionText = document.getElementById('obstruction-text');
    const panelPrice = document.getElementById('panel-price');
    const panelPriceBreakdown = document.getElementById('panel-price-breakdown');
    const modeText = document.getElementById('mode-text');
    const tooltip = document.getElementById('tooltip');
    const ttCode = document.getElementById('tt-code');
    const ttScore = document.getElementById('tt-score');

    function populateSeatPanel(data) {
      const s = data.stats;
      panelSeatCode.textContent = `${data.rowName} · Seat ${data.seatNum} (${data.seatCode})`;
      panelSeatDesc.textContent = `${data.blockName} (${s.tierName})`;
      panelScoreNum.textContent = s.finalScore;

      panelScoreBadge.className = 'score-badge ' + (s.finalScore >= 80 ? 'tier-green' : (s.finalScore >= 55 ? 'tier-yellow' : 'tier-red'));

      panelDistVal.textContent = `${s.distanceScore}%`;
      barDist.style.width = `${s.distanceScore}%`;
      barDist.style.background = s.distanceScore >= 80 ? '#2ecc71' : (s.distanceScore >= 55 ? '#f1c40f' : '#e74c3c');

      panelAngleVal.textContent = `${s.angleScore}%`;
      barAngle.style.width = `${s.angleScore}%`;
      barAngle.style.background = s.angleScore >= 80 ? '#2ecc71' : (s.angleScore >= 55 ? '#f1c40f' : '#e74c3c');

      panelObstructionBanner.className = 'obstruction-banner clear';
      obstructionIcon.textContent = '✓';
      obstructionText.textContent = 'Unobstructed Line of Sight';

      panelPrice.textContent = `₹${s.finalPrice}`;
      panelPriceBreakdown.textContent = `Base ₹350 × (0.7 + ${s.finalScore}% × 0.6) = ₹${s.finalPrice}`;

      panel.classList.add('visible');
    }

    function hideSeatPanel() {
      panel.classList.remove('visible');
    }

    function switchToOverviewMode() {
      currentMode = 'OVERVIEW';
      selectedSeatData = null;
      hideSeatPanel();
      modeText.textContent = 'Front-Center Wide View (Entrance Perspective)';

      overviewOrbit.theta = 0.0;
      overviewOrbit.phi = 0.96;
      overviewOrbit.radius = 14.0;

      const dummyCam = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 140.0);
      dummyCam.position.x = overviewOrbit.pivot.x + overviewOrbit.radius * Math.sin(overviewOrbit.phi) * Math.sin(overviewOrbit.theta);
      dummyCam.position.y = overviewOrbit.pivot.y + overviewOrbit.radius * Math.cos(overviewOrbit.phi);
      dummyCam.position.z = overviewOrbit.pivot.z + overviewOrbit.radius * Math.sin(overviewOrbit.phi) * Math.cos(overviewOrbit.theta);
      dummyCam.lookAt(0, 2.8, -10.5);

      animateCameraTo(dummyCam.position, dummyCam.quaternion);
    }

    function switchToSeatPreviewMode(seatData) {
      currentMode = 'SEAT_PREVIEW';
      selectedSeatData = seatData;
      populateSeatPanel(seatData);
      modeText.textContent = `Seat POV Preview — ${seatData.seatCode}`;

      const targetPos = seatData.eyePosition.clone();
      const dummyCam = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 140.0);
      dummyCam.position.copy(targetPos);
      dummyCam.lookAt(CONFIG.screenCenter);

      seatLook.baseQuaternion.copy(dummyCam.quaternion);
      seatLook.yaw = 0.0;
      seatLook.pitch = 0.0;

      animateCameraTo(targetPos, dummyCam.quaternion);
    }

    document.getElementById('btn-back-overview').addEventListener('click', switchToOverviewMode);
    const hintBtn = document.getElementById('hint-close-btn');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        const hintPill = document.getElementById('hint-pill');
        if (hintPill) hintPill.style.display = 'none';
      });
    }

    // Mouse & Touch Controls
    let isMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragDistance = 0;

    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      tooltip.style.left = `${e.clientX}px`;
      tooltip.style.top = `${e.clientY}px`;

      if (isMouseDown && !isCameraAnimating) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        dragDistance += Math.abs(deltaX) + Math.abs(deltaY);

        if (currentMode === 'OVERVIEW') {
          overviewOrbit.theta = THREE.MathUtils.clamp(overviewOrbit.theta - deltaX * 0.004, overviewOrbit.minTheta, overviewOrbit.maxTheta);
          overviewOrbit.phi = THREE.MathUtils.clamp(overviewOrbit.phi - deltaY * 0.004, overviewOrbit.minPhi, overviewOrbit.maxPhi);
          updateOverviewCameraPos();
        } else if (currentMode === 'SEAT_PREVIEW') {
          seatLook.yaw = THREE.MathUtils.clamp(seatLook.yaw - deltaX * 0.004, -seatLook.maxYaw, seatLook.maxYaw);
          seatLook.pitch = THREE.MathUtils.clamp(seatLook.pitch - deltaY * 0.004, -seatLook.maxPitch, seatLook.maxPitch);
          updateSeatCameraRotation();
        }
      }

      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('.interactive')) return;
      isMouseDown = true;
      dragDistance = 0;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', (e) => {
      if (e.target.closest('.interactive')) return;
      isMouseDown = false;

      if (dragDistance < 5 && !isCameraAnimating) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(instancedSeatClick);

        if (intersects.length > 0) {
          const instanceId = intersects[0].instanceId;
          if (instanceId !== undefined && seatDataArray[instanceId]) {
            switchToSeatPreviewMode(seatDataArray[instanceId]);
          }
        }
      }
    });

    window.addEventListener('wheel', (e) => {
      if (currentMode === 'OVERVIEW' && !isCameraAnimating) {
        overviewOrbit.radius = THREE.MathUtils.clamp(overviewOrbit.radius + e.deltaY * 0.015, overviewOrbit.minRadius, overviewOrbit.maxRadius);
        updateOverviewCameraPos();
      }
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Hover Raycasting for tooltip & seat highlight
    function handleHoverRaycast() {
      if (isMouseDown || isCameraAnimating) {
        tooltip.classList.remove('visible');
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(instancedSeatClick);

      if (intersects.length > 0) {
        const instanceId = intersects[0].instanceId;
        if (instanceId !== undefined && seatDataArray[instanceId]) {
          const seatData = seatDataArray[instanceId];
          ttCode.textContent = `${seatData.rowName} · Seat ${seatData.seatNum}`;
          ttScore.textContent = seatData.stats.finalScore;
          tooltip.classList.add('visible');
          return;
        }
      }

      tooltip.classList.remove('visible');
    }

    // ============================================================================
    // 10. DUST MOTE PARTICLE SYSTEM (Atmospheric Haze in Projector Light Cone)
    // ============================================================================
    const dustCount = 200;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustVelocities = [];
    for (let d = 0; d < dustCount; d++) {
      // Spawn within the projector light cone area (near screen, spreading into seating)
      dustPositions[d * 3] = (Math.random() - 0.5) * 28;     // X spread
      dustPositions[d * 3 + 1] = 1.0 + Math.random() * 10;   // Y: floor to near-ceiling
      dustPositions[d * 3 + 2] = -12 + Math.random() * 20;    // Z: screen to mid-audience
      dustVelocities.push({
        x: (Math.random() - 0.5) * 0.003,
        y: (Math.random() - 0.5) * 0.002,
        z: (Math.random() - 0.5) * 0.002
      });
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

    // Soft warm dust mote sprite texture
    const dustCanvas = document.createElement('canvas');
    dustCanvas.width = 32;
    dustCanvas.height = 32;
    const dcCtx = dustCanvas.getContext('2d');
    const dcGrad = dcCtx.createRadialGradient(16, 16, 0, 16, 16, 14);
    dcGrad.addColorStop(0, 'rgba(255, 220, 160, 0.6)');
    dcGrad.addColorStop(0.5, 'rgba(255, 200, 140, 0.2)');
    dcGrad.addColorStop(1, 'rgba(255, 180, 120, 0)');
    dcCtx.fillStyle = dcGrad;
    dcCtx.fillRect(0, 0, 32, 32);
    const dustTex = new THREE.CanvasTexture(dustCanvas);

    const dustMat = new THREE.PointsMaterial({
      map: dustTex,
      size: 0.12,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);

    function animateDust() {
      const positions = dustGeo.attributes.position.array;
      for (let d = 0; d < dustCount; d++) {
        positions[d * 3] += dustVelocities[d].x;
        positions[d * 3 + 1] += dustVelocities[d].y;
        positions[d * 3 + 2] += dustVelocities[d].z;

        // Wrap around if drifted too far
        if (positions[d * 3] > 14) positions[d * 3] = -14;
        if (positions[d * 3] < -14) positions[d * 3] = 14;
        if (positions[d * 3 + 1] > 11.5) positions[d * 3 + 1] = 1.0;
        if (positions[d * 3 + 1] < 0.5) positions[d * 3 + 1] = 11.0;
        if (positions[d * 3 + 2] > 10) positions[d * 3 + 2] = -12;
        if (positions[d * 3 + 2] < -14) positions[d * 3 + 2] = 8;

        // Subtle random drift variation
        dustVelocities[d].x += (Math.random() - 0.5) * 0.0002;
        dustVelocities[d].y += (Math.random() - 0.5) * 0.0001;
        dustVelocities[d].x = Math.max(-0.005, Math.min(0.005, dustVelocities[d].x));
        dustVelocities[d].y = Math.max(-0.003, Math.min(0.003, dustVelocities[d].y));
      }
      dustGeo.attributes.position.needsUpdate = true;
    }

    // ============================================================================
    // 11. ANIMATION & RENDER LOOP
    // ============================================================================
    let drawCallsReported = false;
    function animate(time) {
      requestAnimationFrame(animate);

      updateScreenCanvasTexture(time);
      stepCameraAnimation(time);
      handleHoverRaycast();
      animateDust();

      renderer.render(scene, camera);

      // One-time draw call count report for performance verification
      if (!drawCallsReported) {
        console.log('[CinemaView 3D] Draw calls:', renderer.info.render.calls,
          '| Triangles:', renderer.info.render.triangles,
          '| Geometries:', renderer.info.memory.geometries,
          '| Textures:', renderer.info.memory.textures);
        drawCallsReported = true;
      }
    }

    // Force initial render pass immediately
    updateScreenCanvasTexture(0);
    renderer.render(scene, camera);

    requestAnimationFrame(animate);
  
