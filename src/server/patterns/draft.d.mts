export type SandyInput = { measurements: { waist: number; hips: number; waistToFloor: number; waistToHips: number }; lengthRatio: number; seamAllowanceMm: number; waistbandShape: "straight" | "curved" };
export function draftSandy(input: SandyInput): unknown;
export const engineIdentity: { engine: string; version: string; design: string; designVersion: string };
