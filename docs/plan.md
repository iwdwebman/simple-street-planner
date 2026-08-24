# Simple Street Planner: Feature & Architecture Plan

This document tracks implemented features, active improvements, and upcoming roadmap items for the Simple Street Planner application.

---

## 1. Feature Status & Roadmap

### Core Road & Streetmix Tools
- [x] Multi-lane Bézier lane graph with 2D coordinate system
- [x] **5x Expanded 2D World Map** ($3200\text{ px} \times 2400\text{ px}$)
- [x] **4-Side Perimeter Ingress & Outgress Portals** (North, South, East, West center gates)
- [x] **Pan & Zoom Viewport Navigation** (Drag to pan, scroll to zoom, on-screen controls)
- [x] **Interactive Minimap Radar HUD**
- [x] Streetmix-style cross-section interactive lane editor
- [x] Per-lane customization (lane type, width in meters/feet, travel direction)
- [x] Support for one-way and two-way street configurations
- [x] Dynamic add, delete, reorder (drag / move left / move right) lanes
- [x] Street cross-section preset templates (Complete Street, Transit Boulevard, Residential, Shared Woonerf)
- [ ] Multi-segment curved road canvas drawing tools (freeform Bézier control handles)
- [ ] Elevation / overpass / bridge lane layers

### Multi-Modal Vehicle Types & IDM Physics
- [x] Intelligent Driver Model (IDM) car-following kinematics
- [x] 7 distinct vehicle types:
  - [x] **Walker** (Pedestrian) with walking dynamics
  - [x] **Bike** (Cyclist / E-bike)
  - [x] **Car** (Sedan / Hatch / SUV)
  - [x] **Truck** (Pickup / Medium commercial)
  - [x] **Delivery** (Van / Box truck)
  - [x] **Bus** (City transit bus)
  - [x] **Semi** (Articulated 18-wheeler tractor trailer)
- [x] High-fidelity custom SVG vector sprite rendering for all 7 vehicle types
- [x] Dynamic safe cornering speed limits based on Bézier curvature ($v_{\text{safe}} = \sqrt{\mu g R}$)
- [ ] Multi-lane changing and overtaking model (MOBIL model)
- [ ] Vehicle collision and near-miss heatmaps

### Demand & Time-of-Day Routing
- [x] 4-way Perimeter Ingress & Outgress point network architecture
- [x] Origin-Destination (OD) demand matrix routing (W $\to$ E, E $\to$ W, N $\to$ S, S $\to$ N, turning flows)
- [x] Diurnal 24-hour Time-of-Day curve modulation (AM Peak, Midday, PM Peak, Night)
- [x] Interactive simulation time scrubber and speed multiplier controls (0.5x to 20x)
- [x] Admin Editor to configure demand flows and save custom play files
- [ ] Multi-day simulation schedules & seasonal traffic variations
- [ ] Trip routing through multi-intersection urban grid networks

### Intersections & Traffic Control
- [x] Support for 3 intersection control modes:
  - [x] **Merge**: Priority yield & continuous merging
  - [x] **Stop**: Stop-sign obedience with 2.0s dwell and gap clearance check
  - [x] **Lights**: Multi-phase traffic signal cycle engine
- [x] Standard signal phase cycle templates:
  - [x] Standard North-South / East-West with Yellow & All-Red clearance
  - [x] Protected Left Turns
  - [x] Split Phasing (individual approaches)
  - [x] Pedestrian Scramble (all-walk phase)
- [x] Custom signal phase editor (lane assignment per phase, green duration, yellow duration, all-red)
- [ ] Actuated / adaptive traffic signals with vehicle loop detectors
- [ ] Roundabouts and modern multi-lane traffic circles

### Storage & Scenario Management
- [x] LocalStorage persistence for active street configuration and user modifications
- [x] Play file scenario manager (Save, Load, Export JSON, Import JSON, Reset to Defaults)
- [x] Built-in scenario presets:
  - [x] *🌆 Metropolis 4-Way Grand Crossroads (5x Map)*
  - [x] *🚛 Commercial Logistics Corridor*
  - [x] *🏡 Shared Woonerf / Living Street*
- [ ] Cloud scenario sharing via URL hash / short links

### AI Customization Skills
- [x] `.agents/skills/street-planner-basics/SKILL.md`
- [x] `.agents/skills/vehicle-types/SKILL.md`
- [x] `.agents/skills/street-types-speeds/SKILL.md`
