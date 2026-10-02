import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Match Next's tsconfig alias so route boundary tests execute the real handler.
export default defineConfig({
  test: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
