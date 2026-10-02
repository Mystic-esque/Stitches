# Everyday Blouse Construction (Illustrative)

Illustrative construction steps for the everyday blouse: shoulder join, sleeve preparation and setting, neckline finishing, step prerequisites, shoulder-width adjustment rule (0–20 mm range), and downstream seam rechecks for the shoulders and armhole-sleeve join

This entry is explicitly **illustrative** — the everyday blouse graph is provided as a demo fixture, not a maker-approved construction plan. No seam connections carry approved constraint status; both `join.shoulders` and `join.armhole-sleeve` are marked **unreviewed** [2][5].

## Construction steps and prerequisite order

Three instruction steps are defined for `pattern-version.everyday-blouse.0-1-0`:

| Step | stepKey | Pieces involved | Prerequisite |
|---|---|---|---|
| Join the shoulders | `join-shoulders` | Front bodice, Back bodice | *(none — starting step)* |
| Finish the neckline | `finish-neckline` | Front bodice, Back bodice | Join the shoulders |
| Prepare the sleeves | `prepare-sleeves` | Sleeve | Join the shoulders |

**Join the shoulders** (`step.shoulders`) is the only prerequisite for both **Finish the neckline** and **Prepare the sleeves** [1][3][4]. Those two steps are **parallel branches** — neither depends on the other and there is no arrow or sequence between them. Finish the neckline works on the front and back bodice pieces; Prepare the sleeves works on the sleeve piece [3][4].

## Shoulder-width adjustment rule

The `rule.shoulder-width` adjustment rule applies to `pattern-version.everyday-blouse.0-1-0` with `reviewStatus: illustrative` [6].

- **Input unit:** mm-per-shoulder [6]
- **Demo UI range:** 0–20 mm [6]
- **Directly affects pieces:** Front bodice, Back bodice [6]
- **Steps affected by this rule:** Join the shoulders, Prepare the sleeves [1][4]
- **Supported lock:** neckline [6]

When the shoulder-width value is changed, the rule **invalidates** both `fabric-layout` and `instruction-selection`, meaning layout and step choices may need to be recalculated [6].

## Downstream seam rechecks

Changing the shoulder-width value triggers a recheck of two seam connections [6]:

1. **`join.shoulders`** — the shoulder seam between Front bodice and Back bodice edges [2][6]
2. **`join.armhole-sleeve`** — the armhole/cap seam connecting Front bodice (armhole edge, body side), Back bodice (armhole edge, body side), and Sleeve (cap edge, sleeve side) [5][6]

Both joins remain unreviewed at this time [2][5].

## Scope reminder

Pattern metadata and piece definitions for the everyday blouse are covered in `garment_planning/everyday_blouse`, not here. This construction graph is kept explicitly illustrative; it does not constitute a cut-ready plan.

## Sources

1. Join the shoulders — Dataset
2. Finish the neckline — Dataset
3. Prepare the sleeves — Dataset
4. join.shoulders — Dataset
5. join.armhole-sleeve — Dataset
6. rule.shoulder-width — Dataset
