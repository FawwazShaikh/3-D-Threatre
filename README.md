# 3D Theatre & Marquee Cinema Platform

An interactive 3D theatre simulation and companion cinema ticketing web application built with Three.js, React, and Vite. The platform delivers an end-to-end movie discovery and auditorium experience in the browser: browse current blockbusters and live shows, inspect seat maps, and launch a photorealistic 3D cinema hall to preview exact eye-level sightlines, viewing angles, and dynamic pricing before booking.

This repository serves as a case study for a college Software Configuration Management (SCM) lab experiment, demonstrating structured feature branching, specification changes, tag versioning, and merge conflict resolution using Git.

## Live Demo

- **Marquee Booking App (Landing Page):** [https://fawwazshaikh.github.io/3-D-Threatre/](https://fawwazshaikh.github.io/3-D-Threatre/)
- **3D CinemaView Theatre Simulator:** [https://fawwazshaikh.github.io/3-D-Threatre/theatre.html](https://fawwazshaikh.github.io/3-D-Threatre/theatre.html)
- **About SCM & Architecture Page:** [https://fawwazshaikh.github.io/3-D-Threatre/#/about](https://fawwazshaikh.github.io/3-D-Threatre/#/about)
- **Movie & Event Listings:** [https://fawwazshaikh.github.io/3-D-Threatre/#/listings](https://fawwazshaikh.github.io/3-D-Threatre/#/listings)

## Platform Overview

The project comprises two tightly integrated components:

### 1. Marquee Ticketing Web App
- Modern, high-conversion movie discovery interface with 3D card carousel.
- Categorized showtime listings for Movies, Theatrical Plays, Live Events, and Sports.
- Real-time "Seat Sync" concept allowing group seat selection.
- Multi-step checkout flow (Event Selection → Seat Map → Checkout → Booking Confirmation).

### 2. CinemaView 3D Auditorium Simulator
- Fully interactive Three.js 3D auditorium modeled to realistic commercial multiplex scale.
- 224 stadium-raked seats across 14 rows (A through N) with dual side aisles and centre aisle division.
- Curved 2.35:1 anamorphic cinema screen (18.0m wide × 7.66m high) with live animated feature presentation canvas.
- Deep proscenium stage flanked by warm gold velvet acoustic curtains.
- Cinematic lighting rig: directional key light, ambient fill, warm amber wall wash sconces, and 3 focused stage spotlights.
- Floating dust mote particle simulation for authentic projector beam atmosphere.

## Interactive Controls & Navigation

| Control | Action |
|---|---|
| **Mouse Left-Click + Drag** | Orbit camera around the auditorium (Overview) or look around 360° (Seat POV) |
| **Mouse Scroll Wheel** | Smooth zoom in / zoom out |
| **W / A / S / D or Arrow Keys** | Walk through and rotate viewpoint dynamically |
| **Click Any Seat Cushion** | Smoothly flies camera to exact eye-level perspective of that seat |
| **"← Back to Grand Overview"** | Animates camera back to elevated entrance angle |
| **"ℹ️ About" Header Button** | Opens detailed modal explaining version evolution & seat score factors |
| **"🎟️ Movie Booking App →"** | Switches to the Marquee ticket booking application |

## Features

- 224 stadium-raked seats across 14 rows with colour-coded view quality scoring
- Curved 2.35:1 anamorphic cinema screen with animated visuals
- Proscenium curtain folds flanking the screen (gold velvet)
- Atmospheric lighting with warm amber wall wash, ceiling downlights, and stage spotlights
- Seat click POV preview with distance and angle scoring
- Dynamic ticket pricing based on seat view quality
- Dust mote particle system for projector haze effect
- Detailed auditorium architecture (walls, doors, speakers, EXIT signs)
- Orbit camera controls and WASD/Arrow keys walkthrough navigation
- Integrated About modal and companion movie ticketing web app

## Technical Architecture & Optimization

- **Instanced Mesh Pipeline (`THREE.InstancedMesh`)**: Rather than creating individual meshes for every seat, the scene merges seat geometries into 7 distinct instanced parts (cushion, back shell, legs, chrome trim, cupholders, contact shadow, and raycast hitbox). The full 224-seat hall renders in ~36 draw calls at a steady 60 FPS.
- **Seat View Quality Scoring Algorithm**:
  - **Distance Score**: Evaluates viewer distance relative to the acoustic and visual focus sweet spot (13.0m).
  - **Angle Score**: Calculates the horizontal viewing angle deviation from the screen center normal.
  - Overall quality score (0–100) is colour-coded across tiers: **Prime View** (green, 80–100), **Standard View** (yellow, 55–79), and **Side View** (red, 0–54).
- **Dynamic Pricing Engine**:
  $$\text{Calculated Price} = \text{Base Price (₹350)} \times (0.7 + \text{Quality Score} \times 0.6)$$
- **SPA Routing & Assets**: Built with Vite and React Router (`HashRouter`) using relative base `./` paths for zero-configuration hosting on static web servers and GitHub Pages.

## Tech Stack

- **3D Graphics & Engine**: Three.js (r128), WebGL, HTML5 Canvas API
- **Frontend Application**: React 18, Vite, Framer Motion, Vanilla CSS (Dark Multiplex theme)
- **SCM & Deployment**: Git, GitHub Pages

## How to Run Locally

### 1. Run the Entire Project (Static / Zero-Install)
Open `index.html` (Marquee landing) or `theatre.html` (3D Theatre) directly in any modern browser, or launch with Python:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000/` or `http://localhost:8000/theatre.html`.

### 2. Run the React Development Server
```bash
cd Main-Project
npm install
npm run dev
```

### 3. Build Production Assets
```bash
npm --prefix Main-Project run build
```

## Folder Structure

```
3-D-Threatre/
├── index.html        # Main landing page (Marquee movie ticketing app)
├── theatre.html      # Interactive 3D cinema auditorium simulator
├── three.min.js      # Three.js library (r128)
├── assets/           # Bundled web app scripts and stylesheets
├── app/              # Companion ticketing web app build
├── Main-Project/     # Companion React source code
│   ├── src/          # React components, hooks, routes, data
│   ├── package.json  # Dependencies and build scripts
│   └── vite.config.js# Vite configuration (base: './')
├── CHANGELOG.md      # Version specifications changelog
└── README.md         # Project documentation
```

## SCM Experiment

**Aim:** Change specifications and make different versions of the project using
Git as an SCM tool.

The project is versioned with Git using feature branches and tags. Each version
introduces different spec changes (seating, lighting, colours, controls) and
the branches are merged back into master to demonstrate conflict resolution.

### Branches

- `master` — baseline and final merged code
- `version1` — structure changes (seats, stage, background)
- `version2` — atmosphere changes (lighting, curtains, controls, screen)

### Tags

- `v1.0` — original theatre baseline
- `v1.1` — version 1 with seating and stage changes
- `v2.0` — version 2 with lighting and controls
- `v1.1-merged` — after merging version1 into master
- `v2.0-merged` — after merging version2 into master

## Version History

| Item | v1.0 | v1.1 | v2.0 |
|------|------|------|------|
| Seat Rows | 11 (176 seats) | 14 (224 seats) | 14 (224 seats) |
| Aisle Layout | 2 side aisles | 2 side aisles + centre gap | 2 side aisles + centre gap |
| Seat Colour | Red (`#c81818`) | Blue (`#1848b8`) | Blue (`#1848b8`) |
| Stage Size | 18.5 × 1.0 (h: 0.15) | 22.0 × 2.5 (h: 0.40) | 22.0 × 2.5 (h: 0.40) |
| Curtain Colour | Dark Maroon (`#1a0505`) | Dark Maroon (`#1a0505`) | Gold (`#b8860b`) |
| Lighting | Basic ambient + key light | Basic ambient + key light | Dark ambience + 3 stage spotlights |
| Background | Dark (`#060608`) | Light grey (`#cccccc`) | Dark night (`#030a16`) |
| Controls | Fixed overview drag | Fixed overview drag | Orbit controls + keyboard walk-through |
| Movie Screen | Default visual | Default visual | Feature presentation banner overlay |
| Version Label | v1.0 | v1.1 | v2.0 |
