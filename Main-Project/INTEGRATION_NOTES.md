# CINEMAVIEW 3D — Integration Notes

## Source Location

| Item | Value |
|------|-------|
| **File** | `c:\Users\rayan\OneDrive\Desktop\SE-Project\index.html` |
| **Size** | 111,482 bytes · 2,919 lines |
| **Copy in project** | `Main-Project/cinemaview-original.html` |
| **Served on** | Live Server `127.0.0.1:5500` |

---

## Three.js Loading

- **Version**: Three.js **r128** (0.128.0)
- **Method**: `<script>` tag with local-first + two CDN fallbacks:
  1. `three.min.js` (local)
  2. `cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
  3. `cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js`
- **OrbitControls**: NOT used — custom orbit implementation (manual spherical coords with pointer-drag handlers, clamped theta/phi/radius)
- **No import map, no npm** — everything is a single self-contained HTML file

> **Migration**: Replace CDN `<script>` with `npm install three@0.128.0`. OrbitControls import is NOT needed since the scene uses its own orbit system.

---

## Scene Graph Inventory

### Auditorium Shell
| Element | Geometry / Method | Notes |
|---------|-------------------|-------|
| **Floor** | PlaneGeometry, MeshStandardMaterial(0x0c0c0f) | 26×32 plane, shadow receiver |
| **Walls** | BoxGeometry panels × 12+ | Left, right, back walls with acoustic panel InstancedMesh |
| **Acoustic Panels** | InstancedMesh (`instAP`) | TOTAL_AP instances, fabric material |
| **Gold Trim** (horizontal + vertical) | InstancedMesh (`instHT`, `instVT`) | Brushed gold trim strips |
| **LED accent strips** | InstancedMesh (`instLED`) | Wall-mounted LED accents |
| **Wall wash fixtures** | InstancedMesh (`instWW`, `instWWL`) | Up-lighting fixtures |
| **Ceiling** | BoxGeometry 26×0.4×32 | Dark ceiling slab |
| **Ceiling downlights** | 4× InstancedMesh (housing, bezel, disc, halo) | CEILING_LIGHTS count, warm glow |
| **Speakers** | 8 speaker enclosures (BoxGeometry + custom) | 4 left + 4 right, with driver cones |
| **Curtains** | 2 side curtains, MeshPhysicalMaterial(0x8b1a1a) | Velvet with clearcoat sheen |
| **Back crown molding** | BoxGeometry trim piece | Gold trim at rear wall top |
| **"SCREEN 1" plaque** | CanvasTexture on PlaneGeometry | Near back wall/entrance |
| **Exit signs** | 2× CanvasTexture meshes | Green illuminated signs |

### Screen
| Property | Value |
|----------|-------|
| **Aspect** | 2.35:1 anamorphic |
| **Geometry** | CylinderGeometry (slight curve, thetaLength ≈ π/3.5) |
| **Size** | ~75–80% of auditorium wall width |
| **Texture** | CanvasTexture with animated content (title card + rating bar) |
| **Screen center** | `CONFIG.screenCenter = (0, 4.8, -13.2)` |

### Seats
| Property | Value |
|----------|-------|
| **Total** | 176 (11 rows × 16 seats) |
| **Rows** | A through K (letters) |
| **Block layout** | 4 Left + 8 Center + 4 Right (aisles at positions 4–5 and 12–13) |
| **Rendering** | 7× `THREE.InstancedMesh` per seat part: red cushion, dark shell, metal legs, chrome trim, cupholders, AO plane, click hitbox |
| **Draw calls** | ~36 total |
| **Compound geometry** | `createCompoundGeometry()` helper merges multiple BufferGeometries into one for each seat part |
| **Per-instance color** | `setColorAt()` on the red cushion mesh with subtle per-seat color variation |
| **Material** | `MeshPhysicalMaterial` with velvet sheen (clearcoat 0.22) |
| **Occupied seats** | Indices 34, 86, 142 have slight recline rotation |

### Seat X-Offsets (fixed per column)
```
Left Block:   -6.39, -5.69, -4.99, -4.29
Center Block: -2.45, -1.75, -1.05, -0.35, 0.35, 1.05, 1.75, 2.45
Right Block:   4.29,  4.99,  5.69,  6.39
```

### Row fan factor: `1.0 + (rowIndex / 10) * 0.04` — rows fan outward slightly.

### Seat ID mapping
```
seatIndex = rowIndex * 16 + seatCol
seatCode  = rowLetter + (seatCol + 1)    // e.g. "J2"
```
`seatDataArray[seatIndex]` stores: worldPos, eyePosition, rotationY, baseColorHex, stats (scores).
`seatDataMap` maps mesh UUID → seatData (used for raycaster picking).

### Lights
| Light | Color | Intensity | Notes |
|-------|-------|-----------|-------|
| HemisphereLight | 0xfff5ea / 0x060608 | 0.15 | Sky warm / ground dark |
| AmbientLight | 0x121216 | 0.12 | Fill |
| DirectionalLight (main) | 0xffe5c8 | 0.35 | Warm key, casts shadows |
| PointLights (ceiling) | 0xffecd4 | per instance | Warm downlights |
| SpotLights (screen wash) | 0xfff5ea | 0.40 | Screen illumination |
| Blue LED accents | 0x2060ff | per instance | Accent strip lighting |

### Atmospheric Effects
- **Dust particles**: 300 Points with CanvasTexture sprites, additive blending, animated drift
- **Fog**: FogExp2(0x0a0604, 0.015) — subtle warm atmospheric haze

---

## View Score Formula

**Function**: `calculateSeatViewScore(eyePos)` (line ~2067)

```
distanceScore = max(0, min(100, 100 - |dist(eye, screenCenter) - 13.0| × 3.2))
angleScore    = max(0, min(100, 100 - |horizontalAngleDeg| × 1.1))
rawScore      = distanceScore × 0.5 + angleScore × 0.5
finalScore    = clamp(round(rawScore), 0, 100)
```

**Tiers**:
| Tier | Score | Color | Name |
|------|-------|-------|------|
| Prime | 80–100 | 0x2ecc71 (green) | "Prime Center View" |
| Standard | 55–79 | 0xf1c40f (yellow) | "Standard View" |
| Side | 0–54 | 0xe74c3c (red) | "Side-Wing View" |

**Pricing**:
```
finalPrice = round(350 × (0.7 + (finalScore / 100) × 0.6))
```
Range: ₹245 (worst) → ₹455 (best). Base ₹350.

**Verified**: Row J · Seat 2 → seatIndex = 9×16+1 = 145. eyePos ≈ (-5.69×1.036, 2.22+1.15, -1.92+curve). Expected score: **83** (from spec).

---

## Camera System

### Overview orbit (custom, NOT OrbitControls)
```
pivot:     (0, 3.2, -6.5)
radius:    14.0 (min 9.5, max 16.5)
theta:     0.0 (min -0.52, max 0.52) — ±30° horizontal
phi:       0.96 (min 0.70, max 1.28) — elevation angle
lookAt:    (0, 2.8, -10.5)
```
- Drag → theta/phi changes (pointer move delta × sensitivity)
- Scroll → radius changes (clamped)
- Damping via lerp toward target values

### POV (Seat Preview) mode
- Camera moves to `seatData.eyePosition` (seat pos + 1.15m Y offset)
- Camera looks at `CONFIG.screenCenter`
- Base quaternion stored; user can yaw ±70° and pitch ±25° via drag
- "Esc" or back button returns to overview via animated camera transition

### Camera Animation
- Duration: 850ms
- Easing: custom ease-in-out (cubic)
- Position + quaternion slerp interpolation
- `onAnimCompleteCallback` fires after completion

---

## Interaction Model

### Hover
- `handleHoverRaycast()` runs every frame
- Raycasts against `instancedSeatClick` (invisible hitbox mesh)
- On hit: `intersection.instanceId` → `seatDataArray[id]` → tooltip appears
- Tooltip text: `"Row J · Seat 2 — Score: 83"` format
- Hovered seat: scale pulse on the cushion mesh instance

### Click
- Click on seat → `switchToSeatPreviewMode(seatData)`
- Populates the detail panel with: seat code, block, tier, distance score, angle score, price, obstruction status
- Camera animates to the seat's eye position

### UI Overlays
- **Header HUD**: "CinemaView 3D" title, "Grand Luxury Auditorium · Premiere Night Experience" subtitle, performance stats, capacity, screen format, base ticket ₹350
- **Camera preset chip**: Shows current view name (e.g. "Front-Center Wide View (Entrance Perspective)")
- **Seat detail panel**: Slides in from bottom-right on seat selection
- **Legend**: Prime (green) / Standard (yellow) / Side (red) with colored dots
- **Hint chip**: "🎬 Click any seat for POV preview | Drag to Orbit Camera" — dismissible

---

## Known Issues to Fix During Merge (from §4B.G)

1. **Dev HUD visible**: "THREE.InstancedMesh (176 Seats | ~36 Draw Calls | 60 FPS)" is end-user visible → move behind `?debug=1`
2. **Header text wrapping**: Title + performance pill overlap, camera-preset chip overlaps header bottom edge → rebuild with flex/grid + safe gaps
3. **Separate visual language**: HUD overlays use their own dark-glass style, not Marquee tokens → unify
4. **Contrast**: Dark room + red seats → states hard to distinguish; tooltip contrast vs scene background may not meet WCAG

---

## Migration Plan

| Step | Action |
|------|--------|
| 1 | `npm install three@0.128.0` — pin exact version |
| 2 | Extract JS into modules: `createScene.js`, `seatInstances.js`, `cameraRig.js`, `picking.js`, `screenTexture.js` |
| 3 | Extract `calculateSeatViewScore()` → `lib/seatScore.js` (pure function, no THREE dependency) |
| 4 | Extract pricing → `lib/pricing.js` |
| 5 | Wrap in `SeatMap3D.jsx` — imperative init in `useEffect`, cleanup on unmount (dispose all, forceContextLoss) |
| 6 | Wire to Zustand store: seat state changes → `setColorAt()` batch per frame |
| 7 | Lazy load via `React.lazy` + `Suspense` with `SeatMap2D` fallback |
| 8 | Handle `webglcontextlost` / `webglcontextrestored` gracefully |
