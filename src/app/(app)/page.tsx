import Link from "next/link";
import {
  getAllProperties,
  getContractsExpiringSoon,
  getFutureBookings,
  getUnpaidMonthlyPayments,
  getUpcomingCheckInsOuts,
  computeBookingsBalance,
  computeMonthlyPropertyBalance,
} from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { monthLabel, toNumber } from "@/lib/calc";
import { PLATFORM_LABELS } from "@/lib/labels";
import { Badge, Card, EmptyState, StatCard } from "@/components/ui/primitives";

export default async function DashboardPage() {
  const now = new Date();
  const year = now.getUTCFullYear();

  const [properties, futureBookings, checkInOut, unpaidMonthly, expiringContracts, seasideProperty] =
    await Promise.all([
      getAllProperties(),
      getFutureBookings(6),
      getUpcomingCheckInsOuts(14),
      getUnpaidMonthlyPayments(year),
      getContractsExpiringSoon(60),
      prisma.property.findFirst({ where: { type: "SHORT_TERM" } }),
    ]);

  const monthlyProperties = properties.filter((p) => p.type === "MONTHLY" && !p.archived);

  const yearBookings = seasideProperty
    ? await prisma.booking.findMany({
        where: { propertyId: seasideProperty.id, checkIn: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } },
      })
    : [];
  const seasideBalance = await computeBookingsBalance(yearBookings.map((b) => b.id));

  const monthlyBalances = await Promise.all(
    monthlyProperties.map((p) => computeMonthlyPropertyBalance(p.id, year))
  );
  const monthlyTotals = monthlyBalances.reduce(
    (acc, b) => ({
      collected: acc.collected + b.totalRentCollected,
      expenses: acc.expenses + b.totalExpenses,
      outstanding: acc.outstanding + b.outstanding,
    }),
    { collected: 0, expenses: 0, outstanding: 0 }
  );

  const totalIncome = seasideBalance.totalIncome + monthlyTotals.collected;
  const totalExpenses = seasideBalance.totalExpenses + seasideBalance.totalCommission + seasideBalance.totalTaxes + seasideBalance.totalOtherDeductions + monthlyTotals.expenses;
  const netProfit = seasideBalance.netProfit + (monthlyTotals.collected - monthlyTotals.expenses);
  const outstanding = monthlyTotals.outstanding;

  const upcomingReminders = await prisma.reminder.findMany({
    where: { isDone: false },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Vista d&apos;insieme dell&apos;anno {year}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Incassi anno" value={formatCurrency(totalIncome)} color="green" />
        <StatCard label="Spese anno" value={formatCurrency(totalExpenses)} color="red" />
        <StatCard label="Guadagno netto" value={formatCurrency(netProfit)} color={netProfit >= 0 ? "green" : "red"} />
        <StatCard label="Affitti da ricevere" value={formatCurrency(outstanding)} color="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-slate-900">Check-in / check-out imminenti (14 giorni)</h2>
          {checkInOut.checkIns.length === 0 && checkInOut.checkOuts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nessun movimento nei prossimi 14 giorni.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {checkInOut.checkIns.map((b) => (
                <li key={`in-${b.id}`} className="flex items-center justify-between text-sm">
                  <span>
                    <Badge color="green">Check-in</Badge> <span className="ml-2">{b.guestName}</span>{" "}
                    <span className="text-slate-400">· {b.property.name}</span>
                  </span>
                  <span className="text-slate-500">{formatDate(b.checkIn)}</span>
                </li>
              ))}
              {checkInOut.checkOuts.map((b) => (
                <li key={`out-${b.id}`} className="flex items-center justify-between text-sm">
                  <span>
                    <Badge color="amber">Check-out</Badge> <span className="ml-2">{b.guestName}</span>{" "}
                    <span className="text-slate-400">· {b.property.name}</span>
                  </span>
                  <span className="text-slate-500">{formatDate(b.checkOut)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-slate-900">Prossime prenotazioni</h2>
          {futureBookings.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nessuna prenotazione futura registrata.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {futureBookings.map((b) => (
                <li key={b.id}>
                  <Link href={`/mare/prenotazioni/${b.id}`} className="flex items-center justify-between text-sm hover:text-teal-700">
                    <span>
                      <Badge color={b.platform === "BOOKING" ? "blue" : "purple"}>{PLATFORM_LABELS[b.platform]}</Badge>{" "}
                      <span className="ml-2">{b.guestName}</span>
                    </span>
                    <span className="text-slate-500">
                      {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-slate-900">Pagamenti mancanti (affitti mensili)</h2>
          {unpaidMonthly.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Tutti i pagamenti dovuti finora sono stati registrati.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {unpaidMonthly.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <Link href={`/mensili/${p.propertyId}`} className="flex items-center justify-between text-sm hover:text-teal-700">
                    <span>
                      {p.property.name} — {monthLabel(p.month)} {p.year}
                    </span>
                    <span className="font-medium text-red-600">{formatCurrency(toNumber(p.amountDue))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-slate-900">Scadenze importanti</h2>
          <ul className="mt-3 space-y-2">
            {expiringContracts.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span>Contratto {p.name}</span>
                <span className="text-amber-600">{formatDate(p.contractEnd)}</span>
              </li>
            ))}
            {upcomingReminders.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <Link href="/promemoria" className="hover:text-teal-700">
                  {r.title}
                </Link>
                <span className="text-slate-500">{r.dueDate ? formatDate(r.dueDate) : "—"}</span>
              </li>
            ))}
            {expiringContracts.length === 0 && upcomingReminders.length === 0 ? (
              <p className="text-sm text-slate-500">Nessuna scadenza imminente.</p>
            ) : null}
          </ul>
        </Card>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          title="Inizia configurando i tuoi appartamenti"
          description="Vai su “Mare” per impostare l'appartamento al mare o su “Affitti mensili” per aggiungere un appartamento."
        />
      ) : null}
    </div>
  );
}
