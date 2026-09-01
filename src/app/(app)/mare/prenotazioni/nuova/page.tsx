import { ensureSeasideProperty } from "@/lib/actions/properties";
import { getPlatformSettings } from "@/lib/queries";
import { toPlatformRates } from "@/lib/rates";
import { createBooking } from "@/lib/actions/bookings";
import { BookingForm } from "@/components/booking-form";
import { Card } from "@/components/ui/primitives";
import { toNumber } from "@/lib/calc";

export default async function NewBookingPage() {
  const property = await ensureSeasideProperty();
  const settings = await getPlatformSettings();
  const rates = toPlatformRates(settings);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Nuova prenotazione</h1>
      <Card>
        <BookingForm
          propertyId={property.id}
          action={createBooking}
          rates={rates}
          cityTaxRate={toNumber(property.cityTaxRate)}
        />
      </Card>
    </div>
  );
}
