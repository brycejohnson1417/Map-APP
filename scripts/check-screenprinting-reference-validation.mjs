import { readFileSync } from "node:fs";

const servicePath = "lib/application/screenprinting/screenprinting-service.ts";
const repositoryPath = "lib/application/screenprinting/repository.ts";

const serviceSource = readFileSync(servicePath, "utf8");
const repositorySource = readFileSync(repositoryPath, "utf8");

const failures = [];

function assertPresent(label, source, pattern) {
  if (!pattern.test(source)) {
    failures.push(label);
  }
}

function functionBody(source, functionName) {
  const marker = `export async function ${functionName}`;
  const start = source.indexOf(marker);
  if (start === -1) {
    failures.push(`${functionName} must exist`);
    return "";
  }

  const next = source.indexOf("\nexport async function ", start + marker.length);
  return source.slice(start, next === -1 ? source.length : next);
}

assertPresent("repository must provide organization reference validation", repositorySource, /findInvalidOrganizationReferences/);
for (const table of [
  "account",
  "contact",
  "order_record",
  "opportunity",
  "social_account",
  "social_post",
  "campaign",
  "alert_instance",
  "dashboard_definition",
]) {
  assertPresent(`reference validator must cover ${table}`, repositorySource, new RegExp(`\\b${table}\\b`));
}

const expectedCalls = {
  createScreenprintingOpportunity: ["account", "contact", "order"],
  updateScreenprintingOpportunity: ["account", "contact"],
  createScreenprintingSocialAccount: ["account", "contact"],
  updateScreenprintingSocialAccount: ["account", "contact"],
  createScreenprintingSocialPost: ["socialAccount", "campaign", "account"],
  createScreenprintingSocialComment: ["socialPost"],
  createScreenprintingSocialThread: ["socialAccount", "socialPost", "account", "contact", "opportunity"],
};

for (const [functionName, referenceKeys] of Object.entries(expectedCalls)) {
  const body = functionBody(serviceSource, functionName);
  assertPresent(`${functionName} must call assertScreenprintingReferences`, body, /assertScreenprintingReferences/);
  for (const referenceKey of referenceKeys) {
    assertPresent(`${functionName} must validate ${referenceKey}`, body, new RegExp(`type:\\s*"${referenceKey}"`));
  }
}

assertPresent(
  "cross-org references must return a safe 400 error",
  serviceSource,
  /new ScreenprintingServiceError\([\s\S]*"invalid_screenprinting_reference"[\s\S]*400/,
);

if (failures.length) {
  console.error("Screenprinting reference validation guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Screenprinting reference validation guard passed.");
