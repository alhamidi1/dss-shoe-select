# ShoeSelect DSS: Running Shoe Selection System

A Decision Support System (DSS) prototype designed to help marathon athletes choose the best running shoe model using Multi-Attribute Decision Making (MADM) modeling.

This project implements the **Weighted Product (WP)** method and the **TOPSIS** method to evaluate 5 running shoe models across 5 competing criteria.

## Project Context
* **Course**: Decision Support and Intelligent Systems (Session 25–28)
* **Lecturer**: Dr. Sri Kusumadewi, S.Si., MT
* **Group Members**:
  1. La Ode Julfikar
  2. Muhammad Kemal Sabda Majid
  3. Abdullah Al-Hamidi (GitHub: `alhamidi1`)
  4. Mohammed Aatef

---

## 1. Problem Description & Usability
Picking a marathon running shoe is a trade-off. Better cushioning usually adds weight, higher durability can make the shoe stiffer or heavier, and premium performance comes at a higher price. This web-based DSS resolves these conflicts by taking criteria weights and scores, running them through the WP and TOPSIS mathematical models, and providing an objective recommendation.

### User Categories
* **Athlete / Runner**: Defines priorities (weights) and compares shoe options.
* **Coach / Advisor**: Uses the system to guide athletes on the best fit.
* **Admin**: Maintains the standard shoe catalog and default criteria.

---

## 2. MADM Criteria & Alternatives

### Criteria Evaluated
| Code | Criterion | Description | Type | Weight |
| --- | --- | --- | --- | --- |
| **C1** | Cushioning / Comfort | Shock absorption over long distances | Benefit (Higher is better) | 0.25 |
| **C2** | Durability | Expected mileage (kilometers) before wear | Benefit (Higher is better) | 0.20 |
| **C3** | Weight | Mass of the shoe in grams | Cost (Lower is better) | 0.20 |
| **C4** | Grip / Traction | Surface stability | Benefit (Higher is better) | 0.15 |
| **C5** | Price | Retail cost in thousands of Rupiah | Cost (Lower is better) | 0.20 |

### Alternatives (Shoe Catalog)
1. **A1 — SwiftRun Pro**: Premium all-rounder
2. **A2 — EnduroMax**: Durable trainer (Winner)
3. **A3 — LightFeather**: Ultralight racer
4. **A4 — TrailGrip X**: Grippy trail shoe
5. **A5 — BudgetPace**: Budget option

### Decision Matrix (Standard Dataset)
| Alternative | C1 Cushioning (1-5) | C2 Durability (1-5) | C3 Weight (g) | C4 Grip (1-5) | C5 Price (Rp ×1,000) |
| --- | :---: | :---: | :---: | :---: | :---: |
| **A1 — SwiftRun Pro** | 5 | 4 | 250 | 4 | 1,800 |
| **A2 — EnduroMax** | 4 | 5 | 290 | 5 | 1,500 |
| **A3 — LightFeather** | 4 | 3 | 195 | 3 | 1,650 |
| **A4 — TrailGrip X** | 3 | 4 | 270 | 5 | 1,400 |
| **A5 — BudgetPace** | 3 | 3 | 240 | 3 | 950 |

---

## 3. Mathematical Methods Applied

### Method 1: Weighted Product (WP)
WP computes the preference value for each alternative $A_i$ as:
$$S_i = \prod_{j=1}^{n} (x_{ij})^{w_j}$$
*(where $w_j > 0$ for benefit attributes, and $w_j < 0$ for cost attributes)*

The relative preference is normalized:
$$V_i = \frac{S_i}{\sum S_i}$$

### Method 2: TOPSIS
TOPSIS ranks alternatives based on their closeness to the ideal solution:
1. Construct the vector-normalized decision matrix.
2. Apply the weights to the normalized matrix.
3. Determine the positive ideal ($A^+$) and negative ideal ($A^-$) solutions.
4. Calculate Euclidean distances from the ideal ($D^+$) and worst ($D^-$) points.
5. Compute the closeness coefficient:
   $$C_i = \frac{D_i^-}{D_i^+ + D_i^-}$$

---

## 4. Calculated Results

Both methods agree on the recommended shoes:
* **WP Winner**: `A2 — EnduroMax` (Preference value $V = 0.2146$)
* **TOPSIS Winner**: `A2 — EnduroMax` (Closeness coefficient $C = 0.5438$)

### Rank Comparison
| Alternative | WP Rank | TOPSIS Rank | Match? |
| --- | :---: | :---: | :---: |
| **A2 — EnduroMax** | 1 | 1 | **Yes** |
| **A1 — SwiftRun Pro** | 2 | 2 | **Yes** |
| **A5 — BudgetPace** | 5 | 3 | No |
| **A4 — TrailGrip X** | 3 | 4 | No |
| **A3 — LightFeather** | 4 | 5 | No |

---

## 5. Technology Stack
* **Framework**: React 18 (with Vite)
* **Language**: TypeScript
* **Styling**: Vanilla CSS (Tailored HSL theme, Responsive Layouts, smooth micro-animations)
