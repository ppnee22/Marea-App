"use client";

import { useMemo, useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { formatCurrency } from "@/lib/format";

export interface PlatformRates {
  BOOKING: { commissionPercent: number; taxPercent: number };
  AIRBNB: { commissionPercent: number; taxPercent: number };
}

export interface BookingFormValues {
  guestName: string;
  platform: "BOOKING" | "AIRBNB";
  checkIn: string;
  checkOut: string;
  amountPaid: string;
  platformCommission: string;
  taxes: string;
  otherDeductions: string;
  notes: string;
}

const DEFAULT_VALUES: BookingFormValues = {
  guestName: "",
  platform: "BOOKING",
  checkIn: "",
  checkOut: "",
  amountPaid: "",
  platformCommission: "0",
  taxes: "0",
  otherDeductions: "0",
  notes: "",
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function BookingForm({
  propertyId,
  action,
  rates,
  initial,
  submitLabel = "Salva prenotazione",
  autoCalcDefault = true,
}: {
  propertyId: string;
  action: (formData: FormData) => void;
  rates: PlatformRates;
  initial?: Partial<BookingFormValues>;
  submitLabel?: string;
  autoCalcDefault?: boolean;
}) {
  const [values, setValues] = useState<BookingFormValues>({ ...DEFAULT_VALUES, ...initial });
  const [autoCalc, setAutoCalc] = useState(autoCalcDefault);

  const nights = useMemo(() => {
    if (!values.checkIn || !values.checkOut) return 0;
    const inD = new Date(values.checkIn);
    const outD = new Date(values.checkOut);
    const diff = Math.round((outD.getTime() - inD.getTime()) / 86_400_000);
    return diff > 0 ? diff : 0;
  }, [values.checkIn, values.checkOut]);

  const netProfit = useMemo(() => {
    const amount = Number(values.amountPaid.replace(",", ".")) || 0;
    const commission = Number(values.platformCommission.replace(",", ".")) || 0;
    const taxes = Number(values.taxes.replace(",", ".")) || 0;
    const other = Number(values.otherDeductions.replace(",", ".")) || 0;
    return amount - commission - taxes - other;
  }, [values.amountPaid, values.platformCommission, values.taxes, values.otherDeductions]);

  function applyAutoCalc(next: BookingFormValues) {
    if (!autoCalc) return next;
    const amount = Number(next.amountPaid.replace(",", ".")) || 0;
    const rate = rates[next.platform];
    return {
      ...next,
      platformCommission: String(round2((amount * rate.commissionPercent) / 100)),
      taxes: String(round2((amount * rate.taxPercent) / 100)),
    };
  }

  function update<K extends keyof BookingFormValues>(key: K, value: BookingFormValues[K]) {
    setValues((prev) => applyAutoCalc({ ...prev, [key]: value }));
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="propertyId" value={propertyId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome e cognome cliente">
          <Input
            name="guestName"
            required
            value={values.guestName}
            onChange={(e) => update("guestName", e.target.value)}
          />
        </Field>
        <Field label="Piattaforma">
          <Select
            name="platform"
            value={values.platform}
            onChange={(e) => update("platform", e.target.value as "BOOKING" | "AIRBNB")}
          >
            <option value="BOOKING">Booking.com</option>
            <option value="AIRBNB">Airbnb</option>
          </Select>
        </Field>
        <Field label="Check-in">
          <Input
            type="date"
            name="checkIn"
            required
            value={values.checkIn}
            onChange={(e) => update("checkIn", e.target.value)}
          />
        </Field>
        <Field label="Check-out">
          <Input
            type="date"
            name="checkOut"
            required
            value={values.checkOut}
            onChange={(e) => update("checkOut", e.target.value)}
          />
        </Field>
      </div>

      <p className="text-sm text-slate-500">
        Notti: <span className="font-medium text-slate-700">{nights}</span>
      </p>

      <div className="rounded-xl border border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Importi</h3>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={autoCalc}
              onChange={(e) => {
                setAutoCalc(e.target.checked);
                if (e.target.checked) setValues((prev) => applyAutoCalc(prev));
              }}
            />
            Calcola automaticamente commissioni/tasse
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Importo pagato dal cliente (€)">
            <Input
              type="text"
              inputMode="decimal"
              name="amountPaid"
              required
              value={values.amountPaid}
              onChange={(e) => update("amountPaid", e.target.value)}
            />
          </Field>
          <Field label="Commissioni piattaforma (€)">
            <Input
              type="text"
              inputMode="decimal"
              name="platformCommission"
              value={values.platformCommission}
              onChange={(e) => {
                setAutoCalc(false);
                update("platformCommission", e.target.value);
              }}
            />
          </Field>
          <Field label="Tasse (es. cedolare secca) (€)">
            <Input
              type="text"
              inputMode="decimal"
              name="taxes"
              value={values.taxes}
              onChange={(e) => {
                setAutoCalc(false);
                update("taxes", e.target.value);
              }}
            />
          </Field>
          <Field label="Altre trattenute (€)">
            <Input
              type="text"
              inputMode="decimal"
              name="otherDeductions"
              value={values.otherDeductions}
              onChange={(e) => update("otherDeductions", e.target.value)}
            />
          </Field>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Guadagno netto stimato (senza spese collegate):{" "}
          <span className="font-semibold text-teal-700">{formatCurrency(netProfit)}</span>
        </p>
      </div>

      <Field label="Note">
        <Textarea name="notes" rows={3} value={values.notes} onChange={(e) => update("notes", e.target.value)} />
      </Field>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
