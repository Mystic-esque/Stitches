import { describe, expect, it } from "vitest";
import type { Content, GenerateContentParameters, GenerateContentResponse } from "@google/genai";
import { createGeminiSession } from "./gemini-session";

describe("Google SDK session boundary", () => {
  it("offers only read tools in companion mode and preserves signed content with matched feedback", async () => {
    const requests: GenerateContentParameters[] = [];
    const signed = { role: "model", parts: [{ functionCall: { id: "inspect-1", name: "inspect_project", args: {} }, thoughtSignature: "opaque-companion-signature" }] };
    const model = createGeminiSession({ apiKey: "test-key", model: "gemini-3.5-flash-lite", request: "What should I prepare?", purpose: "companion",
      generate: async (parameters) => { requests.push(parameters); return (requests.length === 1
        ? { candidates: [{ content: signed }], functionCalls: [{ id: "inspect-1", name: "inspect_project", args: {} }] }
        : { candidates: [{ content: { role: "model", parts: [{ text: "Continue inspecting the source." }] } }], functionCalls: [], text: "Continue inspecting the source." }) as unknown as GenerateContentResponse; } });
    await model.next();
    await model.next({ id: "inspect-1", name: "inspect_project", response: { capability: "plan_only" } });
    const tools = requests[0].config?.tools as { functionDeclarations: { name: string }[] }[];
    expect(tools.flatMap((tool) => tool.functionDeclarations.map((item) => item.name))).toEqual(["inspect_project", "resolve_exact_graph", "retrieve_context"]);
    expect(requests[0].config?.toolConfig?.functionCallingConfig).toEqual({ mode: "ANY", allowedFunctionNames: ["inspect_project"] });
    expect(requests[1].config?.toolConfig?.functionCallingConfig).toEqual({ mode: "ANY", allowedFunctionNames: ["resolve_exact_graph"] });
    expect((requests[1].contents as Content[])[1]).toBe(signed);
    expect((requests[1].contents as Content[])[2].parts?.[0]?.functionResponse?.id).toBe("inspect-1");
  });
  it("offers inspect_making for construction tasks in companion mode", async () => {
    const requests: GenerateContentParameters[] = [];
    const signed = { role: "model", parts: [{ functionCall: { id: "inspect-1", name: "inspect_project", args: {} }, thoughtSignature: "opaque-companion-signature" }] };
    const model = createGeminiSession({ apiKey: "test-key", model: "gemini-3.5-flash-lite", request: "What is my next step?", purpose: "companion", task: "step_guidance",
      generate: async (parameters) => { requests.push(parameters); return (requests.length === 1
        ? { candidates: [{ content: signed }], functionCalls: [{ id: "inspect-1", name: "inspect_project", args: {} }] }
        : { candidates: [{ content: { role: "model", parts: [{ text: "Check prerequisites." }] } }], functionCalls: [], text: "Check prerequisites." }) as unknown as GenerateContentResponse; } });
    await model.next();
    await model.next({ id: "inspect-1", name: "inspect_project", response: { capability: "plan_only" } });
    const tools = requests[0].config?.tools as { functionDeclarations: { name: string }[] }[];
    expect(tools.flatMap((tool) => tool.functionDeclarations.map((item) => item.name))).toEqual(["inspect_project", "inspect_making", "retrieve_context"]);
    expect(requests[0].config?.toolConfig?.functionCallingConfig).toEqual({ mode: "ANY", allowedFunctionNames: ["inspect_project"] });
    expect(requests[1].config?.toolConfig?.functionCallingConfig).toEqual({ mode: "ANY", allowedFunctionNames: ["inspect_making"] });
  });
  it("returns tool calls and replays the exact signed model content with matching feedback ID", async () => {
    const requests: GenerateContentParameters[] = [];
    const signedContent = { role: "model", parts: [{ functionCall: { id: "call-1", name: "get_pattern_context", args: {} }, thoughtSignature: "opaque-signature" }] };
    const generate = async (parameters: GenerateContentParameters) => {
      requests.push(parameters);
      return requests.length === 1
        ? { candidates: [{ content: signedContent }], functionCalls: [{ id: "call-1", name: "get_pattern_context", args: {} }] } as unknown as GenerateContentResponse
        : { candidates: [{ content: { role: "model", parts: [{ text: "Please choose an amount." }] } }], functionCalls: [], text: "Please choose an amount." } as unknown as GenerateContentResponse;
    };
    const model = createGeminiSession({ apiKey: "test-key", model: "gemini-3.5-flash-lite", request: "More shoulder room", generate });
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
      apiKey: "test-key", model: "gemini-3.5-flash-lite", request: "More room",
      generate: async () => { throw { status: 429, message: "secret-provider-detail" }; },
    });
    await expect(model.next()).rejects.toMatchObject({ code: "quota", message: expect.not.stringContaining("secret-provider-detail") });
  });

  it("refuses feedback for a different model call", async () => {
    const model = createGeminiSession({
      apiKey: "test-key", model: "gemini-3.5-flash-lite", request: "More room",
      generate: async () => ({
        candidates: [{ content: { role: "model", parts: [{ functionCall: { id: "expected", name: "get_pattern_context", args: {} } }] } }],
        functionCalls: [{ id: "expected", name: "get_pattern_context", args: {} }],
      }) as unknown as GenerateContentResponse,
    });
    await model.next();
    await expect(model.next({ id: "wrong", name: "get_pattern_context", response: {} })).rejects.toMatchObject({ code: "protocol" });
  });

  it("rejects unqualified model names and missing keys before any call", () => {
    expect(() => createGeminiSession({ apiKey: "", model: "gemini-3.5-flash-lite", request: "More room" })).toThrow("key");
    expect(() => createGeminiSession({ apiKey: "test-key", model: "gemini-pro" as "gemini-3.5-flash-lite", request: "More room" })).toThrow("allowlisted");
  });
});
