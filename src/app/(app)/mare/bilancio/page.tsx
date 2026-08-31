import Link from "next/link";
import { ensureSeasideProperty } from "@/lib/actions/properties";
import { getMonthBookings, getYearBookings, computeBookingsBalance } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { MONTH_NAMES_IT } from "@/lib/calc";
import { Card, StatCard } from "@/components/ui/primitives";

export default async function BalancePage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const params = await searchParams;
  const currentYear = new Date().getUTCFullYear();
  const year = params.year ? Number(params.year) : currentYear;

  const property = await ensureSeasideProperty();
  const yearBookings = await getYearBookings(property.id, year);
  const annual = await computeBookingsBalance(yearBookings.map((b) => b.id));

  const bookingIds = yearBookings.filter((b) => b.platform === "BOOKING").map((b) => b.id);
  const airbnbIds = yearBookings.filter((b) => b.platform === "AIRBNB").map((b) => b.id);
  const [bookingBalance, airbnbBalance] = await Promise.all([
    computeBookingsBalance(bookingIds),
    computeBookingsBalance(airbnbIds),
  ]);

  const monthlyRows = await Promise.all(
    Array.from({ length: 12 }, (_, i) => i + 1).map(async (month) => {
      const bookings = await getMonthBookings(property.id, year, month);
      const balance = await computeBookingsBalance(bookings.map((b) => b.id));
      return { month, ...balance };
    })
  );

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Bilancio — {property.name}</h1>
        <div className="flex gap-2">
          {years.map((y) => (
            <Link
              key={y}
              href={`/mare/bilancio?year=${y}`}
              className={`rounded-full px-3 py-1 text-sm ${y === year ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {y}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Totale incassato" value={formatCurrency(annual.totalIncome)} color="green" />
        <StatCard label="Commissioni" value={formatCurrency(annual.totalCommission)} color="red" />
        <StatCard label="Tasse" value={formatCurrency(annual.totalTaxes)} color="red" />
        <StatCard label="Spese" value={formatCurrency(annual.totalExpenses)} color="red" />
        <StatCard label="Guadagno netto" value={formatCurrency(annual.netProfit)} color={annual.netProfit >= 0 ? "green" : "red"} />
        <StatCard label="Prenotazioni" value={String(annual.count)} />
        <StatCard label="Notti affittate" value={String(annual.nights)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-slate-900">Booking.com</h2>
          <p className="mt-2 text-2xl font-semibold text-sky-700">{formatCurrency(bookingBalance.netProfit)}</p>
          <p className="text-sm text-slate-500">
            {bookingBalance.count} prenotazioni · {bookingBalance.nights} notti · incassato {formatCurrency(bookingBalance.totalIncome)}
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold text-slate-900">Airbnb</h2>
          <p className="mt-2 text-2xl font-semibold text-purple-700">{formatCurrency(airbnbBalance.netProfit)}</p>
          <p className="text-sm text-slate-500">
            {airbnbBalance.count} prenotazioni · {airbnbBalance.nights} notti · incassato {formatCurrency(airbnbBalance.totalIncome)}
          </p>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <h2 className="mb-3 font-semibold text-slate-900">Dettaglio mensile {year}</h2>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="py-2">Mese</th>
              <th className="py-2 text-right">Incassato</th>
              <th className="py-2 text-right">Spese/commissioni</th>
              <th className="py-2 text-right">Netto</th>
              <th className="py-2 text-right">Prenotazioni</th>
              <th className="py-2 text-right">Notti</th>
            </tr>
          </thead>
          <tbody>
            {monthlyRows.map((row) => (
              <tr key={row.month} className="border-b border-slate-100">
                <td className="py-2">{MONTH_NAMES_IT[row.month - 1]}</td>
                <td className="py-2 text-right">{formatCurrency(row.totalIncome)}</td>
                <td className="py-2 text-right text-red-600">
                  -{formatCurrency(row.totalCommission + row.totalTaxes + row.totalOtherDeductions + row.totalExpenses)}
                </td>
                <td className={`py-2 text-right font-medium ${row.netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {formatCurrency(row.netProfit)}
                </td>
                <td className="py-2 text-right">{row.count}</td>
                <td className="py-2 text-right">{row.nights}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
