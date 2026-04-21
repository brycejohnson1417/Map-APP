import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const outputFile = process.env.CODEX_REVIEW_OUTPUT?.trim() || join(cwd, "artifacts", "adversarial-review-latest.md");

const prompt = `
Review this repository from a fresh context.

Focus on:
- platform-spec drift
- tenant-agnostic architecture
- autonomous execution discipline
- verification rigor
- hidden provider or tenant assumptions
- whether docs, backlog, and verification commands are aligned with the current repo

Be adversarial and concrete. If you find gaps, list them in severity order with exact file references.
If the repo is aligned, say so and note residual risks only.
`.trim();

mkdirSync(dirname(outputFile), { recursive: true });

const result = spawnSync(
  "codex",
  [
    "exec",
    "--cd",
    cwd,
    "--output-last-message",
    outputFile,
    prompt,
  ],
  {
    stdio: "inherit",
    env: process.env,
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Adversarial review written to ${outputFile}`);
