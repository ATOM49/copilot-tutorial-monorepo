import type { ToolDefinition } from "./ToolDefinition.js";

/**
 * Central registry for managing tool definitions within ai-core
 * Provides lookup, listing and per-agent allowlist helpers.
 */
export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();
  private allowlists = new Map<string, Set<string>>();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool with id "${tool.id}" is already registered`);
    }
    this.tools.set(tool.id, tool);
  }

  get(toolId: string): ToolDefinition {
    const t = this.tools.get(toolId);
    if (!t) throw new Error(`Tool with id "${toolId}" not found`);
    return t;
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  listMetadata(): Array<{ id: string; name: string; description?: string }> {
    return Array.from(this.tools.values()).map((t) => ({ id: t.id, name: t.name, description: t.description }));
  }

  has(toolId: string): boolean {
    return this.tools.has(toolId);
  }

  get size(): number {
    return this.tools.size;
  }

  setAllowlist(agentId: string, toolIds: string[]): void {
    this.allowlists.set(agentId, new Set(toolIds));
  }

  getAllowlist(agentId: string): string[] | undefined {
    const set = this.allowlists.get(agentId);
    return set ? Array.from(set) : undefined;
  }

  isAllowed(agentId: string, toolId: string): boolean {
    const set = this.allowlists.get(agentId);
    if (!set) return false;
    return set.has(toolId);
  }

  getAllowedTools(agentId: string): ToolDefinition[] {
    const set = this.allowlists.get(agentId);
    if (!set) return [];

    const out: ToolDefinition[] = [];
    for (const id of set) {
      const t = this.tools.get(id);
      if (!t) {
        throw new Error(
          `Allowlist for agent "${agentId}" references unknown tool id "${id}". Did you forget to register it?`
        );
      }
      out.push(t);
    }
    return out;
  }

  /**
   * Returns tools permitted for this agent.
   * - If an allowlist exists: returns only allowlisted tools
   * - If no allowlist exists:
   *   - returns [] by default (safe)
   *   - returns all registered tools if `fallbackToAll` is true (dev convenience)
   */
  getToolsForAgent(agentId: string, opts?: { fallbackToAll?: boolean }): ToolDefinition[] {
    const allowlist = this.allowlists.get(agentId);
    if (allowlist) return this.getAllowedTools(agentId);
    return opts?.fallbackToAll ? this.list() : [];
  }
}

export const toolRegistry = new ToolRegistry();
