import assert from "node:assert/strict";
import test from "node:test";
import { selectMembershipOrganization } from "../../lib/application/auth/membership-access.ts";

const organizations = new Map([
  ["stale", { id: "stale", slug: "missing" }],
  ["picc", { id: "picc", slug: "picc" }],
  ["fraternitees", { id: "fraternitees", slug: "fraternitees" }],
]);

test("skips stale memberships before selecting a fallback organization", () => {
  const availableOrganizations = new Map(organizations);
  availableOrganizations.delete("stale");

  const selected = selectMembershipOrganization(
    [{ organizationId: "stale" }, { organizationId: "fraternitees" }],
    availableOrganizations,
  );

  assert.equal(selected?.slug, "fraternitees");
});

test("uses the requested organization instead of the first unrelated membership", () => {
  const selected = selectMembershipOrganization(
    [{ organizationId: "picc" }, { organizationId: "fraternitees" }],
    organizations,
    "fraternitees",
  );

  assert.equal(selected?.slug, "fraternitees");
});

test("does not fall back to an unrelated membership when a requested slug is missing", () => {
  const selected = selectMembershipOrganization([{ organizationId: "picc" }], organizations, "fraternitees");

  assert.equal(selected, null);
});
