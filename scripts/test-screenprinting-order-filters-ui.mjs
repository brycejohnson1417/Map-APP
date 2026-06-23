import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("components/screenprinting/screenprinting-workspace.tsx", "utf8");

assert.ok(source.includes("dateFrom"), "Screenprinting order filters must include a start date.");
assert.ok(source.includes("dateTo"), "Screenprinting order filters must include an end date.");
assert.ok(source.includes("sortBy"), "Screenprinting order filters must include a sort selector.");
assert.ok(source.includes("matchesDateFrom"), "Screenprinting order filtering must enforce the start date.");
assert.ok(source.includes("matchesDateTo"), "Screenprinting order filtering must enforce the end date.");
assert.ok(source.includes("sortedOrders"), "Screenprinting orders must be sorted after filters are applied.");
assert.ok(source.includes("Sales date from"), "The order cockpit must expose the date-from control in the UI.");
assert.ok(source.includes("Sales date to"), "The order cockpit must expose the date-to control in the UI.");
assert.ok(source.includes("Sort orders"), "The order cockpit must expose the order sort control in the UI.");
assert.ok(source.includes("All salespeople"), "The order cockpit must expose an all-salespeople filter option.");
assert.ok(source.includes("<option value=\"salesperson\">Salesperson</option>"), "The order cockpit must expose salesperson sorting.");
assert.ok(source.includes(">Salesperson</th>"), "The order table must label attribution as salesperson.");
assert.ok(!source.includes("All managers"), "The order cockpit must not expose manager terminology for salesperson filters.");
assert.ok(!source.includes("<th className=\"px-4 py-3\">Manager</th>"), "The order table must not label salesperson attribution as manager.");
assert.ok(!source.includes('label="Manager"'), "The order detail panel must not label salesperson attribution as manager.");

console.log("Screenprinting order filter UI contract passed.");
