---
name: street-types-speeds
description: Standards for street classifications, base design speeds, curvature calculations, intersection slow-down penalties, and lane layout rules.
---

# Street Types & Speeds Skill

This skill defines the street classification hierarchy, design speed envelopes, curvature physics, and lane layout standards for the Simple Street Planner.

## 1. Street Classification Hierarchy

| Street Type | Typical Context | Default Base Speed | Lane Width (m) | Allowed Lane Types | Typical Intersections |
|:---|:---|:---|:---|:---|:---|
| **Shared / Woonerf** | Pedestrian zone, living street | 15 km/h (4.2 m/s) | 2.5 - 3.5 m | Sidewalk, Shared, Bike | Merge, Yield |
| **Residential** | Neighborhood local access | 30 km/h (8.3 m/s) | 2.8 - 3.2 m | Sidewalk, Parking, Motor, Bike | Stop sign, Merge |
| **Collector** | Connects neighborhoods to arterials | 45 km/h (12.5 m/s) | 3.0 - 3.3 m | Sidewalk, Bike (buffered), Motor, Turn | Stop sign, Traffic Signal |
| **Arterial** | Major urban traffic thoroughfare | 60 km/h (16.7 m/s) | 3.2 - 3.5 m | Sidewalk, Protected Bike, Motor, Transit, Turn | Traffic Signal (multiphase) |
| **Boulevard** | Multi-way tree-lined transit avenue | 50 km/h (13.9 m/s) | 3.0 - 3.5 m | Sidewalk, Protected Bike, Parking, Median, Transit, Motor | Traffic Signal (multiphase) |
| **Highway / Expressway**| High-speed grade-separated corridor | 90 km/h (25.0 m/s) | 3.5 - 3.8 m | Motor, Shoulder | Merge / Ramp |

---

## 2. Curvature Physics & Safe Cornering Speed

Vehicles entering a curve must moderate their speed to maintain lateral tire traction and passenger comfort.

### Curvature Formula for Cubic Bézier Curve
Given $\mathbf{B}(t) = (x(t), y(t))$:
- 1st Derivative: $\dot{x}(t), \dot{y}(t)$
- 2nd Derivative: $\ddot{x}(t), \ddot{y}(t)$
- **Signed Curvature**:
  $$\kappa(t) = \frac{\dot{x}(t)\ddot{y}(t) - \dot{y}(t)\ddot{x}(t)}{(\dot{x}(t)^2 + \dot{y}(t)^2)^{3/2}}$$
- **Radius of Curvature**:
  $$R(t) = \frac{1}{\max(|\kappa(t)|, 10^{-5})}$$

### Maximum Safe Speed on Curve
Using lateral acceleration threshold $a_{\text{lat,max}} = \mu g$ (where $\mu \approx 0.25 - 0.40$ for comfort, $g = 9.81\text{ m/s}^2$):
$$v_{\text{safe}}(t) = \sqrt{\mu \cdot g \cdot R(t)}$$

For straight segments ($R \to \infty$), $v_{\text{safe}} \to \infty$, so target speed is bounded by the street/lane speed limit:
$$v_{\text{target}}(s) = \min(v_{\text{base}}, v_{\text{safe}}(s/L))$$

---

## 3. Intersection Rules & Signal Phase Cycle Templates

### Intersection Types
1. **Merge / Priority Yield**: Vehicles on minor lanes yield to gaps on major lanes.
2. **Stop Sign (All-Way or Two-Way)**: Vehicles decelerate to $v = 0$ at stop line, dwell for 2.0 seconds, check for clearance, then accelerate.
3. **Traffic Signal**: Managed cyclic phase controller.

### Signal Phase Cycle Templates
- **Template 1: Standard N-S / E-W Dual Phase**
  1. North-South Green (30s) $\to$ NS Yellow (3s) $\to$ All-Red (2s)
  2. East-West Green (25s) $\to$ EW Yellow (3s) $\to$ All-Red (2s)
- **Template 2: Protected Left Turns**
  1. NS Through Green (25s) $\to$ NS Left Turn Arrow Green (15s) $\to$ NS Yellow (3s) $\to$ All-Red (2s)
  2. EW Through Green (25s) $\to$ EW Left Turn Arrow Green (15s) $\to$ EW Yellow (3s) $\to$ All-Red (2s)
- **Template 3: Split Phasing**
  1. North Approach Green $\to$ South Approach Green $\to$ East Approach Green $\to$ West Approach Green.
- **Template 4: Pedestrian Scramble**
  - Motor phases followed by an exclusive all-walk pedestrian scramble phase.
