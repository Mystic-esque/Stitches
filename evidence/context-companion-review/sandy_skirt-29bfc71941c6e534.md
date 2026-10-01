# Sandy Circle Skirt Planning

Sandy circle skirt planning candidate: piece definitions, fold/cut choices, waistband variants (curved, straight, seamless), measurement requirements, material constraints, and pending-review status

**Planning candidate:** Sandy Circle Skirt (`companion-candidate-sandy-20261001`) — source: FreeSewing Sandy Circle Skirt documentation (`companion-source-sandy-20261001`), authored by Erica Alcusa Sáez. All records are **pending review**: these are educational planning records, not maker-approved patterns or cut-ready cutting instructions.

## Required measurements

Four measurements are needed to generate this design [from `companion-candidate-sandy-20261001`]:

- Waist circumference
- Waist to floor
- Waist to hips
- Hips circumference

## Material structure

Sandy requires a **woven** material [from `companion-candidate-sandy-20261001`].

## Cut list

The cut list changes depending on which waistband variant is chosen and whether the seamless option is used. Variant conditions are mutually exclusive where noted.

| Piece | Record ID | Condition | Cut count | Fold | Material | Mirrored |
|---|---|---|---|---|---|---|
| Skirt section | `companion-piece-sandy-skirt-default-20261001` | default | 1 | single | main | no |
| Seamless skirt section | `companion-piece-sandy-skirt-seamless-20261001` | seamless | 1 | double | main | no |
| Curved waistband | `companion-piece-sandy-waistband-curved-20261001` | curved | 2 | none | main | no |
| Straight waistband | `companion-piece-sandy-waistband-straight-20261001` | straight | 1 | none | main | no |
| Waistband interfacing | `companion-piece-sandy-waistband-interfacing-20261001` | always | 1 | none | interfacing | no |

### Conditional piece logic

- **Skirt body:** choose either the default variant (1 cut, single fold) **or** the seamless variant (1 cut, double fold) — not both.
- **Waistband:** choose either the curved waistband (2 cuts, no fold) **or** the straight waistband (1 cut, no fold) — not both.
- **Waistband interfacing** is cut regardless of which waistband option is selected (condition: always), from interfacing material, 1 cut, no fold.

## Cutting caveat

The default and seamless skirt variants use different folds (single vs. double), and the waistband choice directly changes the cut list. A generated, checked layout is still required before cutting [from `companion-candidate-sandy-20261001`].

## Review status

All attached planning pieces and the candidate record carry **pending** review status. This material supports education and garment planning only; it does not constitute a maker-approved pattern or cut-ready instructions.

## Sources

1. Skirt section — Dataset
2. Sandy circle skirt — Dataset
3. FreeSewing Sandy Circle Skirt documentation — Dataset
4. Waistband interfacing — Dataset
5. Curved waistband — Dataset
6. Seamless skirt section — Dataset
7. Straight waistband — Dataset
