"use client";

import { useState, useTransition } from "react";

export function RpcButton({
  action,
  label,
  pendingLabel,
  className,
}: {
  action: () => Promise<{ error: string | null } | undefined>;
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button
        type="button"
        className={className ?? "btn small"}
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await action();
            if (res?.error) setError(res.error);
          });
        }}
      >
        {isPending ? (pendingLabel ?? "Guardando…") : label}
      </button>
      {error && <span style={{ color: "var(--crit)", fontSize: 11 }}>{error}</span>}
    </div>
  );
}
