"use client";

import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  buildFinancialWorkbook,
  financialTemplateFilename,
  parseFinancialWorkbook,
  type FinancialExcelKind,
  type FinancialExcelYear,
} from "@/lib/listing-excel";

export function FinancialExcelTools<T extends FinancialExcelYear>({
  kind,
  years,
  notes,
  onImported,
}: {
  kind: FinancialExcelKind;
  years: T[];
  notes?: string;
  onImported: (payload: { years: T[]; strategicAssumptions?: string }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"download" | "upload" | null>(null);

  async function downloadTemplate() {
    setBusy("download");
    try {
      const bytes = await buildFinancialWorkbook(years, kind, { strategicAssumptions: notes });
      const payload = new Uint8Array(bytes);
      const blob = new Blob([payload], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = financialTemplateFilename(kind, years);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Unable to download the Excel template.");
    } finally {
      setBusy(null);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy("upload");
    try {
      const buffer = await file.arrayBuffer();
      const result = await parseFinancialWorkbook(new Uint8Array(buffer), file.name, years, kind);
      if (result.filled > 0 || result.strategicAssumptions) {
        onImported({ years: result.years, strategicAssumptions: result.strategicAssumptions });
        const parts = [
          result.filled > 0
            ? `Imported ${result.filled} figure${result.filled === 1 ? "" : "s"}`
            : null,
          result.strategicAssumptions ? "and strategic assumptions" : null,
        ].filter(Boolean);
        toast.success(`${parts.join(" ")}. Review the form before continuing.`);
      }
      for (const warning of result.warnings) {
        if (result.filled > 0) toast.warning(warning);
        else toast.error(warning);
      }
    } catch {
      toast.error("Unable to read that file. Use the downloaded Excel template.");
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-muted/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {kind === "forecast"
          ? "Optional: download Excel, fill Assumptions, Profit & Loss, Cash Flow, and Balance Sheet, then upload it back."
          : "Optional: download Excel, fill Balance Sheet, Profit & Loss, and Cash Flow for the three years, then upload it back. You can still type in the form."}
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy !== null}
          onClick={() => void downloadTemplate()}
        >
          {busy === "download" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Download template
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy !== null}
          onClick={() => inputRef.current?.click()}
        >
          {busy === "upload" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Upload filled file
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.csv"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
