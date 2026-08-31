import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-teal-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-2xl font-bold text-white">
            M
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Marea</h1>
          <p className="mt-1 text-sm text-slate-500">Gestionale affitti — accedi al tuo account</p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
