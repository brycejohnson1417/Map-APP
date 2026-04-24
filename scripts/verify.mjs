import { spawnSync } from "node:child_process";

const steps = [
  ["npm", ["run", "typecheck"]],
  ["npm", ["run", "lint"]],
  ["npm", ["run", "check:tenant-isolation"]],
  ["npm", ["run", "build"]],
];

function runStep(command, args) {
  const label = [command, ...args].join(" ");
  console.log(`\n==> ${label}`);

  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const [command, args] of steps) {
  runStep(command, args);
}

if (process.env.SMOKE_BASE_URL) {
  runStep("npm", ["run", "smoke:runtime"]);
} else {
  console.log("\nSkipping smoke test because SMOKE_BASE_URL is not set.");
}

if (process.env.SMOKE_BASE_URL && process.env.PLAYWRIGHT_VERIFY === "1") {
  runStep("npm", ["run", "verify:browser"]);
} else {
  console.log("\nSkipping browser verification because SMOKE_BASE_URL is not set or PLAYWRIGHT_VERIFY is not 1.");
}

console.log("\nVerification passed.");
