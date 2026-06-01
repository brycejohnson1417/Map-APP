import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ts from "typescript";

const sourcePath = path.join(process.cwd(), "lib/application/change-requests/change-request-attachment-helpers.ts");
const source = await readFile(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const tmp = await mkdtemp(path.join(tmpdir(), "map-app-change-request-attachments-"));
const modulePath = path.join(tmp, "change-request-attachment-helpers.mjs");
await writeFile(modulePath, compiled);

try {
  const { createAttachmentSignedUrlMap, runBoundedAttachmentTasks } = await import(`file://${modulePath}`);

  const signedUrls = createAttachmentSignedUrlMap(
    [
      { id: "att-a", storagePath: "org/request/a.png" },
      { id: "att-b", storagePath: "org/request/b.png" },
      { id: "att-c", storagePath: "org/request/c.png" },
    ],
    [
      { path: "org/request/a.png", signedUrl: "https://signed/a" },
      { path: "org/request/b.png", error: "missing" },
      { path: "org/request/c.png", signedURL: "https://signed/c" },
    ],
  );

  assert.equal(signedUrls.get("att-a"), "https://signed/a");
  assert.equal(signedUrls.get("att-b"), null);
  assert.equal(signedUrls.get("att-c"), "https://signed/c");

  let active = 0;
  let maxActive = 0;
  const completed = [];
  const results = await runBoundedAttachmentTasks([1, 2, 3, 4, 5], 2, async (value) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    completed.push(value);
    if (value === 4) {
      throw new Error("upload failed");
    }
    return `ok-${value}`;
  });

  assert.equal(maxActive, 2);
  assert.deepEqual(completed.sort((a, b) => a - b), [1, 2, 3, 4, 5]);
  assert.equal(results.length, 5);
  assert.equal(results[0].status, "fulfilled");
  assert.equal(results[3].status, "rejected");
} finally {
  await rm(tmp, { recursive: true, force: true });
}

console.log("Change-request attachment performance helper test passed.");
