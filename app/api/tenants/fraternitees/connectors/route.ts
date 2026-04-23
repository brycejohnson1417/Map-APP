import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  FRATERNITEES_SESSION_COOKIE,
  isFraterniteesEmail,
  saveFraterniteesConnectors,
} from "@/lib/application/fraternitees/onboarding-service";

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
  const cookieStore = await cookies();
  const email = cookieStore.get(FRATERNITEES_SESSION_COOKIE)?.value ?? "";

  if (!isFraterniteesEmail(email)) {
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
