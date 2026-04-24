export function firstParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function defaultOrgSlug() {
  return process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG?.trim() || process.env.ORG_SLUG?.trim() || "starter";
}

export function orgSlugFromSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  return firstParamValue(searchParams.org)?.trim() || defaultOrgSlug();
}

export function orgScopedHref(path: string, orgSlug: string) {
  const defaultSlug = defaultOrgSlug();
  if (!orgSlug || orgSlug === defaultSlug) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}org=${encodeURIComponent(orgSlug)}`;
}
