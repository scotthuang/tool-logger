import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the plugin
vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(() => []),
    statSync: vi.fn(() => ({ mtimeMs: Date.now() })),
    unlinkSync: vi.fn(),
    appendFileSync: vi.fn(),
  },
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(() => []),
  statSync: vi.fn(() => ({ mtimeMs: Date.now() })),
  unlinkSync: vi.fn(),
  appendFileSync: vi.fn(),
}));

vi.mock("node:path", () => ({
  default: {
    join: (...args: string[]) => args.join("/"),
    resolve: (...args: string[]) => args.join("/"),
  },
  join: (...args: string[]) => args.join("/"),
  resolve: (...args: string[]) => args.join("/"),
}));

vi.mock("node:os", () => ({
  default: {
    homedir: () => "/test/home",
  },
  homedir: () => "/test/home",
}));

describe("tool-logger", () => {
  let mockApi: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi = {
      on: vi.fn((event: string, handler: Function, options?: any) => {}),
    };
  });

  it("should have correct plugin metadata", async () => {
    const plugin = (await import("./index.ts")).default;
    
    expect(plugin.id).toBe("tool-logger");
    expect(plugin.name).toBe("tool-logger");
    expect(plugin.description).toBe("Log all tool inputs and outputs");
    expect(typeof plugin.register).toBe("function");
  });

  it("should register before_tool_call and after_tool_call hooks", async () => {
    const plugin = (await import("./index.ts")).default;
    plugin.register(mockApi);
    
    // Verify that api.on was called
    expect(mockApi.on).toHaveBeenCalledTimes(2);
    
    // Check that correct hooks are registered
    const registeredHooks = mockApi.on.mock.calls.map((call: any[]) => call[0]);
    
    expect(registeredHooks).toContain("before_tool_call");
    expect(registeredHooks).toContain("after_tool_call");
  });

  it("should register hooks with correct names", async () => {
    const plugin = (await import("./index.ts")).default;
    plugin.register(mockApi);
    
    // Check hook options
    const beforeCall = mockApi.on.mock.calls.find(
      (call: any[]) => call[0] === "before_tool_call"
    );
    const afterCall = mockApi.on.mock.calls.find(
      (call: any[]) => call[0] === "after_tool_call"
    );
    
    expect(beforeCall[2]?.name).toBe("tool-logger-before");
    expect(afterCall[2]?.name).toBe("tool-logger-after");
  });

  it("should return context in hook handlers", async () => {
    const plugin = (await import("./index.ts")).default;
    plugin.register(mockApi);
    
    // Get the before_tool_call handler
    const beforeToolCallCall = mockApi.on.mock.calls.find(
      (call: any[]) => call[0] === "before_tool_call"
    );
    const handler = beforeToolCallCall[1];
    
    const mockEvent = { 
      toolName: "test-tool", 
      params: { args: { key: "value" } } 
    };
    const mockCtx = { sessionKey: "test-session", agentId: "test-agent" };
    const result = handler(mockEvent, mockCtx);
    
    // Handler should return the context
    expect(result).toBe(mockCtx);
  });

  it("should skip after_tool_call when no duration", async () => {
    const plugin = (await import("./index.ts")).default;
    plugin.register(mockApi);
    
    // Get the after_tool_call handler
    const afterToolCallCall = mockApi.on.mock.calls.find(
      (call: any[]) => call[0] === "after_tool_call"
    );
    const handler = afterToolCallCall[1];
    
    // Call with no duration - should return ctx immediately without logging
    const mockEvent = { 
      toolName: "test-tool", 
      durationMs: 0 
    };
    const mockCtx = { sessionKey: "test-session" };
    const result = handler(mockEvent, mockCtx);
    
    // Should return ctx without logging
    expect(result).toBe(mockCtx);
  });
});
