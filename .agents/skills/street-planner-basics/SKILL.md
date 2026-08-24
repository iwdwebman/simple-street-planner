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
   - Generates a **5x Expanded 2D World Network** ($3200\text{ px} \times 2400\text{ px}$, $\approx 200\text{ m} \times 150\text{ m}$ scaled).
   - Manages four perimeter ingress/outgress portals at the center of each perimeter side:
     - **West Center**: Ingress (EB) & Outgress (WB)
     - **East Center**: Ingress (WB) & Outgress (EB)
     - **North Center**: Ingress (SB) & Outgress (NB)
     - **South Center**: Ingress (NB) & Outgress (SB)
   - Translates cross-sections into 2D cubic Bézier curves with arc lengths, tangents, normal vectors, and local radius of curvature $R(s)$.

3. **Physics & Kinematics Engine** (`lib/simulation/Engine.ts`, `lib/simulation/Vehicle.ts`):
   - Runs a fixed-timestep update loop ($\Delta t = 1/60$s) independent of render frame rate.
   - Simulates longitudinal car-following using the Intelligent Driver Model (IDM).
   - Enforces speed limits, curvature safety limits, stop-sign pauses, and traffic signal obedience.

4. **Demand & Routing Engine** (`lib/simulation/DemandManager.ts`):
   - Manages Origin-Destination (OD) demand matrices connecting all 4 perimeter portals (through and turning movements).
   - Modulates spawning rates using a 24-hour diurnal Time-of-Day curve.

5. **Presentation & Rendering Layer** (`components/`, `lib/renderer/`):
   - HTML5 Canvas renderer with interactive **Pan and Zoom Viewport** ($0.2\times$ to $3.0\times$), camera transformation matrices, and a floating **Minimap Radar**.
   - React UI: Streetmix-style cross-section editor, 4-Way Intersection configurator, Admin scenario editor, and Metrics HUD.

---

## 2. Coordinate System & 5x Scaling

- **World Dimensions**: $3200\text{ px} \times 2400\text{ px}$ with origin $(0, 0)$ at top-left and central crossroads at $(1600, 1200)$.
- **Scale Factor**: $1\text{ meter} \approx 16\text{ px}$.
- **Longitudinal Coordinate ($s$)**: Distance in meters along each lane segment ($s = 0$ at ingress to $s = L$ at outgress).
- **Parametric Bézier Mapping ($t \in [0, 1]$)**:
  - Position $\mathbf{p}(t) = (1-t)^3 \mathbf{p}_0 + 3(1-t)^2 t \mathbf{p}_1 + 3(1-t) t^2 \mathbf{p}_2 + t^3 \mathbf{p}_3$.
  - Heading angle $\theta(t) = \text{atan2}(y'(t), x'(t))$.

---

## 3. Four-Way Perimeter Portals

- **West Portal**: $(x=40, y=1200)$
- **East Portal**: $(x=3160, y=1200)$
- **North Portal**: $(x=1600, y=40)$
- **South Portal**: $(x=1600, y=2360)$

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
  ingressPoints: IngressPoint[];
  outgressPoints: OutgressPoint[];
  demandRoutes: DemandRoute[];
  timeOfDayProfile: TimeOfDayProfile;
  initialTimeOfDayHours: number; // 0 - 24 hours
}
```
