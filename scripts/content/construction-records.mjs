// Authored learning summaries, not a licensed pattern or reviewed physical procedure.
// Official instructions were read on 2026-10-02. Keep the URL and scope with every record.
const ref = (_ref) => ({ _type: 'reference', _ref });
const rows = {
  sandy: [
    ['closure-seam', 'Understand the closure seam', 'always', ['skirt-default'], ['sandy.skirt/opening'], 'Right sides face each other.', 'Study the seam ending at the opening; this plan excludes seamless skirts.', 'Can you point to the opening that must stay accessible?', true],
    ['opening', 'Plan the opening', 'always', ['skirt-default'], [], 'The opening remains above the closed seam.', 'This study uses a closure below the waistband, not a zipper through it.', 'Is your intended closure outside this study? Pause rather than guess.', true],
    ['band', 'Connect skirt and straight band', 'always', ['skirt-default', 'waistband-straight', 'waistband-interfacing'], ['sandy.skirt/waist', 'sandy.waistband/attachment'], 'Interfaced band side and skirt: right sides together.', 'Study the straight-band attachment and its overlap. Curved bands, lining and gathering need another plan.', 'Identify the inside band edge and the overlap before proceeding.', true],
    ['band-finish', 'Understand the waistband finish', 'always', ['waistband-straight'], [], 'The inside band edge covers the attachment.', 'Choose a source-supported overlap fastening; do not infer dimensions from this diagram.', 'Write down the unresolved closure or allowance detail.', true],
    ['hem', 'Compare hem finishes', 'always', ['skirt-default'], ['sandy.skirt/hem'], 'Inspect the lower edge, not the waist edge.', 'The source offers binding and folded-hem approaches. This study does not select an allowance.', 'Can you explain which finish you will ask a maker to check?', true],
  ],
  tina: [
    ['marks', 'Read asymmetric markings', 'always', ['front', 'back', 'sleeve'], [], 'Sleeve x-notch belongs at the back; round notch at the front.', 'Identify the relevant source markings. Do not trim fabric from this diagram.', 'Can you distinguish the sleeve front from its back?', false],
    ['dart', 'Understand the optional dart', 'dart', ['front'], [], 'Confirm whether your chosen pattern has a dart.', 'Study its source instructions before choosing an alternative treatment.', 'Is the dart actually present in your chosen version?', true],
    ['shoulders', 'Join the shoulder relationship', 'always', ['front', 'back'], [], 'Front and back: right sides together.', 'Study both shoulders with a stretch-compatible seam.', 'Which edges meet, and which edges remain open?', true],
    ['neck', 'Follow the neckline binding', 'always', ['front', 'back'], [], 'Binding meets diagonal fronts and back neck, right sides together.', 'Study how binding ends later enter side or waist finishing.', 'Where will the binding ends be secured?', true],
    ['sleeves', 'Place the flat sleeves', 'sleeves', ['front', 'back', 'sleeve'], [], 'Right sides together; sleeve hem points toward neck opening.', 'Match x-notch to back and round notch to front.', 'Can you identify the intended notch pairing?', true],
    ['front-bottom', 'Understand overlap and lower front', 'front-bottom', ['front', 'front-bottom'], [], 'Visible outer front faces the lower-front piece.', 'Study the overlap before its lower-front seam.', 'Which front layer should remain visible?', true],
    ['sides', 'Connect sides and underarms', 'always', ['front', 'back', 'sleeve'], [], 'Front and back: right sides together.', 'Study side seams and, when present, sleeve underseams.', 'Do all included branches lead here without a missing step?', true],
    ['finishes', 'Plan waist and arm finishes', 'always', ['front', 'back', 'sleeve'], [], 'Arm finish depends on sleeves; waist has alternative finishes.', 'Resolve each finish using your selected source version.', 'Which finish and measurement still need maker review?', true],
  ],
};

export const constructionRecords = Object.entries(rows).flatMap(([designKey, steps]) => {
  const planId = `companion-making-${designKey}-v1`;
  const sourceId = `companion-source-${designKey}-20261001`;
  const stepId = (key) => `${planId}-${key}`;
  const dependencies = designKey === 'sandy' ? {
    'closure-seam': [], opening: ['closure-seam'], band: ['opening'], 'band-finish': ['band'], hem: ['band-finish'],
  } : { marks: [], dart: ['marks'], shoulders: ['dart'], neck: ['shoulders'], sleeves: ['neck'],
    'front-bottom': ['sleeves'], sides: ['front-bottom'], finishes: ['sides'] };
  const common = { candidate: ref(`companion-candidate-${designKey}-20261001`), source: ref(sourceId), reviewStatus: 'pending' };
  return [{ _id: planId, _type: 'constructionPlan', ...common, designKey, version: 1,
    title: designKey === 'sandy' ? 'Sandy: closure to hem' : 'Tina: markings to finishes',
    sourceUrl: `https://freesewing.eu/docs/designs/${designKey}/instructions/`,
    envelope: designKey === 'sandy'
      ? 'Learning plan for a non-seamless skirt, straight overlapping waistband, closure below the band; no lining, gathering, pockets or curved waistband. Not physically reviewed.'
      : 'Learning plan with explicitly confirmed dart, sleeve and lower-front branches. Binding and finishes need the selected pattern instructions. No cut-ready geometry or physical review.',
    steps: steps.map(([key]) => ref(stepId(key))) },
  ...steps.map(([key, title, condition, pieceKeys, edgeIds, orientation, action, checkpoint, diagnostic], index) => ({
    _id: stepId(key), _type: 'constructionStep', ...common, plan: ref(planId), stepKey: key, title,
    ordinal: index + 1, condition, pieceKeys, edgeIds, orientation, action, checkpoint, diagnostic,
    prerequisites: dependencies[key].map((parent) => ref(stepId(parent))),
  }))];
});
