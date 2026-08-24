---
name: vehicle-types
description: Specifications, IDM parameters, physical dimensions, acceleration dynamics, and rendering standards for the 7 supported vehicle types (walkers, bikes, cars, trucks, delivery, buses, semis).
---

# Vehicle Types Skill

This skill defines the multi-modal vehicle classifications, Intelligent Driver Model (IDM) physics parameters, physical dimensions, and behavior profiles for all 7 supported vehicle types in the Simple Street Planner.

## 1. Supported Vehicle Classification Matrix

| Vehicle Type | Length ($L$) | Width ($W$) | Max Speed ($v_0$) | Desired Headway ($T$) | Min Jam Gap ($s_0$) | Max Accel ($a$) | Comf Decel ($b$) | Allowed Lanes |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| **Walker** (Pedestrian) | 0.5 m | 0.5 m | 1.2 m/s (4.3 km/h) | 0.8 s | 0.5 m | 0.8 m/s² | 1.2 m/s² | `sidewalk`, `crosswalk`, `shared` |
| **Bike** (Cyclist / E-bike) | 1.8 m | 0.6 m | 4.5 m/s (16.2 km/h) | 1.0 s | 1.0 m | 1.2 m/s² | 1.8 m/s² | `bike`, `motor`, `shared` |
| **Car** (Sedan / Hatch / SUV) | 4.5 m | 2.0 m | 13.9 m/s (50 km/h) | 1.4 s | 2.0 m | 2.0 m/s² | 2.5 m/s² | `motor`, `shared` |
| **Truck** (Pickup / Utility) | 6.0 m | 2.2 m | 11.1 m/s (40 km/h) | 1.6 s | 2.5 m | 1.6 m/s² | 2.2 m/s² | `motor`, `shared` |
| **Delivery** (Van / Box Truck) | 7.0 m | 2.3 m | 10.0 m/s (36 km/h) | 1.6 s | 2.5 m | 1.4 m/s² | 2.0 m/s² | `motor`, `transit`, `shared` |
| **Bus** (Transit / Commuter) | 12.0 m | 2.6 m | 9.0 m/s (32 km/h) | 2.0 s | 3.5 m | 1.0 m/s² | 1.6 m/s² | `transit`, `motor` |
| **Semi** (Articulated 18-Wheeler)| 18.0 m | 2.8 m | 8.0 m/s (29 km/h) | 2.5 s | 4.5 m | 0.7 m/s² | 1.4 m/s² | `motor` (highway/arterial) |

---

## 2. IDM (Intelligent Driver Model) Kinematics

For each vehicle $i$ behind leader $i-1$:
1. **Distance Gap**: $s_i = x_{i-1} - x_i - L_{i-1}$
2. **Speed Difference**: $\Delta v_i = v_i - v_{i-1}$
3. **Desired Dynamic Gap**:
   $$s^*(v_i, \Delta v_i) = s_0 + \max\left(0, v_i T + \frac{v_i \Delta v_i}{2 \sqrt{a b}}\right)$$
4. **Acceleration Equation**:
   $$\dot{v}_i = a \left[ 1 - \left(\frac{v_i}{v_{\text{target}}}\right)^4 - \left(\frac{s^*(v_i, \Delta v_i)}{s_i}\right)^2 \right]$$
5. **Target Speed ($v_{\text{target}}$)**:
   $$v_{\text{target}} = \min(v_0, v_{\text{speedLimit}}, v_{\text{curve}}, v_{\text{approach}})$$

---

## 3. Vehicle Rendering & Sprite Specifications

- Every vehicle type is rendered using a vector SVG sprite scaled proportional to its actual physical dimensions ($L \times W$).
- **Color Palette & Visual Cues**:
  - **Walker**: Orange/amber pedestrian icon with animated stride cycle.
  - **Bike**: Emerald green cyclist sprite with wheels and handlebars.
  - **Car**: Modern blue/cyan sedan body with roof glass and front/rear lights.
  - **Truck**: Slate/indigo heavy pickup with cargo bed.
  - **Delivery**: Violet/purple delivery box truck with distinct side panels.
  - **Bus**: Golden yellow city transit bus with multi-window strip and roof AC unit.
  - **Semi**: Ruby/crimson cab with articulated chrome-detailed long trailer.
- When rendered on curved lanes, sprites rotate smoothly to align with the tangent angle $\theta(t)$ of the Bézier curve.
