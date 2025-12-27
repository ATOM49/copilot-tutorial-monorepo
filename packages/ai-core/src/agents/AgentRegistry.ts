import type { AgentDefinition } from "./AgentDefinition.js";

/**
 * Central registry for managing agent definitions
 * Provides lookup and listing capabilities for all registered agents
 */
export class AgentRegistry {
  private agents = new Map<string, AgentDefinition>();

  /**
   * Register a new agent definition
   * @throws Error if agent with the same ID already exists
   */
  register(agent: AgentDefinition): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with id "${agent.id}" is already registered`);
    }
    this.agents.set(agent.id, agent);
  }

  /**
   * Retrieve an agent by its unique identifier
   * @param agentId - The unique agent identifier
   * @returns The agent definition
   * @throws Error if agent is not found
   */
  get(agentId: string): AgentDefinition {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent with id "${agentId}" not found`);
    }
    return agent;
  }

  /**
   * List all registered agents
   * @returns Array of all agent definitions
   */
  list(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  /**
   * List all agent IDs and names (lightweight metadata)
   * Useful for UI dropdowns and agent selection
   */
  listMetadata(): Array<{ id: string; name: string }> {
    return Array.from(this.agents.values()).map((agent) => ({
      id: agent.id,
      name: agent.name,
    }));
  }

  /**
   * Check if an agent exists
   */
  has(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * Get the number of registered agents
   */
  get size(): number {
    return this.agents.size;
  }
}

/**
 * Global singleton instance
 * Import and use this instance across your application
 */
export const agentRegistry = new AgentRegistry();
