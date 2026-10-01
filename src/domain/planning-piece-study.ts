export type PieceStudyOptions = { skirt: "default" | "seamless"; waistband: "straight" | "curved";
  frontBottom: boolean; sleeves: boolean };

export function selectPlanningPieces<T extends { condition: string }>(pieces: readonly T[], options: PieceStudyOptions): T[] {
  return pieces.filter((piece) => piece.condition === "always" || piece.condition === options.skirt ||
    piece.condition === options.waistband || piece.condition === "front-bottom" && options.frontBottom ||
    piece.condition === "sleeves" && options.sleeves);
}
