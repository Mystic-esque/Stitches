# Tina Faux-Wrap Top Planning

Tina faux-wrap top planning candidate: front/back/sleeve piece specifications, mirrored and fold layout, 14-measurement requirements, material constraints, and pending-review status

The Tina faux-wrap top is a **pending-review** planning candidate (`companion-candidate-tina-20261001`) sourced from FreeSewing Tina top documentation (Jonathan Haas, https://freesewing.eu/docs/designs/tina/). All piece records and the candidate itself carry `reviewStatus: pending`; no part of this plan is maker-approved or cut-ready.

**Material structure:** knit only.

**Cutting caveat:** The documented cut list has mirrored fronts, a back on fold, and optional sleeve and front-bottom parts. A generated, checked pattern is still required before cutting [1].

## Required measurements (14)

| # | Measurement |
|---|-------------|
| 1 | Head circumference |
| 2 | Biceps circumference |
| 3 | Chest circumference |
| 4 | HPS to waist back |
| 5 | Neck circumference |
| 6 | Shoulder to shoulder |
| 7 | Shoulder slope |
| 8 | Waist to armpit |
| 9 | Waist to seat |
| 10 | Seat circumference |
| 11 | Waist circumference |
| 12 | Shoulder to wrist |
| 13 | Waist to underbust |
| 14 | Wrist circumference |

## Pieces

| Piece | pieceKey | Condition | Cut count | Fold | Mirrored | Material |
|-------|----------|-----------|-----------|------|----------|----------|
| Overlapping front | `front` | always | 2 | none | yes | main |
| Back | `back` | always | 1 | single | no | main |
| Sleeve | `sleeve` | `sleeves` | 2 | none | yes | main |
| Front bottom | `front-bottom` | `front-bottom` | 1 | none | no | main |

### Piece notes

- **Overlapping front** (`front`): cut 2, mirrored, no fold — applies always [2].
- **Back** (`back`): cut 1 on single fold, not mirrored — applies always [3].
- **Sleeve** (`sleeve`): cut 2, mirrored, no fold — conditional on the `sleeves` option being active [4].
- **Front bottom** (`front-bottom`): cut 1, not mirrored, no fold — conditional on the `front-bottom` option being active [5].

All pieces use main (knit) fabric. No lining or interfacing pieces are recorded in this candidate.

## Sources

1. Tina faux-wrap top — Dataset
2. Front bottom — Dataset
3. Back — Dataset
4. Overlapping front — Dataset
5. Sleeve — Dataset
6. FreeSewing Tina top documentation — Dataset

