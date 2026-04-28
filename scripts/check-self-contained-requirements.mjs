import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("..", import.meta.url).pathname;

const requiredPolicyFiles = [
  {
    path: "docs/SELF_CONTAINED_REQUIREMENTS.md",
    requiredPhrases: [
      "Self-contained product requirements",
      "No chat dependency",
      "No external attachment dependency",
      "No lazy references",
    ],
  },
  {
    path: "AGENTS.md",
    requiredPhrases: ["Self-contained product requirements"],
  },
  {
    path: "docs/HANDOFF.md",
    requiredPhrases: ["Self-contained product requirements"],
  },
  {
    path: "docs/GLOSSARY.md",
    requiredPhrases: ["Tenant type", "Tenant-specific", "Primitive"],
  },
  {
    path: "docs/DATA_MODEL.md",
    requiredPhrases: ["organization_id", "Required Additive Screenprinting Tables", "RLS"],
  },
  {
    path: "docs/API_CONTRACTS.md",
    requiredPhrases: ["Target Additive Screenprinting API Contracts", "Tenant-mutating routes"],
  },
  {
    path: "docs/AUTONOMOUS_PRODUCT_BUILD.md",
    requiredPhrases: ["Authority Order", "Foundation-First Promotion Rule", "Continue-Until-Done Rule", "Allowed Stop Conditions"],
  },
  {
    path: "docs/ARCHITECTURE_RUNWAY.md",
    requiredPhrases: ["configuration schema foundation", "adapter port", "feature flags"],
  },
  {
    path: "docs/WORK_REGISTRY.md",
    requiredPhrases: ["Authority Order", "Execution Algorithm", "Future Proposal Boundary"],
  },
  {
    path: "docs/DEFINITION_OF_DONE.md",
    requiredPhrases: ["Universal Done Checklist", "Database Done", "API Done", "UI Done"],
  },
  {
    path: "docs/ACCEPTANCE_AND_FIXTURES.md",
    requiredPhrases: ["Fixture Rules", "Required Acceptance Workflows", "Live Provider Policy"],
  },
  {
    path: "docs/ENVIRONMENT_AND_DEPLOYMENT_POLICY.md",
    requiredPhrases: ["Missing Environment Variables", "Deployment Policy", "Production Safety"],
  },
  {
    path: "docs/MIGRATION_SAFETY.md",
    requiredPhrases: ["Destructive Change Gate", "Backfill Rules", "Verification"],
  },
  {
    path: "docs/tenant-types/SCHEMA.md",
    requiredPhrases: ["Tenant Type Manifest", "Tenant Workspace Manifest", "Inheritance And Overrides"],
  },
];

const requirementPaths = [
  "README.md",
  "docs/ARCHITECTURE.md",
  "docs/PLATFORM_SPEC.md",
  "docs/WORKSPACE_MODEL.md",
  "docs/GLOSSARY.md",
  "docs/DATA_MODEL.md",
  "docs/API_CONTRACTS.md",
  "docs/AUTONOMOUS_PRODUCT_BUILD.md",
  "docs/ARCHITECTURE_RUNWAY.md",
  "docs/WORK_REGISTRY.md",
  "docs/DEFINITION_OF_DONE.md",
  "docs/ACCEPTANCE_AND_FIXTURES.md",
  "docs/ENVIRONMENT_AND_DEPLOYMENT_POLICY.md",
  "docs/MIGRATION_SAFETY.md",
  "docs/tenant-types/SCHEMA.md",
  "docs/HANDOFF.md",
  "docs/IMPLEMENTATION_PLAN.md",
  "docs/ONBOARDING.md",
  "docs/STRATEGY.md",
  "docs/TODO.md",
  "docs/tenant-types",
  "docs/tenants/fraternitees",
];

const forbiddenPatterns = [
  {
    label: "chat-dependent reference",
    pattern: /\b(as discussed|as requested|as mentioned|like we said|what you said|you said|the user said|from chat|from the chat|previous conversation|this conversation|what I asked|what we discussed)\b/i,
  },
  {
    label: "attachment-dependent requirement",
    pattern: /\b(attached screenshot|attached screenshots|attached video|attached transcript|screenshot from|screenshots from|video of the demo|transcript of the demo|demo materials|competitor demo)\b/i,
  },
  {
    label: "external context fallback",
    pattern: /\b(use the screenshot|refer to the screenshot|refer to the video|refer to the transcript|shown in the video|shown in the screenshot)\b/i,
  },
];

const failures = [];

function readText(relativePath) {
  const absolutePath = join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`${relativePath} is missing`);
    return "";
  }

  return readFileSync(absolutePath, "utf8");
}

function walkMarkdown(relativePath, collected = []) {
  const absolutePath = join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`${relativePath} is missing`);
    return collected;
  }

  const statEntries = readdirSync(absolutePath, { withFileTypes: true });
  for (const entry of statEntries) {
    const child = join(relativePath, entry.name);
    if (entry.isDirectory()) {
      walkMarkdown(child, collected);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      collected.push(child);
    }
  }
  return collected;
}

for (const policyFile of requiredPolicyFiles) {
  const content = readText(policyFile.path);
  for (const phrase of policyFile.requiredPhrases) {
    if (!content.includes(phrase)) {
      failures.push(`${policyFile.path} must include "${phrase}"`);
    }
  }
}

const filesToCheck = new Set();
for (const relativePath of requirementPaths) {
  const absolutePath = join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`${relativePath} is missing`);
    continue;
  }

  if (statSync(absolutePath).isDirectory()) {
    for (const file of walkMarkdown(relativePath)) {
      filesToCheck.add(file);
    }
  } else {
    filesToCheck.add(relativePath);
  }
}

for (const relativePath of filesToCheck) {
  if (relativePath === "docs/SELF_CONTAINED_REQUIREMENTS.md") {
    continue;
  }

  const content = readText(relativePath);
  for (const rule of forbiddenPatterns) {
    const match = content.match(rule.pattern);
    if (match) {
      failures.push(`${relativePath} contains ${rule.label}: "${match[0]}"`);
    }
  }
}

if (failures.length) {
  console.error("Self-contained requirements check failed.\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Self-contained requirements check passed.");
