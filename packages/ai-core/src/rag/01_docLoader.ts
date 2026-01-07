import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type LocalDoc = {
  id: string;
  title: string;
  content: string;
  sourcePath: string;
  format: "markdown";
  updatedAt?: string;
};

const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));
export const DEFAULT_LOCAL_DOCS_DIR = path.join(PACKAGE_ROOT, "docs");

function inferTitle(content: string, fallback: string): string {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) {
      const heading = trimmed.replace(/^#+\s*/, "").trim();
      if (heading) return heading;
    }
  }
  return fallback;
}

export async function loadLocalMarkdownDocs(
  directory: string = DEFAULT_LOCAL_DOCS_DIR
): Promise<LocalDoc[]> {
  const dirPath = path.resolve(directory);

  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    throw new Error(
      `Failed to read docs directory "${dirPath}": ${reason}`
    );
  }

  const markdownFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => path.join(dirPath, entry.name));

  const documents: LocalDoc[] = [];

  for (const filePath of markdownFiles) {
    const filename = path.basename(filePath, ".md");
    const content = await readFile(filePath, "utf8");
    const stats = await stat(filePath);

    const title = inferTitle(content, filename);

    documents.push({
      id: filename,
      title,
      content,
      sourcePath: filePath,
      format: "markdown",
      updatedAt: stats.mtime.toISOString(),
    });
  }

  return documents;
}
