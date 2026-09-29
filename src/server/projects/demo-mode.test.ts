import { describe, expect, it } from "vitest";
import { assertDemoMutationAllowed } from "./demo-mode";

describe("demo mutation mode guard", () => {
  it("allows only explicit fixture mode", () => {
    expect(() => assertDemoMutationAllowed("fixture")).not.toThrow();
    expect(() => assertDemoMutationAllowed("sanity-development")).toThrow("disabled");
    expect(() => assertDemoMutationAllowed("sanity-reviewed")).toThrow("disabled");
    expect(() => assertDemoMutationAllowed("unrecognized")).toThrow("disabled");
  });
});
