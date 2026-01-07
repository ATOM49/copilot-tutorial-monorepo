export class ToolPermissionError extends Error {
  constructor(message = "Tool permission denied") {
    super(message);
    this.name = "ToolPermissionError";
  }
}
