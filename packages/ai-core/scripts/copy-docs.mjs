import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(packageRoot, "docs");
const targetDir = path.join(packageRoot, "dist", "docs");

async function ensureSourceExists() {
  try {
    await stat(sourceDir);
    return true;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      console.warn(`[copy-docs] Source docs directory not found at ${sourceDir}`);
      return false;
    }
    throw error;
  }
}

async function copyDocs() {
  const exists = await ensureSourceExists();
  if (!exists) return;

  await mkdir(targetDir, { recursive: true });
  await cp(sourceDir, targetDir, { recursive: true });
  console.log(`[copy-docs] Copied docs to ${targetDir}`);
}

copyDocs().catch((error) => {
  console.error("[copy-docs] Failed to copy docs", error);
  process.exitCode = 1;
});
