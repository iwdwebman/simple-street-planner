---
name: street-planner-basics
description: Core architecture, coordinate systems, Bézier lane graphs, simulation tick cycle, and persistence model for the Simple Street Planner.
---

# Street Planner Basics Skill

This skill provides the architectural foundation and reference standards for the Simple Street Planner application.

## 1. System Architecture

The Simple Street Planner is organized into five decoupled layers:

1. **State & Storage Layer** (`lib/storage/`, `lib/types/`):
   - Stores the active street cross-section, lane definitions, intersection configurations, and demand schedules.
   - Serializes/deserializes scenarios to `localStorage` under key `simple_street_planner_state_v1`.
   - Supports export/import of scenario JSON play files.

2. **Graph & Geometry Layer** (`lib/simulation/Network.ts`, `lib/simulation/Curvature.ts`):
   - Translates high-level Streetmix cross-section lane arrays into 2D cubic Bézier curves.
   - Computes arc lengths, tangents, normal vectors, and local radius of curvature $R(s)$.

3. **Physics & Kinematics Engine** (`lib/simulation/Engine.ts`, `lib/simulation/Vehicle.ts`):
   - Runs a fixed-timestep update loop ($\Delta t = 1/60$s) independent of render frame rate.
   - Simulates longitudinal car-following using the Intelligent Driver Model (IDM).
   - Enforces speed limits, curvature safety limits, stop-sign pauses, and traffic signal obedience.

4. **Demand & Routing Engine** (`lib/simulation/DemandManager.ts`):
   - Manages Ingress (spawning) and Outgress (sink/exit) points.
   - Computes dynamic vehicle spawning rates from Origin-Destination (OD) demand matrices modulated by a 24-hour diurnal Time-of-Day curve.

5. **Presentation & Rendering Layer** (`components/`, `lib/renderer/`):
   - HTML5 Canvas renderer for asphalt, road markings, crosswalks, signals, and vehicle sprites.
   - React UI: Streetmix-style cross-section editor, Intersection configurator, Admin scenario editor, and Metrics HUD.

---

## 2. Coordinate System & Scaling

- **Canvas Dimensions**: Coordinate space is normalized to pixels where:
  - Standard Lane Width: $3.0\text{ m} \approx 40 - 60\text{ px}$.
  - Scale Factor: $1\text{ meter} \approx 15\text{ px}$.
- **Longitudinal Coordinate ($s$)**:
  - Distance in meters from the start of a lane segment ($s = 0$) to its end ($s = L$).
- **Parametric Bézier Mapping ($t \in [0, 1]$)**:
  - For a lane of length $L$, $t = s / L$.
  - Position $\mathbf{p}(t) = (1-t)^3 \mathbf{p}_0 + 3(1-t)^2 t \mathbf{p}_1 + 3(1-t) t^2 \mathbf{p}_2 + t^3 \mathbf{p}_3$.
  - Heading angle $\theta(t) = \text{atan2}(y'(t), x'(t))$.

---

## 3. Two-Way vs. One-Way Road Conventions

- **One-Way Road**:
  - All travel lanes share the same travel direction (`forward`).
  - Ingress points are located on the left edge ($x = x_{\min}$), outgress points on the right edge ($x = x_{\max}$).
- **Two-Way Road**:
  - Top half (or Eastbound/Northbound) travel lanes move `forward`.
  - Bottom half (or Westbound/Southbound) travel lanes move `reverse` with inverted Bézier curve control points ($\mathbf{p}_0 \leftrightarrow \mathbf{p}_3$).
  - Separated by center turn lanes, medians, or double yellow divider lines.

---

## 4. LocalStorage & Play File Schema

```typescript
export interface PlayFile {
  id: string;
  name: string;
  description: string;
  version: string;
  street: StreetConfig;
  intersections: IntersectionConfig[];
  demand: DemandScheduleConfig;
  timeOfDay: number; // 0 - 24 hours
}
```

When modifying the engine or UI, always maintain backward compatibility with saved play files in `localStorage`.
