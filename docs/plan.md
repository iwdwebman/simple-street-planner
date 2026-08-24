# Simple Street Planner: Feature & Architecture Plan

This document tracks implemented features, active improvements, and upcoming roadmap items for the Simple Street Planner application.

---

## 1. Feature Status & Roadmap

### Core Road & Streetmix Tools
- [x] Multi-lane Bézier lane graph with 2D coordinate system
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
- [x] Ingress (origin/spawn) and Outgress (sink/exit) point network architecture
- [x] Origin-Destination (OD) demand matrix routing
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
  - [x] *Downtown Complete Street*
  - [x] *Commercial Logistics Corridor*
  - [x] *Suburban Arterial with Turn Bays*
  - [x] *Shared Woonerf / Festival Street*
- [ ] Cloud scenario sharing via URL hash / short links

### AI Customization Skills
- [x] `.agents/skills/street-planner-basics/SKILL.md`
- [x] `.agents/skills/vehicle-types/SKILL.md`
- [x] `.agents/skills/street-types-speeds/SKILL.md`

---

## 2. What Was Added in This Phase

1. **7 Vehicle Types & Calibrated Kinematics**:
   - Expanded vehicle model from basic 4 to full 7 types (Walkers, Bikes, Cars, Trucks, Delivery vans, Buses, Semis) with exact physical dimensions, IDM parameters, and dedicated SVG sprites.
2. **Streetmix-Style Interactive Cross-Section Editor**:
   - Visual lane strips with live width adjustments, direction toggles (EB/WB/NB/SB), reordering, add/remove lane drawer, and street classification selection.
3. **Curvature Physics Engine**:
   - First and second derivative Bézier geometry engine calculating curvature $\kappa(t)$, radius $R(t)$, and max safe curve speed $v_{\text{safe}}(t)$ to simulate realistic deceleration in curves.
4. **Time-of-Day OD Demand Manager & Admin Editor**:
   - Configurable ingress/outgress OD demand matrix with 24-hour diurnal profile curve and real-time clock scrubber.
5. **Intersection Control Suite**:
   - Integrated Merge, Stop-sign, and Multi-Phase Traffic Signal engine with preset patterns (N-S/E-W, Protected Turns, Split Phase, Scramble) and custom phase timings.
6. **Persistence & Play Files**:
   - LocalStorage auto-saving and JSON scenario import/export.
7. **Customization Skills & Roadmap**:
   - Added 3 AI skills for future developer/agent sessions and this roadmap document.

---

## 3. What is Needed Next (Upcoming Milestones)

1. **Multi-Street Urban Grid**:
   - Connecting multiple street segments into a 2D network with T-junctions, 4-way intersections, and roundabouts.
2. **Lane Changing & Overtaking (MOBIL Algorithm)**:
   - Allow vehicles to assess incentive and safety criteria to switch into faster/emptier adjacent lanes.
3. **Environmental & Acoustic Impact Metrics**:
   - Noise level estimation (dB), carbon emissions ($g\text{ CO}_2/\text{km}$), and pedestrian comfort indices.
4. **3D / Isometric Street Visualizer**:
   - Optional 3D/isometric view mode utilizing Three.js / WebGL.
