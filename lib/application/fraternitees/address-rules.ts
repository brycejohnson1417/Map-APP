export const FRATERNITEES_HQ_ADDRESS = {
  addressLine1: "1379 Ashley River Rd",
  addressLine2: "Suite 100",
  city: "Charleston",
  state: "South Carolina",
  postalCode: "29407",
};

function normalize(value: string | null | undefined) {
  return value
    ?.toLowerCase()
    .replace(/\broad\b/g, "rd")
    .replace(/\bstreet\b/g, "st")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() ?? "";
}

export function isFraterniteesHqAddress(input: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}) {
  const line1 = normalize(input.addressLine1);
  const line2 = normalize(input.addressLine2);
  const city = normalize(input.city);
  const state = normalize(input.state);

  return (
    line1.includes("1379 ashley river rd") &&
    (!line2 || line2.includes("suite 100")) &&
    city === "charleston" &&
    (state === "south carolina" || state === "sc")
  );
}

export function isFraterniteesNoAddressPlaceholder(value: string | null | undefined) {
  const line1 = normalize(value);
  if (!line1) {
    return true;
  }

  return [
    /^pick ?up( |$)/,
    /(^| )pick ?up( |$)/,
    /^for pick ?up$/,
    /^local pick ?up$/,
    /^night shift pick ?up$/,
    /^fraternitees$/,
    /^ftees?$/,
    /^individual$/,
    /^individual shipping$/,
    /^delivery$/,
    /^split$/,
    /^ship from night shift$/,
  ].some((pattern) => pattern.test(line1));
}

export function hasUsableFraterniteesAddress(input: {
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}) {
  if (input.addressLine1?.trim() && !isFraterniteesNoAddressPlaceholder(input.addressLine1)) {
    return true;
  }
  if (input.postalCode?.trim()) {
    return true;
  }
  return Boolean(input.city?.trim() && input.state?.trim());
}
