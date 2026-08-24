---
name: vehicle-types
description: Specifications, IDM parameters, physical dimensions, acceleration dynamics, driver heterogeneity, and clumping physics for the 7 supported vehicle types.
---

# Vehicle Types Skill

This skill provides kinematic specifications, Intelligent Driver Model (IDM) parameter calibrations, driver heterogeneity, and platooning/clumping dynamics for the 7 multi-modal vehicle types supported in the Simple Street Planner.

---

## 1. Multi-Modal Vehicle Specifications

| Vehicle Type | Mode Label | Category | Length ($L$) | Width ($W$) | Base Speed ($v_0$) | $a_{\text{max}}$ | $b_{\text{comf}}$ | Time Headway ($T$) | Standstill Gap ($s_0$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`walker`** | Walker (Pedestrian) | Micro-mobility | $0.6\text{ m}$ | $0.6\text{ m}$ | $4.5\text{ km/h}$ ($1.25\text{ m/s}$) | $1.0\text{ m/s}^2$ | $1.4\text{ m/s}^2$ | **$0.45\text{ s}$** | **$0.35\text{ m}$** |
| **`bike`** | Cyclist / E-Bike | Micro-mobility | $1.8\text{ m}$ | $0.7\text{ m}$ | $16.0\text{ km/h}$ ($4.5\text{ m/s}$) | $1.4\text{ m/s}^2$ | $2.0\text{ m/s}^2$ | **$0.65\text{ s}$** | **$0.70\text{ m}$** |
| **`car`** | Passenger Car | Motor Vehicle | $4.6\text{ m}$ | $2.0\text{ m}$ | $50.0\text{ km/h}$ ($13.9\text{ m/s}$) | $2.2\text{ m/s}^2$ | $2.5\text{ m/s}^2$ | $1.3\text{ s}$ | $1.8\text{ m}$ |
| **`truck`** | Light / Medium Truck | Freight / Work | $6.2\text{ m}$ | $2.2\text{ m}$ | $40.0\text{ km/h}$ ($11.1\text{ m/s}$) | $1.5\text{ m/s}^2$ | $2.2\text{ m/s}^2$ | $1.5\text{ s}$ | $2.2\text{ m}$ |
| **`delivery`**| Delivery Van | Freight / Logistics | $6.8\text{ m}$ | $2.3\text{ m}$ | $35.0\text{ km/h}$ ($9.7\text{ m/s}$) | $1.5\text{ m/s}^2$ | $2.0\text{ m/s}^2$ | $1.4\text{ s}$ | $2.0\text{ m}$ |
| **`bus`** | City Transit Bus | Public Transit | $12.5\text{ m}$ | $2.6\text{ m}$ | $32.0\text{ km/h}$ ($8.9\text{ m/s}$) | $1.0\text{ m/s}^2$ | $1.6\text{ m/s}^2$ | $1.8\text{ s}$ | $3.0\text{ m}$ |
| **`semi`** | 18-Wheeler Freight | Heavy Freight | $17.5\text{ m}$ | $2.8\text{ m}$ | $28.0\text{ km/h}$ ($7.8\text{ m/s}$) | $0.7\text{ m/s}^2$ | $1.4\text{ m/s}^2$ | $2.2\text{ s}$ | $4.0\text{ m}$ |

---

## 2. Driver Heterogeneity & Randomization

Every spawned vehicle instance has randomized personality attributes to prevent unnatural robotic spacing:
1. **Desired Speed ($v_0$)**: Varies by $\pm 18\%$ from base desired speed.
2. **Time Headway ($T$)**: Varies by $\pm 15\%$ reflecting aggressive vs. cautious driving.
3. **Acceleration Capability ($a_{\text{max}}$)**: Varies by $\pm 15\%$.
4. **Natural Entry Speed**: Spawned vehicles arrive with initial cruising speed ($65\% - 95\%$ of target speed) instead of a dead stop.

---

## 3. Stochastic Poisson Arrivals & Group Clumping

Arrivals follow an exponential inter-arrival distribution $\Delta t \sim \text{Exp}(\lambda)$ where $\lambda = \frac{\text{baseRate}}{60} \times \text{diurnalFactor}$.

### Multi-Agent Burst Clumping:
- **Walkers**: $45\%$ probability of spawning in tight walking groups of 2 to 4 people.
- **Cyclists**: $35\%$ probability of spawning in close commuter packs of 2 to 3 cyclists.
- **Cars**: $20\%$ probability of spawning in close 2-vehicle platoons.
- **Tight Micro-Mobility Clearances**: Walkers require only $0.9\text{ m}$ spawn clearance; cyclists require $2.2\text{ m}$ clearance.
