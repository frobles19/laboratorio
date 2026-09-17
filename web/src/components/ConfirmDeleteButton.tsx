"use client";

import { useState, useTransition } from "react";

export function ConfirmDeleteButton({
  action,
  label = "Eliminar",
  confirmMessage = "¿Seguro que querés eliminar este registro? Esta acción no se puede deshacer.",
}: {
  action: () => Promise<{ error: string | null } | undefined>;
  label?: string;
  confirmMessage?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button
        type="button"
        className="btn small ghost"
        style={{ color: "var(--crit)" }}
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(confirmMessage)) return;
          setError(null);
          startTransition(async () => {
            const res = await action();
            if (res?.error) setError(res.error);
          });
        }}
      >
        {isPending ? "Eliminando…" : label}
      </button>
      {error && <span style={{ color: "var(--crit)", fontSize: 11 }}>{error}</span>}
    </div>
  );
}
