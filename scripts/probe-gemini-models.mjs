// Read-only model discovery; no inference request or paid resource creation.
const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!key) throw new Error("Gemini API key is missing.");
const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
  headers: { "x-goog-api-key": key }, signal: AbortSignal.timeout(12_000), cache: "no-store",
});
if (!response.ok) throw new Error(`Gemini models.list returned HTTP ${response.status}.`);
const result = await response.json();
if (!Array.isArray(result.models)) throw new Error("Gemini models.list returned no model array.");
for (const candidate of ["gemini-3.8-flash", "gemini-3.7-flash"]) {
  const model = result.models.find((item) => item.name === `models/${candidate}`);
  process.stdout.write(`${candidate}: ${model?.supportedGenerationMethods?.includes("generateContent") ? "listed for generateContent" : "not listed for generateContent"}\n`);
}
process.stdout.write("This is discovery only; no inference or free-tier qualification was claimed.\n");
