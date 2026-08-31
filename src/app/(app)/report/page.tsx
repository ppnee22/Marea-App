import Link from "next/link";
import { getAllProperties, computeBookingsBalance, computeMonthlyPropertyBalance, getYearBookings } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { PLATFORM_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/labels";
import { Badge, Card, StatCard } from "@/components/ui/primitives";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const params = await searchParams;
  const currentYear = new Date().getUTCFullYear();
  const year = params.year ? Number(params.year) : currentYear;
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const properties = await getAllProperties();

  const rows = await Promise.all(
    properties.map(async (p) => {
      if (p.type === "SHORT_TERM") {
        const bookings = await getYearBookings(p.id, year);
        const balance = await computeBookingsBalance(bookings.map((b) => b.id));
        return {
          id: p.id,
          name: p.name,
          type: p.type,
          income: balance.totalIncome,
          expenses: balance.totalCommission + balance.totalTaxes + balance.totalOtherDeductions + balance.totalExpenses,
          netProfit: balance.netProfit,
        };
      }
      const balance = await computeMonthlyPropertyBalance(p.id, year);
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        income: balance.totalRentCollected,
        expenses: balance.totalExpenses,
        netProfit: balance.netProfit,
      };
    })
  );

  const totals = rows.reduce(
    (acc, r) => ({ income: acc.income + r.income, expenses: acc.expenses + r.expenses, netProfit: acc.netProfit + r.netProfit }),
    { income: 0, expenses: 0, netProfit: 0 }
  );

  const ranked = [...rows].sort((a, b) => b.netProfit - a.netProfit);

  const seaside = properties.find((p) => p.type === "SHORT_TERM");
  let platformComparison: { platform: "BOOKING" | "AIRBNB"; netProfit: number; income: number; count: number }[] = [];
  if (seaside) {
    const yearBookings = await getYearBookings(seaside.id, year);
    const bookingIds = yearBookings.filter((b) => b.platform === "BOOKING").map((b) => b.id);
    const airbnbIds = yearBookings.filter((b) => b.platform === "AIRBNB").map((b) => b.id);
    const [bookingBalance, airbnbBalance] = await Promise.all([
      computeBookingsBalance(bookingIds),
      computeBookingsBalance(airbnbIds),
    ]);
    platformComparison = [
      { platform: "BOOKING", netProfit: bookingBalance.netProfit, income: bookingBalance.totalIncome, count: bookingBalance.count },
      { platform: "AIRBNB", netProfit: airbnbBalance.netProfit, income: airbnbBalance.totalIncome, count: airbnbBalance.count },
    ];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Report e statistiche</h1>
          <p className="mt-1 text-sm text-slate-500">Entrate → Spese → Guadagno netto, per l&apos;anno {year}</p>
        </div>
        <div className="flex gap-2">
          {years.map((y) => (
            <Link
              key={y}
              href={`/report?year=${y}`}
              className={`rounded-full px-3 py-1 text-sm ${y === year ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {y}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Entrate totali" value={formatCurrency(totals.income)} color="green" />
        <StatCard label="Spese totali" value={formatCurrency(totals.expenses)} color="red" />
        <StatCard label="Guadagno netto totale" value={formatCurrency(totals.netProfit)} color={totals.netProfit >= 0 ? "green" : "red"} />
      </div>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">Confronto redditività tra appartamenti</h2>
        {ranked.length === 0 ? (
          <p className="text-sm text-slate-500">Nessun appartamento configurato.</p>
        ) : (
          <ol className="space-y-2">
            {ranked.map((r, i) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">{r.name}</p>
                    <Badge>{PROPERTY_TYPE_LABELS[r.type]}</Badge>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-slate-500">
                    Entrate {formatCurrency(r.income)} · Spese {formatCurrency(r.expenses)}
                  </p>
                  <p className={`font-semibold ${r.netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    Netto {formatCurrency(r.netProfit)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {platformComparison.length > 0 ? (
        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Booking vs Airbnb</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {platformComparison.map((p) => (
              <div key={p.platform} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-600">{PLATFORM_LABELS[p.platform]}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{formatCurrency(p.netProfit)}</p>
                <p className="text-xs text-slate-500">
                  {p.count} prenotazioni · incassato {formatCurrency(p.income)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/mare/bilancio">
          <Card className="transition-shadow hover:shadow-md">
            <p className="font-semibold text-slate-900">📈 Bilancio dettagliato — Mare</p>
            <p className="mt-1 text-sm text-slate-500">Dettaglio mensile, Booking vs Airbnb</p>
          </Card>
        </Link>
        <Link href="/mensili">
          <Card className="transition-shadow hover:shadow-md">
            <p className="font-semibold text-slate-900">🏢 Dettaglio affitti mensili</p>
            <p className="mt-1 text-sm text-slate-500">Pagamenti e spese per ogni appartamento</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
