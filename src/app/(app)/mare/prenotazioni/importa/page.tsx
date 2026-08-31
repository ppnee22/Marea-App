import { ensureSeasideProperty } from "@/lib/actions/properties";
import { getPlatformSettings } from "@/lib/queries";
import { ImportBookingFlow } from "@/components/import-booking-flow";

export default async function ImportBookingPage() {
  const property = await ensureSeasideProperty();
  const settings = await getPlatformSettings();

  const rates = {
    BOOKING: { commissionPercent: Number(settings.BOOKING.commissionPercent), taxPercent: Number(settings.BOOKING.taxPercent) },
    AIRBNB: { commissionPercent: Number(settings.AIRBNB.commissionPercent), taxPercent: Number(settings.AIRBNB.taxPercent) },
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Importa prenotazione da screenshot</h1>
        <p className="mt-1 text-sm text-slate-500">
          Carica fino a 2 foto della prenotazione (Booking o Airbnb): l&apos;IA leggerà automaticamente i dati principali.
        </p>
      </div>
      <ImportBookingFlow propertyId={property.id} rates={rates} />
    </div>
  );
}
