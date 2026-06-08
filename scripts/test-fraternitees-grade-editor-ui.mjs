import { readFileSync } from "node:fs";

const formSource = readFileSync("components/accounts/fraternitees-grade-override-form.tsx", "utf8");
const moduleSource = readFileSync("components/accounts/fraternitees-lead-qualification-module.tsx", "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  formSource.includes("Edit grade"),
  "Manual grade override control must be collapsed behind an Edit grade action by default.",
);

assert(
  formSource.includes("Reason for override"),
  "Manual grade override reason input must use compact copy that fits in the right-side editor.",
);

assert(
  formSource.includes("setIsEditing(true)") && formSource.includes("setIsEditing(false)"),
  "Manual grade override control must expose explicit open and cancel/close states.",
);

assert(
  !moduleSource.includes("lg:col-span-5"),
  "Manual grade override form must not render as a full-width row under every account.",
);

assert(
  moduleSource.includes("FraterniteesGradeOverrideForm") && moduleSource.includes("flex-col items-start"),
  "Manual grade override control must live in the row action column under the Open link.",
);

console.log("FraterniTees manual grade editor UI contract passed.");
