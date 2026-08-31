import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAllProperties, getContractsExpiringSoon, getUnpaidMonthlyPayments, getUpcomingCheckInsOuts } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { monthLabel, toNumber } from "@/lib/calc";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { createReminder, deleteReminder, toggleReminder } from "@/lib/actions/reminders";

export default async function RemindersPage() {
  const [checkInOut, unpaidMonthly, expiringContracts, manualReminders, properties] = await Promise.all([
    getUpcomingCheckInsOuts(14),
    getUnpaidMonthlyPayments(),
    getContractsExpiringSoon(60),
    prisma.reminder.findMany({ include: { property: true }, orderBy: [{ isDone: "asc" }, { dueDate: "asc" }] }),
    getAllProperties(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Promemoria</h1>
        <p className="mt-1 text-sm text-slate-500">Scadenze calcolate automaticamente e promemoria personali</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-slate-900">🌊 Check-in / check-out imminenti</h2>
          {checkInOut.checkIns.length === 0 && checkInOut.checkOuts.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Nessuno nei prossimi 14 giorni.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {checkInOut.checkIns.map((b) => (
                <li key={`in-${b.id}`}>
                  <Link href={`/mare/prenotazioni/${b.id}`} className="flex items-center justify-between hover:text-teal-700">
                    <span><Badge color="green">Check-in</Badge> {b.guestName}</span>
                    <span className="text-slate-500">{formatDate(b.checkIn)}</span>
                  </Link>
                </li>
              ))}
              {checkInOut.checkOuts.map((b) => (
                <li key={`out-${b.id}`}>
                  <Link href={`/mare/prenotazioni/${b.id}`} className="flex items-center justify-between hover:text-teal-700">
                    <span><Badge color="amber">Check-out</Badge> {b.guestName}</span>
                    <span className="text-slate-500">{formatDate(b.checkOut)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-slate-900">💶 Affitti non pagati</h2>
          {unpaidMonthly.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Nessun pagamento mancante.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {unpaidMonthly.map((p) => (
                <li key={p.id}>
                  <Link href={`/mensili/${p.propertyId}`} className="flex items-center justify-between hover:text-teal-700">
                    <span>{p.property.name} — {monthLabel(p.month)} {p.year}</span>
                    <span className="font-medium text-red-600">{formatCurrency(toNumber(p.amountDue))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-slate-900">📄 Contratti in scadenza (60 giorni)</h2>
          {expiringContracts.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Nessun contratto in scadenza a breve.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {expiringContracts.map((p) => (
                <li key={p.id}>
                  <Link href={`/mensili/${p.id}`} className="flex items-center justify-between hover:text-teal-700">
                    <span>{p.name}</span>
                    <span className="text-amber-600">{formatDate(p.contractEnd)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-slate-900">💡 Promemoria per bollette, IMU e condominio</h2>
          <p className="mt-2 text-sm text-slate-500">
            Queste scadenze non hanno una data fissa nel sistema: aggiungile qui sotto come promemoria personale (es. &quot;IMU 2ª rata&quot;, 16 dicembre).
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">Promemoria personali</h2>
        <form action={createReminder} className="mb-4 space-y-3 rounded-xl border border-slate-200 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Titolo">
              <Input name="title" required placeholder="Es. Pagamento IMU 2ª rata" />
            </Field>
            <Field label="Scadenza">
              <Input type="date" name="dueDate" />
            </Field>
            <Field label="Appartamento (opzionale)">
              <Select name="propertyId" defaultValue="">
                <option value="">Nessuno</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Descrizione (opzionale)">
            <Textarea name="description" rows={2} />
          </Field>
          <Button type="submit" size="sm">
            Aggiungi promemoria
          </Button>
        </form>

        {manualReminders.length === 0 ? (
          <p className="text-sm text-slate-500">Nessun promemoria personale.</p>
        ) : (
          <ul className="space-y-2">
            {manualReminders.map((r) => (
              <li
                key={r.id}
                className={`flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3 ${r.isDone ? "opacity-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <form action={toggleReminder.bind(null, r.id)}>
                    <button
                      type="submit"
                      className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${r.isDone ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`}
                      aria-label="Segna come completato"
                    >
                      {r.isDone ? "✓" : ""}
                    </button>
                  </form>
                  <div>
                    <p className={`text-sm font-medium text-slate-800 ${r.isDone ? "line-through" : ""}`}>{r.title}</p>
                    {r.description ? <p className="text-xs text-slate-500">{r.description}</p> : null}
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {r.dueDate ? <Badge color="amber">{formatDate(r.dueDate)}</Badge> : null}
                      {r.property ? <Badge>{r.property.name}</Badge> : null}
                    </div>
                  </div>
                </div>
                <form action={deleteReminder.bind(null, r.id)}>
                  <button type="submit" className="text-slate-400 hover:text-red-600" aria-label="Elimina">
                    ✕
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
