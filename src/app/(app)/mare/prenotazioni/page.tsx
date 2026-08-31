import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ensureSeasideProperty } from "@/lib/actions/properties";
import { formatCurrency, formatDate } from "@/lib/format";
import { bookingNetProfit, nightsBetween } from "@/lib/calc";
import { PLATFORM_LABELS } from "@/lib/labels";
import { Badge, Button, Card, EmptyState } from "@/components/ui/primitives";

export default async function BookingsListPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; platform?: string }>;
}) {
  const params = await searchParams;
  const property = await ensureSeasideProperty();
  const year = params.year ? Number(params.year) : new Date().getUTCFullYear();
  const platform = params.platform === "BOOKING" || params.platform === "AIRBNB" ? params.platform : undefined;

  const bookings = await prisma.booking.findMany({
    where: {
      propertyId: property.id,
      checkIn: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) },
      ...(platform ? { platform } : {}),
    },
    include: { expenses: true },
    orderBy: { checkIn: "desc" },
  });

  const currentYear = new Date().getUTCFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Prenotazioni</h1>
        <Link href="/mare/prenotazioni/nuova">
          <Button>+ Nuova prenotazione</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {years.map((y) => (
          <Link
            key={y}
            href={`/mare/prenotazioni?year=${y}${platform ? `&platform=${platform}` : ""}`}
            className={`rounded-full px-3 py-1 text-sm ${y === year ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {y}
          </Link>
        ))}
        <span className="mx-1 text-slate-300">|</span>
        <Link
          href={`/mare/prenotazioni?year=${year}`}
          className={`rounded-full px-3 py-1 text-sm ${!platform ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Tutte
        </Link>
        <Link
          href={`/mare/prenotazioni?year=${year}&platform=BOOKING`}
          className={`rounded-full px-3 py-1 text-sm ${platform === "BOOKING" ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Booking
        </Link>
        <Link
          href={`/mare/prenotazioni?year=${year}&platform=AIRBNB`}
          className={`rounded-full px-3 py-1 text-sm ${platform === "AIRBNB" ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Airbnb
        </Link>
      </div>

      {bookings.length === 0 ? (
        <EmptyState title="Nessuna prenotazione" description="Aggiungi la prima prenotazione manualmente o importa uno screenshot." />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const expensesTotal = b.expenses.reduce((acc, e) => acc + Number(e.amount), 0);
            const net = bookingNetProfit(b, expensesTotal);
            return (
              <Link key={b.id} href={`/mare/prenotazioni/${b.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge color={b.platform === "BOOKING" ? "blue" : "purple"}>{PLATFORM_LABELS[b.platform]}</Badge>
                        <p className="font-semibold text-slate-900">{b.guestName}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {nightsBetween(b.checkIn, b.checkOut)} notti
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Incassato {formatCurrency(Number(b.amountPaid))}</p>
                      <p className={`font-semibold ${net >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                        Netto {formatCurrency(net)}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
