"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save, X } from "lucide-react";
import type { FraterniteesLeadGrade } from "@/lib/domain/runtime";

const gradeOptions: Array<FraterniteesLeadGrade | ""> = ["", "A+", "A", "B", "C", "D", "F", "Unscored"];

export function FraterniteesGradeOverrideForm({
  orgSlug,
  accountId,
  computedGrade,
  manualGrade,
  reason,
}: {
  orgSlug: string;
  accountId: string;
  computedGrade: FraterniteesLeadGrade;
  manualGrade: FraterniteesLeadGrade | null;
  reason: string | null;
}) {
  const router = useRouter();
  const [selectedGrade, setSelectedGrade] = useState(manualGrade ?? "");
  const [draftReason, setDraftReason] = useState(reason ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const initialGrade = manualGrade ?? "";
  const initialReason = reason ?? "";
  const hasChanges = selectedGrade !== initialGrade || draftReason.trim() !== initialReason.trim();

  async function save() {
    setMessage(null);
    setError(null);

    const response = await fetch(
      `/api/runtime/organizations/${encodeURIComponent(orgSlug)}/accounts/${encodeURIComponent(accountId)}/lead-grade`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          manualLeadGrade: selectedGrade || null,
          reason: draftReason,
        }),
      },
    );
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) {
      setError(typeof body.error === "string" ? body.error : "Unable to save grade override.");
      return;
    }

    setMessage(selectedGrade ? "Manual grade saved." : "Manual grade cleared.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="mt-3 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-2 sm:grid-cols-[9rem_1fr_auto] sm:items-end">
        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          Manual grade
          <select
            value={selectedGrade}
            onChange={(event) => setSelectedGrade(event.target.value as FraterniteesLeadGrade | "")}
            className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-semibold normal-case tracking-normal text-slate-900"
          >
            {gradeOptions.map((grade) => (
              <option key={grade || "computed"} value={grade}>
                {grade || `Computed (${computedGrade})`}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          Reason
          <input
            value={draftReason}
            onChange={(event) => setDraftReason(event.target.value)}
            placeholder="Why should this override the model?"
            className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-semibold normal-case tracking-normal text-slate-900 placeholder:text-slate-400"
          />
        </label>
        <button
          type="button"
          onClick={save}
          disabled={isPending || !hasChanges}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          style={{ color: "#fff" }}
        >
          {selectedGrade ? <Save className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {isPending ? "Saving" : selectedGrade ? "Save" : manualGrade ? "Clear" : "Computed"}
        </button>
      </div>
      {manualGrade ? (
        <p className="text-xs font-semibold text-slate-500">
          Override active. Computed grade remains {computedGrade}; the call sheet uses {manualGrade}.
        </p>
      ) : null}
      {message ? <p className="text-xs font-bold text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}
