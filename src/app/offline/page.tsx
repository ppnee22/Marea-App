export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-2xl font-bold text-white">
        M
      </div>
      <h1 className="text-xl font-semibold text-slate-900">Sei offline</h1>
      <p className="max-w-sm text-sm text-slate-500">
        Marea richiede una connessione internet per mostrare i dati aggiornati. Riconnettiti e riprova.
      </p>
    </div>
  );
}
