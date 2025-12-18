import { ChatPromptTemplate } from "@langchain/core/prompts";

export function copilotSystemPrompt(args: { appName: string }) {
  return [
    `You are the in-app copilot for ${args.appName}.`,
    `You must follow the user's request, but keep answers concise and actionable.`,
    `If you are unsure, say so and ask for the missing info.`,
  ].join("\n");
}

export function simpleCopilotPrompt(system: string) {
  // system + a single user input variable
  return ChatPromptTemplate.fromMessages([
    ["system", system],
    ["human", "{input}"],
  ]);
}
