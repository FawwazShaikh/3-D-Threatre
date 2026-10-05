# 3D Theatre

An interactive 3D theatre hall built with Three.js. It renders a full cinema
auditorium in the browser with a stage, curved screen, proscenium curtains,
stadium seating and atmospheric lighting. You can orbit around the hall and
click any seat to preview the view from that position.

## Live Demo

- **3D Theatre Simulator:** [https://fawwazshaikh.github.io/3-D-Threatre/](https://fawwazshaikh.github.io/3-D-Threatre/)
- **Marquee Ticketing App:** [https://fawwazshaikh.github.io/3-D-Threatre/app/](https://fawwazshaikh.github.io/3-D-Threatre/app/)
- **About SCM & Platform:** [https://fawwazshaikh.github.io/3-D-Threatre/app/#/about](https://fawwazshaikh.github.io/3-D-Threatre/app/#/about)

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

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript
- Three.js (r128)
- React 18, React Router, Vite

## How to Run

Open `index.html` in a browser or use a local server such as VS Code Live Server.

## Folder Structure

```
3-D-Threatre/
├── index.html        # Main 3D theatre simulation page
├── three.min.js      # Three.js library (r128)
├── app/              # Deployed companion ticketing web app (Marquee)
├── Main-Project/     # Companion React source code
├── CHANGELOG.md      # Version specifications changelog
└── README.md
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
