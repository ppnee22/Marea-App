import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/queries";
import { PLATFORM_LABELS } from "@/lib/labels";
import { updatePlatformSetting, createAppUser, deleteAppUser } from "@/lib/actions/settings";
import { Button, Card, Field, Input } from "@/components/ui/primitives";
import { auth } from "@/auth";

export default async function SettingsPage() {
  const [settings, users, session] = await Promise.all([getPlatformSettings(), prisma.user.findMany({ orderBy: { createdAt: "asc" } }), auth()]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Impostazioni</h1>
        <p className="mt-1 text-sm text-slate-500">Commissioni, tasse e gestione degli accessi</p>
      </div>

      <Card>
        <h2 className="font-semibold text-slate-900">Commissioni e tasse per piattaforma</h2>
        <p className="mt-1 text-sm text-slate-500">
          Percentuali applicate automaticamente alle nuove prenotazioni (modificabili manualmente su ogni prenotazione). Il regime
          fiscale di riferimento predefinito è la cedolare secca al 21%.
        </p>
        <div className="mt-4 space-y-4">
          {(["BOOKING", "AIRBNB"] as const).map((platform) => {
            const s = settings[platform];
            return (
              <form
                key={platform}
                action={updatePlatformSetting.bind(null, platform)}
                className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-3 sm:items-end"
              >
                <p className="font-medium text-slate-800 sm:col-span-3">{PLATFORM_LABELS[platform]}</p>
                <Field label="Commissione piattaforma (%)">
                  <Input type="text" inputMode="decimal" name="commissionPercent" defaultValue={s.commissionPercent.toString()} />
                </Field>
                <Field label="Tasse / cedolare secca (%)">
                  <Input type="text" inputMode="decimal" name="taxPercent" defaultValue={s.taxPercent.toString()} />
                </Field>
                <Button type="submit" size="sm">
                  Salva
                </Button>
              </form>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900">Utenti con accesso</h2>
        <p className="mt-1 text-sm text-slate-500">Le persone che possono accedere a Marea con email e password (stessi dati su tutti i dispositivi).</p>
        <ul className="mt-3 space-y-2">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
              <div>
                <p className="font-medium text-slate-800">{u.name || u.email}</p>
                <p className="text-slate-500">{u.email}</p>
              </div>
              {session?.user?.id !== u.id && users.length > 1 ? (
                <form action={deleteAppUser.bind(null, u.id)}>
                  <button type="submit" className="text-slate-400 hover:text-red-600">
                    Rimuovi
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>

        <form action={createAppUser} className="mt-4 space-y-3 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-medium text-slate-700">Aggiungi nuovo utente</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Nome">
              <Input type="text" name="name" />
            </Field>
            <Field label="Email">
              <Input type="email" name="email" required />
            </Field>
            <Field label="Password">
              <Input type="password" name="password" required minLength={6} />
            </Field>
          </div>
          <Button type="submit" size="sm">
            Crea utente
          </Button>
        </form>
      </Card>
    </div>
  );
}
