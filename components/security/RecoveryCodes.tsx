"use client";

import { Download, KeyRound } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { useFormat } from "@/lib/i18n/use-format";

/** One-time recovery codes with copy and download. Shown only once, right after enrolment. */
export function RecoveryCodes({ codes }: { codes: string[] }) {
  const f = useFormat();

  const download = () => {
    const contents = [
      "FacilPay two-factor recovery codes",
      `Generated ${f.dateTime(new Date())}`,
      "",
      "Each code can be used once to sign in or confirm a sensitive action",
      "if you lose access to your authenticator app. Keep them somewhere safe.",
      "",
      ...codes,
      "",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([contents], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "facilpay-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="mb-3 flex items-start gap-2">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        <p className="text-sm text-amber-900">
          Save these recovery codes now. Each one works once, and this is the only time they will be shown.
        </p>
      </div>
      <ol className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg bg-white px-4 py-3 font-mono text-sm text-zinc-900">
        {codes.map((code) => (
          <li key={code} className="select-all">
            {code}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-700">
          <CopyButton value={codes.join("\n")} label="Copy recovery codes" />
          <span className="pr-3">Copy</span>
        </span>
        <button
          type="button"
          onClick={download}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Download .txt
        </button>
      </div>
    </div>
  );
}
