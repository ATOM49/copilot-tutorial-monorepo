import type { LocalDoc } from "./01_docLoader.js";

export type ChunkOptions = {
  chunkSize?: number;
  overlap?: number;
};

export type DocChunk = {
  id: string;
  docId: string;
  content: string;
  chunkIndex: number;
  sourcePath: string;
  section?: string;
  updatedAt?: string;
};

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_OVERLAP = 200;

function splitIntoBlocks(doc: LocalDoc): Array<{ text: string; section?: string }> {
  const lines = doc.content.split(/\r?\n/);
  const blocks: Array<{ text: string; section?: string }> = [];
  let buffer: string[] = [];
  let currentSection: string | undefined;

  const flush = () => {
    if (!buffer.length) return;
    blocks.push({ text: buffer.join("\n").trim(), section: currentSection });
    buffer = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^\s*#{1,6}\s+(.*)$/);
    if (headingMatch) {
      flush();
      currentSection = headingMatch[1].trim();
      continue;
    }

    if (line.trim() === "") {
      flush();
      continue;
    }

    buffer.push(line);
  }

  flush();
  return blocks.filter((b) => b.text.length > 0);
}

function chunkBlocks(
  blocks: Array<{ text: string; section?: string }>,
  doc: LocalDoc,
  opts: Required<ChunkOptions>
): DocChunk[] {
  const chunks: DocChunk[] = [];
  let buffer = "";
  let lastSection: string | undefined;

  const pushChunk = (content: string) => {
    const chunkIndex = chunks.length;
    chunks.push({
      id: `${doc.id}-chunk-${chunkIndex}`,
      docId: doc.id,
      content: content.trim(),
      chunkIndex,
      sourcePath: doc.sourcePath,
      section: lastSection,
      updatedAt: doc.updatedAt,
    });
  };

  for (const block of blocks) {
    const text = block.text.trim();
    if (!text) continue;
    lastSection = block.section ?? lastSection;

    buffer = buffer ? `${buffer}\n\n${text}` : text;

    while (buffer.length > opts.chunkSize) {
      const slice = buffer.slice(0, opts.chunkSize);
      pushChunk(slice);
      buffer = buffer.slice(opts.chunkSize - opts.overlap);
    }
  }

  if (buffer.trim().length) {
    pushChunk(buffer);
  }

  return chunks;
}

export function chunkMarkdownDocs(
  docs: LocalDoc[],
  options: ChunkOptions = {}
): DocChunk[] {
  const opts: Required<ChunkOptions> = {
    chunkSize: options.chunkSize ?? DEFAULT_CHUNK_SIZE,
    overlap: options.overlap ?? DEFAULT_OVERLAP,
  };

  if (opts.chunkSize <= 0) {
    throw new Error("chunkSize must be > 0");
  }
  if (opts.overlap < 0 || opts.overlap >= opts.chunkSize) {
    throw new Error("overlap must be >= 0 and smaller than chunkSize");
  }

  const allChunks: DocChunk[] = [];
  for (const doc of docs) {
    const blocks = splitIntoBlocks(doc);
    const chunks = chunkBlocks(blocks, doc, opts);
    allChunks.push(...chunks);
  }

  return allChunks;
}
