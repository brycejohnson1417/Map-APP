import assert from "node:assert/strict";

const {
  buildCalendarYearCustomerRows,
  resolveManualLeadGrade,
} = await import("../lib/application/fraternitees/account-insights.ts");

{
  const resolved = resolveManualLeadGrade(
    {
      leadGrade: "B",
      leadScore: 74,
    },
    {
      manualLeadGrade: "A",
      manualLeadGradeReason: "Relationship owner confirmed repeat buyer.",
      manualLeadGradeUpdatedAt: "2026-06-08T12:00:00.000Z",
      manualLeadGradeUpdatedBy: "qa@fraternitees.com",
    },
  );

  assert.equal(resolved.leadGrade, "A");
  assert.equal(resolved.computedLeadGrade, "B");
  assert.equal(resolved.manualLeadGrade, "A");
  assert.equal(resolved.manualLeadGradeReason, "Relationship owner confirmed repeat buyer.");
  assert.equal(resolved.manualLeadGradeUpdatedBy, "qa@fraternitees.com");
}

{
  const ignored = resolveManualLeadGrade(
    {
      leadGrade: "C",
      leadScore: 61,
    },
    {
      manualLeadGrade: "Not a grade",
    },
  );

  assert.equal(ignored.leadGrade, "C");
  assert.equal(ignored.computedLeadGrade, null);
  assert.equal(ignored.manualLeadGrade, null);
}

{
  const rows = buildCalendarYearCustomerRows({
    now: new Date("2026-06-08T12:00:00.000Z"),
    accounts: [
      {
        id: "alpha",
        name: "Sigma Chi - Ohio State",
        city: "Columbus",
        state: "OH",
        customFields: {},
      },
      {
        id: "beta",
        name: "Beta Theta Pi / University of Texas",
        city: "Austin",
        state: "TX",
        customFields: { fraternity: "Beta Theta Pi", chapter: "University of Texas" },
      },
    ],
    orders: [
      {
        accountId: "alpha",
        status: "Quote",
        orderTotal: 1200,
        orderCreatedAt: "2026-02-10T00:00:00.000Z",
      },
      {
        accountId: "alpha",
        status: "Order Placed Townsend",
        orderTotal: 3400,
        orderCreatedAt: "2025-12-20T00:00:00.000Z",
      },
      {
        accountId: "beta",
        status: "Order Placed Townsend",
        orderTotal: 2200,
        orderCreatedAt: "2026-05-01T00:00:00.000Z",
      },
    ],
    sort: "needs_close",
  });

  assert.equal(rows.length, 2);
  assert.equal(rows[0].accountId, "alpha");
  assert.equal(rows[0].fraternity, "Sigma Chi");
  assert.equal(rows[0].chapter, "Ohio State");
  assert.equal(rows[0].needsClose, true);
  assert.equal(rows[1].accountId, "beta");
  assert.equal(rows[1].fraternity, "Beta Theta Pi");
  assert.equal(rows[1].chapter, "University of Texas");
  assert.equal(rows[1].needsClose, false);
}

console.log("FraterniTees change-request behavior tests passed.");
