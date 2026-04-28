import { handleMetaOAuthCallback } from "@/lib/application/runtime/meta-oauth";

export async function GET(request: Request) {
  return handleMetaOAuthCallback(request);
}
