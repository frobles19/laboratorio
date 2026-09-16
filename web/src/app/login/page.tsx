"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "./actions";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [state, formAction, pending] = useActionState(signIn, { error: null });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <form action={formAction} className="card form-page" style={{ width: 360 }}>
        <div className="brand-mark" style={{ marginBottom: 4 }}>
          RADIO<span style={{ color: "var(--accent)" }}>AYUDAS</span>
        </div>
        <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 20px" }}>
          Trazabilidad de infraestructura de radioayudas aeronáuticas.
        </p>

        <input type="hidden" name="next" value={next} />

        <div className="field" style={{ maxWidth: "none" }}>
          <label htmlFor="email">Mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="tecnico@anac.gob.ar" />
        </div>
        <div className="field" style={{ maxWidth: "none", marginBottom: 8 }}>
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>

        {state.error && (
          <div className="warn-box" style={{ marginBottom: 14 }}>
            {state.error}
          </div>
        )}

        <button className="btn primary" type="submit" disabled={pending} style={{ width: "100%" }}>
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
