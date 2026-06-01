import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["scripts/check-tenant-provider-isolation.mjs", "--self-test"], {
  encoding: "utf8",
});

if (result.status !== 0 || !result.stdout.includes("Tenant provider isolation self-test passed.")) {
  console.error("Tenant provider isolation self-test failed.");
  if (result.stdout.trim()) {
    console.error(result.stdout.trim());
  }
  if (result.stderr.trim()) {
    console.error(result.stderr.trim());
  }
  process.exit(1);
}

console.log("Tenant provider isolation self-test passed.");
