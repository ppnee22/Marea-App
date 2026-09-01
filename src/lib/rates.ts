import "server-only";
import { PlatformRates } from "@/components/booking-form";
import { getPlatformSettings } from "@/lib/queries";

type PlatformSettingsResult = Awaited<ReturnType<typeof getPlatformSettings>>;

export function toPlatformRates(settings: PlatformSettingsResult): PlatformRates {
  return {
    BOOKING: {
      commissionPercent: Number(settings.BOOKING.commissionPercent),
      transactionFeePercent: Number(settings.BOOKING.transactionFeePercent),
      vatPercent: Number(settings.BOOKING.vatPercent),
      taxPercent: Number(settings.BOOKING.taxPercent),
    },
    AIRBNB: {
      commissionPercent: Number(settings.AIRBNB.commissionPercent),
      transactionFeePercent: Number(settings.AIRBNB.transactionFeePercent),
      vatPercent: Number(settings.AIRBNB.vatPercent),
      taxPercent: Number(settings.AIRBNB.taxPercent),
    },
  };
}
