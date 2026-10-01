"use client";

import { useState } from "react";
import { selectPlanningPieces, type PieceStudyOptions } from "@/domain/planning-piece-study";
import type { CompanionCatalogCard, CompanionPlanningPiece } from "@/server/knowledge/companion-catalog";

const initial: PieceStudyOptions = { skirt: "default", waistband: "straight", frontBottom: false, sleeves: false };

function FoldDiagram({ piece }: { piece: CompanionPlanningPiece }) {
  const caption = piece.fold === "double" ? "Two folded edges" : piece.fold === "single" ? "One folded edge" : "Open fabric";
  return <div className={`fold-diagram ${piece.fold}`} aria-label={`${caption}; conceptual fold indicator, not a cutting layout`} role="img">
    <span className="fold-diagram-fabric"><i /><i /></span><span className="fold-diagram-label">{caption}</span>
  </div>;
}

export function PieceStudy({ card }: { card: CompanionCatalogCard }) {
  const [options, setOptions] = useState<PieceStudyOptions>(initial);
  const shown = selectPlanningPieces(card.pieceStudy, options);
  const mainCount = shown.filter((piece) => piece.material === "main").reduce((total, piece) => total + piece.cutCount, 0);
  return <section className="piece-study" aria-labelledby="piece-study-title">
    <div className="piece-study-intro"><div><p className="companion-kicker">02 / UNDERSTAND THE PIECES</p><h2 id="piece-study-title">The cut list, connected.</h2><p>Try documented options to see how the list changes. Fold and mirrored markings matter before a piece ever reaches the machine.</p></div><span className="piece-study-state">Source-linked study · not a pattern</span></div>
    <div className="piece-study-layout"><div className="piece-study-options"><h3>Explore an option</h3>{card.designKey === "sandy" ? <>
      <fieldset><legend>Skirt construction</legend><label><input type="radio" name="skirt-construction" checked={options.skirt === "default"} onChange={() => setOptions((current) => ({ ...current, skirt: "default" }))} /> Standard: one fold</label><label><input type="radio" name="skirt-construction" checked={options.skirt === "seamless"} onChange={() => setOptions((current) => ({ ...current, skirt: "seamless" }))} /> Seamless: double fold</label></fieldset>
      <fieldset><legend>Waistband shape</legend><label><input type="radio" name="waistband-shape" checked={options.waistband === "straight"} onChange={() => setOptions((current) => ({ ...current, waistband: "straight" }))} /> Straight</label><label><input type="radio" name="waistband-shape" checked={options.waistband === "curved"} onChange={() => setOptions((current) => ({ ...current, waistband: "curved" }))} /> Curved</label></fieldset>
      <p className="piece-study-caution">A seamless circle skirt needs enough fabric width for the selected length. This study cannot calculate that requirement or verify your fabric.</p>
    </> : <>
      <fieldset><legend>Optional pieces</legend><label><input type="checkbox" checked={options.frontBottom} onChange={(event) => setOptions((current) => ({ ...current, frontBottom: event.target.checked }))} /> Front bottom present</label><label><input type="checkbox" checked={options.sleeves} onChange={(event) => setOptions((current) => ({ ...current, sleeves: event.target.checked }))} /> Sleeves enabled</label></fieldset>
      <p className="piece-study-caution">Ribbing or finishing strips may also be needed. Their count depends on the chosen finish and is not represented in this list.</p>
    </>}</div>
      <div className="piece-study-list"><div className="piece-study-list-head"><div><span>DOCUMENTED PIECES</span><strong>{shown.length} part types · {mainCount} main-fabric cuts</strong></div><small>Not to scale</small></div><ol aria-live="polite">{shown.map((piece, index) => <li key={piece.pieceKey}><span className="piece-study-index">0{index + 1}</span><FoldDiagram piece={piece} /><div className="piece-study-piece"><strong>{piece.title}</strong><span>{piece.material === "interfacing" ? "Interfacing" : "Main fabric"} · cut {piece.cutCount}{piece.mirrored ? " mirrored" : ""}</span><small>{piece.fold === "none" ? "No fold specified" : piece.fold === "single" ? "Place on one fabric fold" : "Place on a double fold"}</small></div><span className="piece-study-review">{piece.reviewStatus} review</span></li>)}</ol></div></div>
    <div className="piece-study-footer"><p>These are source-derived cutting instructions, not pattern geometry, fabric placement, grainlines, seam allowance, or approval to cut. Generate and check the actual pattern for your measurements before using fabric.</p><a href={card.sourceUrl} target="_blank" rel="noreferrer">Check the original cutting instructions ↗</a></div>
  </section>;
}
