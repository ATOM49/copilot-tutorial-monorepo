# Retrieval and Tooling Primer

Day 8 and 9 introduced the tool registry with time, calculator, and searchDocs stubs. Tools are allowlisted per agent so Product Q&A only sees approved utilities. Tool executions emit audit-friendly summaries that include userId, tenantId, requestId, and traceId.

### Retrieval direction for Day 10
- Source documents live in a local `packages/ai-core/docs` folder for development.
- A loader will read markdown files from this folder, infer titles from headings, and expose raw documents for chunking.
- Future steps: chunk the docs, embed the chunks, and persist them to a lightweight vector store.

### Safe usage expectations
- Keep inputs small enough for local processing; the loader intentionally rejects non-markdown files.
- When wiring embeddings, keep tenant awareness and role checks in mind to mirror tool safety constraints.
