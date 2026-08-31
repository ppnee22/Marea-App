"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "./actions";
import { Button, Field, Input } from "@/components/ui/primitives";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Field label="Email">
        <Input type="email" name="email" required autoComplete="email" placeholder="tuo@email.com" />
      </Field>
      <Field label="Password">
        <Input type="password" name="password" required autoComplete="current-password" placeholder="••••••••" />
      </Field>

      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Accesso in corso..." : "Accedi"}
      </Button>
    </form>
  );
}
