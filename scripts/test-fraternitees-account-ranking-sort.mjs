import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const {
  buildAccountRankingOrderClause,
  collectSalesRepNames,
  normalizeAccountRankingSort,
} = await import("../lib/application/fraternitees/account-insights.ts");

assert.equal(normalizeAccountRankingSort("last_order_date"), "last_order_date");
assert.equal(normalizeAccountRankingSort("salesperson"), "salesperson");
assert.equal(normalizeAccountRankingSort("unknown"), "score");

assert.equal(
  buildAccountRankingOrderClause("last_order_date", "directory_view"),
  "last_order_date.desc.nullslast,lead_score.desc.nullslast,total_orders.desc.nullslast,display_name.asc",
);
assert.equal(
  buildAccountRankingOrderClause("last_order_date", "account_table"),
  "last_order_date.desc.nullslast,custom_fields->leadScore.desc.nullslast,custom_fields->closedOrders.desc.nullslast,display_name.asc",
);
assert.equal(
  buildAccountRankingOrderClause("salesperson", "directory_view"),
  "primary_sales_rep.asc.nullslast,display_name.asc,last_order_date.desc.nullslast",
);
assert.equal(
  buildAccountRankingOrderClause("salesperson", "account_table"),
  "sales_rep_names.asc.nullslast,display_name.asc,last_order_date.desc.nullslast",
);

assert.deepEqual(
  collectSalesRepNames([
    { salesRepName: "  Drake Bowen " },
    { salesRepName: "" },
    { salesRepName: "Alec Greenberg" },
    { salesRepName: "Drake Bowen" },
    { salesRepName: null },
  ]),
  ["Alec Greenberg", "Drake Bowen"],
);

const workspace = JSON.parse(readFileSync("tenants/fraternitees/workspace.json", "utf8"));
const sortValues = workspace.modules.accounts.sortOptions.map((option) => option.value);
assert.ok(sortValues.includes("last_order_date"), "FraterniTees account sort options must include latest sale date.");
assert.ok(sortValues.includes("salesperson"), "FraterniTees account sort options must include salesperson.");

const runtimeTypes = readFileSync("lib/domain/runtime.ts", "utf8");
assert.ok(runtimeTypes.includes("salesperson: string;"), "FraterniTees account filters must expose the selected salesperson.");
assert.ok(runtimeTypes.includes("salespersonOptions: string[];"), "FraterniTees account filters must expose salesperson filter options.");

const directoryService = readFileSync("lib/application/fraternitees/account-directory-service.ts", "utf8");
assert.ok(directoryService.includes("function normalizeSalesperson"), "FraterniTees account directory must normalize the salesperson query param.");
assert.ok(directoryService.includes('params.set("sales_rep_names", salesRepArrayFilter(input.salesperson));'), "FraterniTees account directory must filter account rows by salesperson.");
assert.ok(directoryService.includes("fetchCachedSalespersonOptions"), "FraterniTees account directory must load salesperson filter options.");

const accountModule = readFileSync("components/accounts/fraternitees-lead-qualification-module.tsx", "utf8");
assert.ok(accountModule.includes('name: "salesperson"'), "FraterniTees account toolbar must include a salesperson filter select.");
assert.ok(accountModule.includes("All salespeople"), "FraterniTees account toolbar must include an all-salespeople option.");
assert.ok(accountModule.includes("Unassigned"), "FraterniTees account toolbar must include an unassigned salesperson option.");

console.log("FraterniTees account ranking sort contract passed.");
