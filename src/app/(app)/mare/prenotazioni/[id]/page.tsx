import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { bookingGrossProfit, nightsBetween, sumBy } from "@/lib/calc";
import { formatCurrency, formatDate } from "@/lib/format";
import { PLATFORM_LABELS } from "@/lib/labels";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { DocumentUploadForm } from "@/components/document-upload-form";
import { DocumentList } from "@/components/document-list";
import { deleteBooking, updateBookingNotes } from "@/lib/actions/bookings";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { property: true, expenses: { orderBy: { date: "desc" } }, documents: true },
  });
  if (!booking) notFound();

  const expensesTotal = sumBy(booking.expenses, (e) => e.amount);
  const grossProfit = bookingGrossProfit(booking);
  const netProfit = grossProfit - expensesTotal;
  const nights = nightsBetween(booking.checkIn, booking.checkOut);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge color={booking.platform === "BOOKING" ? "blue" : "purple"}>{PLATFORM_LABELS[booking.platform]}</Badge>
            <h1 className="text-2xl font-semibold text-slate-900">{booking.guestName}</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} · {nights} notti · {booking.property.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/mare/prenotazioni/${booking.id}/modifica`}>
            <Button variant="secondary">Modifica</Button>
          </Link>
          <form action={deleteBooking.bind(null, booking.id)}>
            <Button variant="danger" type="submit">
              Elimina
            </Button>
          </form>
        </div>
      </div>

      <Card>
        <h2 className="font-semibold text-slate-900">Calcolo guadagno netto</h2>
        <dl className="mt-3 divide-y divide-slate-100 text-sm">
          <div className="flex justify-between py-1.5">
            <dt className="text-slate-500">Importo pagato dal cliente</dt>
            <dd className="font-medium text-slate-900">{formatCurrency(Number(booking.amountPaid))}</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-slate-500">Commissioni piattaforma</dt>
            <dd className="text-red-600">-{formatCurrency(Number(booking.platformCommission))}</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-slate-500">Tasse</dt>
            <dd className="text-red-600">-{formatCurrency(Number(booking.taxes))}</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-slate-500">Altre trattenute</dt>
            <dd className="text-red-600">-{formatCurrency(Number(booking.otherDeductions))}</dd>
          </div>
          <div className="flex justify-between py-1.5">
            <dt className="text-slate-500">Spese collegate ({booking.expenses.length})</dt>
            <dd className="text-red-600">-{formatCurrency(expensesTotal)}</dd>
          </div>
          <div className="flex justify-between pt-2 text-base">
            <dt className="font-semibold text-slate-900">Guadagno netto</dt>
            <dd className={`font-bold ${netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {formatCurrency(netProfit)}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Spese collegate</h2>
          <ExpenseForm propertyId={booking.propertyId} bookingId={booking.id} />
        </div>
        <ExpenseList expenses={booking.expenses} />
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Screenshot e documenti</h2>
          <DocumentUploadForm propertyId={booking.propertyId} bookingId={booking.id} defaultCategory="SCREENSHOT_PRENOTAZIONE" />
        </div>
        <DocumentList documents={booking.documents} />
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900">Note</h2>
        <form action={updateBookingNotes.bind(null, booking.id)} className="mt-3 space-y-2">
          <textarea
            name="notes"
            defaultValue={booking.notes ?? ""}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
          <Button type="submit" size="sm">
            Salva nota
          </Button>
        </form>
      </Card>
    </div>
  );
}
