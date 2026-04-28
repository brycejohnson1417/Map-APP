import { handleMetaOAuthCallback, legacyMetaOAuthRedirectUri } from "@/lib/application/runtime/meta-oauth";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  return handleMetaOAuthCallback(request, {
    routeSlug: slug,
    redirectUri: legacyMetaOAuthRedirectUri(request.url, slug),
  });
}
