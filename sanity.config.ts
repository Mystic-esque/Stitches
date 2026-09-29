import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schemaTypes";

// Local editorial workspace only. The development dataset contains illustrative
// content; production remains empty until reviewed pattern material is available.
export default defineConfig({
  name: "stitches-development",
  title: "Stitches · development",
  projectId: "l4eeamth",
  dataset: "development",
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
