"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function VerificationRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "approve" | "reject") {
    setBusy(true);
    await fetch(`/api/admin/verification-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        onClick={() => act("approve")}
        disabled={busy}
        className="btn !border !border-blue-500/50 !px-3 !py-1 text-xs text-blue-400 hover:!bg-blue-500/10"
      >
        ✔ Verify
      </button>
      <button
        onClick={() => act("reject")}
        disabled={busy}
        className="btn-danger !px-3 !py-1 text-xs"
      >
        ✕ Reject
      </button>
    </div>
  );
}
