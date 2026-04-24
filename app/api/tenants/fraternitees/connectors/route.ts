import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { saveFraterniteesConnectors } from "@/lib/application/fraternitees/onboarding-service";

interface ConnectorPayload {
  printavo?: {
    email?: string;
    apiKey?: string;
  };
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const email = await getTenantSessionEmailForSlug("fraternitees");
  if (!email) {
    return NextResponse.json({ ok: false, error: "Fraternitees session required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ConnectorPayload;
  const printavoEmail = cleanString(body.printavo?.email);
  const printavoApiKey = cleanString(body.printavo?.apiKey);

  try {
    const snapshot = await saveFraterniteesConnectors({
      email,
      printavo: printavoEmail && printavoApiKey ? { email: printavoEmail, apiKey: printavoApiKey } : null,
    });

    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Connector save failed" },
      { status: 500 },
    );
  }
}
