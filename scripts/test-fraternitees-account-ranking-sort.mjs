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

console.log("FraterniTees account ranking sort contract passed.");
