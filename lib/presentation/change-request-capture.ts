export const CHANGE_REQUEST_CAPTURE_EVENT = "map-app:open-change-request-capture";

export interface ChangeRequestSurfaceContext {
  surface: string;
  label: string;
}

export function inferChangeRequestSurface(pathname: string): ChangeRequestSurfaceContext {
  if (pathname.startsWith("/territory")) {
    return { surface: "territory", label: "territory map" };
  }

  if (/^\/accounts\/[^/]+/.test(pathname)) {
    return { surface: "account_detail", label: "account detail" };
  }

  if (pathname.startsWith("/accounts")) {
    return { surface: "accounts", label: "accounts" };
  }

  if (pathname.startsWith("/integrations")) {
    return { surface: "integrations", label: "integrations and plugins" };
  }

  if (pathname.startsWith("/change-requests")) {
    return { surface: "change_requests", label: "change queue" };
  }

  if (pathname.startsWith("/runtime")) {
    return { surface: "runtime", label: "runtime" };
  }

  return { surface: "workspace", label: "workspace" };
}

export function createChangeRequestTitle(input: {
  label: string;
  summary: string;
  commentCount: number;
}) {
  const normalizedSummary = input.summary.trim().replace(/\s+/g, " ");
  if (normalizedSummary) {
    return normalizedSummary.slice(0, 100);
  }

  const areaLabel = input.commentCount === 1 ? "1 comment" : `${input.commentCount} comments`;
  return `${input.label} request (${areaLabel})`;
}
