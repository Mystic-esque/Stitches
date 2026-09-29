import { describe, expect, it } from "vitest";
import type { Content, GenerateContentParameters, GenerateContentResponse } from "@google/genai";
import { createGeminiSession } from "./gemini-session";

describe("Google SDK session boundary", () => {
  it("returns tool calls and replays the exact signed model content with matching feedback ID", async () => {
    const requests: GenerateContentParameters[] = [];
    const signedContent = { role: "model", parts: [{ functionCall: { id: "call-1", name: "get_pattern_context", args: {} }, thoughtSignature: "opaque-signature" }] };
    const generate = async (parameters: GenerateContentParameters) => {
      requests.push(parameters);
      return requests.length === 1
        ? { candidates: [{ content: signedContent }], functionCalls: [{ id: "call-1", name: "get_pattern_context", args: {} }] } as unknown as GenerateContentResponse
        : { candidates: [{ content: { role: "model", parts: [{ text: "Please choose an amount." }] } }], functionCalls: [], text: "Please choose an amount." } as unknown as GenerateContentResponse;
    };
    const model = createGeminiSession({ apiKey: "test-key", model: "gemini-3.8-flash", request: "More shoulder room", generate });
    expect((await model.next()).calls).toEqual([{ id: "call-1", name: "get_pattern_context", args: {} }]);
    expect((await model.next({ id: "call-1", name: "get_pattern_context", response: { sourceIds: ["source.demo"] } })).text).toBe("Please choose an amount.");
    const history = requests[1]?.contents as Content[];
    expect(Array.isArray(history)).toBe(true);
    if (!Array.isArray(history)) throw new Error("Expected conversation history");
    expect(history[1]).toBe(signedContent);
    expect(history[2]?.parts?.[0]?.functionResponse?.id).toBe("call-1");
    expect(requests[0]?.config?.httpOptions?.retryOptions?.attempts).toBe(1);
    expect(requests[0]?.config?.maxOutputTokens).toBe(384);
  });

  it("classifies quota errors without leaking provider messages", async () => {
    const model = createGeminiSession({
      apiKey: "test-key", model: "gemini-3.8-flash", request: "More room",
      generate: async () => { throw { status: 429, message: "secret-provider-detail" }; },
    });
    await expect(model.next()).rejects.toMatchObject({ code: "quota", message: expect.not.stringContaining("secret-provider-detail") });
  });

  it("refuses feedback for a different model call", async () => {
    const model = createGeminiSession({
      apiKey: "test-key", model: "gemini-3.8-flash", request: "More room",
      generate: async () => ({
        candidates: [{ content: { role: "model", parts: [{ functionCall: { id: "expected", name: "get_pattern_context", args: {} } }] } }],
        functionCalls: [{ id: "expected", name: "get_pattern_context", args: {} }],
      }) as unknown as GenerateContentResponse,
    });
    await model.next();
    await expect(model.next({ id: "wrong", name: "get_pattern_context", response: {} })).rejects.toMatchObject({ code: "protocol" });
  });

  it("rejects unqualified model names and missing keys before any call", () => {
    expect(() => createGeminiSession({ apiKey: "", model: "gemini-3.8-flash", request: "More room" })).toThrow("key");
    expect(() => createGeminiSession({ apiKey: "test-key", model: "gemini-pro" as "gemini-3.8-flash", request: "More room" })).toThrow("allowlisted");
  });
});
