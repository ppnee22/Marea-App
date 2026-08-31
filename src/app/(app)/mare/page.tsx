import Link from "next/link";
import { ensureSeasideProperty } from "@/lib/actions/properties";
import { getYearBookings, computeBookingsBalance } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { Button, Card, StatCard } from "@/components/ui/primitives";

export default async function MarePage() {
  const property = await ensureSeasideProperty();
  const year = new Date().getUTCFullYear();
  const bookings = await getYearBookings(property.id, year);
  const balance = await computeBookingsBalance(bookings.map((b) => b.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{property.name}</h1>
          <p className="mt-1 text-sm text-slate-500">Affitti brevi — Booking.com e Airbnb</p>
        </div>
        <div className="flex gap-2">
          <Link href="/mare/prenotazioni/importa">
            <Button variant="secondary">📷 Importa da screenshot</Button>
          </Link>
          <Link href="/mare/prenotazioni/nuova">
            <Button>+ Nuova prenotazione</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label={`Incassato ${year}`} value={formatCurrency(balance.totalIncome)} color="green" />
        <StatCard label="Guadagno netto" value={formatCurrency(balance.netProfit)} color={balance.netProfit >= 0 ? "green" : "red"} />
        <StatCard label="Prenotazioni" value={String(balance.count)} />
        <StatCard label="Notti affittate" value={String(balance.nights)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/mare/prenotazioni">
          <Card className="h-full transition-shadow hover:shadow-md">
            <p className="font-semibold text-slate-900">📋 Prenotazioni</p>
            <p className="mt-1 text-sm text-slate-500">Elenco completo, modifica, spese e note per ogni prenotazione</p>
          </Card>
        </Link>
        <Link href="/mare/calendario">
          <Card className="h-full transition-shadow hover:shadow-md">
            <p className="font-semibold text-slate-900">📅 Calendario</p>
            <p className="mt-1 text-sm text-slate-500">Check-in, check-out e giorni occupati/liberi</p>
          </Card>
        </Link>
        <Link href="/mare/bilancio">
          <Card className="h-full transition-shadow hover:shadow-md">
            <p className="font-semibold text-slate-900">📈 Bilancio</p>
            <p className="mt-1 text-sm text-slate-500">Totali mensili e annuali, confronto Booking vs Airbnb</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
