import { defineArrayMember, defineField, defineType } from "sanity";

const required = <R extends { required: () => R }>(rule: R): R => rule.required();
const sourceArray = () => defineField({ name: "sources", title: "Sources", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "sourceDocument" }] })] });
const versionField = () => defineField({ name: "patternVersion", title: "Pattern version", type: "reference", to: [{ type: "patternVersion" }], validation: required });
const reviewField = () => defineField({ name: "reviewStatus", type: "string", options: { list: ["illustrative", "pending", "reviewed", "rejected"] }, validation: required });

const sourceDocument = defineType({
  name: "sourceDocument", title: "Source document", type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: required }),
    defineField({ name: "url", type: "url" }),
    defineField({ name: "content", title: "Authorized source excerpt", type: "text", rows: 8 }),
    defineField({ name: "author", type: "string" }),
    defineField({ name: "version", type: "string" }),
    defineField({ name: "locator", type: "string" }),
    defineField({ name: "licenseNotes", type: "text" }),
    defineField({ name: "reviewedAt", type: "datetime" }),
    defineField({ name: "reviewStatus", type: "string", options: { list: ["illustrative", "pending", "reviewed", "rejected"] }, validation: required }),
    defineField({ name: "supersedes", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "sourceDocument" }] })] }),
    defineField({ name: "conflicts", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "sourceDocument" }] })] }),
  ],
});

const pattern = defineType({
  name: "pattern", title: "Pattern family", type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: required }),
    defineField({ name: "slug", type: "slug", options: { source: "title" } }),
    defineField({ name: "category", type: "string" }),
    defineField({ name: "creator", type: "string" }),
    defineField({ name: "licenseStatus", type: "string" }),
  ],
});

const patternVersion = defineType({
  name: "patternVersion", title: "Pattern version", type: "document",
  fields: [
    defineField({ name: "pattern", type: "reference", to: [{ type: "pattern" }], validation: required }),
    defineField({ name: "version", type: "string", validation: required }),
    defineField({ name: "engineAdapter", type: "string" }),
    defineField({ name: "engineVersion", type: "string" }),
    defineField({ name: "requiredMeasurements", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "supportedOperationIds", type: "array", of: [defineArrayMember({ type: "string" })], validation: required }),
    defineField({ name: "reviewStatus", type: "string", options: { list: ["illustrative", "pending", "reviewed", "rejected"] }, validation: required }),
    sourceArray(),
  ],
});

const patternPiece = defineType({
  name: "patternPiece", title: "Pattern piece", type: "document",
  fields: [
    versionField(),
    defineField({ name: "pieceKey", type: "string", validation: required }),
    defineField({ name: "title", type: "string", validation: required }),
    defineField({ name: "role", type: "string" }),
    defineField({ name: "edgeIds", type: "array", of: [defineArrayMember({ type: "string" })], validation: required }),
    defineField({ name: "cutCount", type: "number", validation: (rule) => rule.integer().min(1) }),
    defineField({ name: "mirrored", type: "boolean" }),
    defineField({ name: "onFold", type: "boolean" }),
    defineField({ name: "grainNotes", type: "text" }),
    sourceArray(),
  ],
});

const seamConnection = defineType({
  name: "seamConnection", title: "Seam connection", type: "document",
  fields: [
    versionField(),
    defineField({ name: "endpoints", type: "array", validation: (rule) => rule.required().min(2), of: [defineArrayMember({
      name: "seamEndpoint", type: "object", fields: [
        defineField({ name: "piece", type: "reference", to: [{ type: "patternPiece" }], validation: required }),
        defineField({ name: "edgeId", type: "string", validation: required }),
        defineField({ name: "side", type: "string" }),
        defineField({ name: "segment", type: "string" }),
      ],
    })] }),
    defineField({ name: "relation", type: "string", options: { list: ["equal", "eased", "gathered", "unresolved"] } }),
    defineField({ name: "constraintStatus", type: "string", options: { list: ["unreviewed", "reviewed"] }, validation: required }),
    defineField({ name: "intendedEaseMm", type: "number" }),
    defineField({ name: "toleranceMm", type: "number", validation: (rule) => rule.min(0) }),
    defineField({ name: "notchNotes", type: "text" }),
    sourceArray(),
  ],
});

const adjustmentRule = defineType({
  name: "adjustmentRule", title: "Adjustment rule", type: "document",
  fields: [
    versionField(),
    defineField({ name: "operationId", type: "string", validation: required }),
    defineField({ name: "inputUnit", type: "string", validation: required }),
    defineField({ name: "reviewStatus", type: "string", options: { list: ["illustrative", "pending", "reviewed", "rejected"] }, validation: required }),
    defineField({ name: "reviewedBounds", type: "object", fields: [defineField({ name: "min", type: "number" }), defineField({ name: "max", type: "number" })] }),
    defineField({ name: "supportedLocks", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "directPieces", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "patternPiece" }] })] }),
    defineField({ name: "recheckJoins", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "seamConnection" }] })] }),
    defineField({ name: "dependentRules", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "adjustmentRule" }] })] }),
    defineField({ name: "invalidate", type: "array", of: [defineArrayMember({ type: "string" })] }),
    sourceArray(),
  ],
});

const instructionStep = defineType({
  name: "instructionStep", title: "Instruction step", type: "document",
  fields: [
    versionField(),
    defineField({ name: "stepKey", type: "string", validation: required }),
    defineField({ name: "title", type: "string", validation: required }),
    defineField({ name: "body", type: "array", of: [defineArrayMember({ type: "block" })] }),
    defineField({ name: "prerequisites", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "instructionStep" }] })] }),
    defineField({ name: "pieces", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "patternPiece" }] })] }),
    defineField({ name: "affectedBy", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "adjustmentRule" }] })] }),
    defineField({ name: "procedure", type: "reference", to: [{ type: "constructionProcedure" }] }),
    defineField({ name: "edgeIds", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "orientationNotes", type: "text" }),
    defineField({ name: "checkpoint", type: "text" }),
    sourceArray(),
  ],
});

const fabricRequirement = defineType({
  name: "fabricRequirement", title: "Fabric requirement", type: "document",
  fields: [
    versionField(),
    defineField({ name: "title", type: "string", validation: required }),
    defineField({ name: "constructionClass", type: "string" }),
    defineField({ name: "behaviorNotes", type: "text" }),
    defineField({ name: "grainDirection", type: "string" }),
    defineField({ name: "reviewStatus", type: "string", options: { list: ["illustrative", "pending", "reviewed", "rejected"] }, validation: required }),
    sourceArray(),
  ],
});

// These are shared, source-reviewed teaching records. Personal project observations
// and uploaded photographs belong in guest storage, never in Content Lake.
const garmentComponent = defineType({
  name: "garmentComponent", title: "Garment component", type: "document",
  fields: [
    defineField({ name: "componentKey", type: "string", validation: required }),
    defineField({ name: "title", type: "string", validation: required }),
    defineField({ name: "explanation", type: "text" }),
    defineField({ name: "patternRoles", type: "array", of: [defineArrayMember({ type: "string" })] }),
    reviewField(), sourceArray(),
  ],
});

const sewingTechnique = defineType({
  name: "sewingTechnique", title: "Sewing technique", type: "document",
  fields: [
    defineField({ name: "techniqueKey", type: "string", validation: required }),
    defineField({ name: "title", type: "string", validation: required }),
    defineField({ name: "purpose", type: "text" }),
    defineField({ name: "prerequisites", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "sewingTechnique" }] })] }),
    defineField({ name: "compatibleEquipment", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "equipmentClass" }] })] }),
    reviewField(), sourceArray(),
  ],
});

const equipmentClass = defineType({
  name: "equipmentClass", title: "Equipment class", type: "document",
  fields: [
    defineField({ name: "equipmentKey", type: "string", validation: required }),
    defineField({ name: "title", type: "string", validation: required }),
    defineField({ name: "capabilities", type: "array", of: [defineArrayMember({ type: "string" })] }),
    reviewField(), sourceArray(),
  ],
});

const fabricClass = defineType({
  name: "fabricClass", title: "Fabric class", type: "document",
  fields: [
    defineField({ name: "fabricKey", type: "string", validation: required }),
    defineField({ name: "title", type: "string", validation: required }),
    defineField({ name: "behaviorNotes", type: "text" }),
    defineField({ name: "grainAndNapNotes", type: "text" }),
    reviewField(), sourceArray(),
  ],
});

const constructionProcedure = defineType({
  name: "constructionProcedure", title: "Construction procedure", type: "document",
  fields: [
    defineField({ name: "procedureKey", type: "string", validation: required }),
    defineField({ name: "title", type: "string", validation: required }),
    defineField({ name: "purpose", type: "text" }),
    defineField({ name: "components", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "garmentComponent" }] })] }),
    defineField({ name: "techniques", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "sewingTechnique" }] })] }),
    defineField({ name: "applicableSteps", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "instructionStep" }] })] }),
    defineField({ name: "compatibleFabrics", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "fabricClass" }] })] }),
    defineField({ name: "compatibleEquipment", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "equipmentClass" }] })] }),
    reviewField(), sourceArray(),
  ],
});

const issuePattern = defineType({
  name: "issuePattern", title: "Possible making issue", type: "document",
  fields: [
    defineField({ name: "issueKey", type: "string", validation: required }),
    defineField({ name: "title", type: "string", validation: required }),
    defineField({ name: "observableSymptoms", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "procedures", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "constructionProcedure" }] })] }),
    defineField({ name: "steps", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "instructionStep" }] })] }),
    defineField({ name: "riskNotes", type: "text" }),
    reviewField(), sourceArray(),
  ],
});

const diagnosticTest = defineType({
  name: "diagnosticTest", title: "Diagnostic check", type: "document",
  fields: [
    defineField({ name: "testKey", type: "string", validation: required }),
    defineField({ name: "title", type: "string", validation: required }),
    defineField({ name: "makerQuestion", type: "text", validation: required }),
    defineField({ name: "howToCheck", type: "text" }),
    defineField({ name: "possibleOutcomes", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "distinguishes", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "issuePattern" }] })] }),
    defineField({ name: "riskNotes", type: "text" }),
    reviewField(), sourceArray(),
  ],
});

const remedy = defineType({
  name: "remedy", title: "Supported remedy", type: "document",
  fields: [
    defineField({ name: "remedyKey", type: "string", validation: required }),
    defineField({ name: "title", type: "string", validation: required }),
    defineField({ name: "issues", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "issuePattern" }] })] }),
    defineField({ name: "requiredTests", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "diagnosticTest" }] })] }),
    defineField({ name: "safeAction", type: "text" }),
    defineField({ name: "confirmationCheck", type: "text" }),
    defineField({ name: "irreversible", type: "boolean" }),
    defineField({ name: "riskNotes", type: "text" }),
    reviewField(), sourceArray(),
  ],
});

export const schemaTypes = [
  sourceDocument, pattern, patternVersion, patternPiece, seamConnection,
  adjustmentRule, instructionStep, fabricRequirement, garmentComponent,
  sewingTechnique, equipmentClass, fabricClass, constructionProcedure,
  issuePattern, diagnosticTest, remedy,
];
