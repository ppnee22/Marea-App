import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/queries";
import { updateBooking } from "@/lib/actions/bookings";
import { BookingForm } from "@/components/booking-form";
import { Card } from "@/components/ui/primitives";
import { toDateInputValue } from "@/lib/format";

export default async function EditBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) notFound();

  const settings = await getPlatformSettings();
  const rates = {
    BOOKING: { commissionPercent: Number(settings.BOOKING.commissionPercent), taxPercent: Number(settings.BOOKING.taxPercent) },
    AIRBNB: { commissionPercent: Number(settings.AIRBNB.commissionPercent), taxPercent: Number(settings.AIRBNB.taxPercent) },
  };

  const updateWithId = updateBooking.bind(null, booking.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Modifica prenotazione</h1>
      <Card>
        <BookingForm
          propertyId={booking.propertyId}
          action={updateWithId}
          rates={rates}
          submitLabel="Salva modifiche"
          autoCalcDefault={false}
          initial={{
            guestName: booking.guestName,
            platform: booking.platform,
            checkIn: toDateInputValue(booking.checkIn),
            checkOut: toDateInputValue(booking.checkOut),
            amountPaid: String(booking.amountPaid),
            platformCommission: String(booking.platformCommission),
            taxes: String(booking.taxes),
            otherDeductions: String(booking.otherDeductions),
            notes: booking.notes ?? "",
          }}
        />
      </Card>
    </div>
  );
}
