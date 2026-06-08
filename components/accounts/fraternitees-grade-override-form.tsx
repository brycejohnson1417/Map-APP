"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PencilLine, Save, X } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const initialGrade = manualGrade ?? "";
  const initialReason = reason ?? "";
  const hasChanges = selectedGrade !== initialGrade || draftReason.trim() !== initialReason.trim();
  const busy = isSaving || isPending;

  function cancel() {
    setSelectedGrade(initialGrade);
    setDraftReason(initialReason);
    setError(null);
    setIsEditing(false);
  }

  async function save() {
    setMessage(null);
    setError(null);
    setIsSaving(true);

    try {
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
      setIsEditing(false);
      startTransition(() => router.refresh());
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="flex flex-col items-start gap-1 lg:items-end">
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setError(null);
            setIsEditing(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
        >
          <PencilLine className="h-3.5 w-3.5" />
          Edit grade
        </button>
        {message ? <p className="text-right text-[11px] font-bold text-emerald-700">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid w-full max-w-sm gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm lg:w-80">
      <div className="grid gap-2">
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
            placeholder="Reason for override"
            className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-semibold normal-case tracking-normal text-slate-900 placeholder:text-slate-400"
          />
        </label>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy || !hasChanges}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            style={{ color: "#fff" }}
          >
            {selectedGrade ? <Save className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {busy ? "Saving" : selectedGrade ? "Save" : manualGrade ? "Clear" : "Computed"}
          </button>
        </div>
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
