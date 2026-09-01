"use client";

import { useMemo, useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { formatCurrency } from "@/lib/format";

export interface PlatformRates {
  BOOKING: { commissionPercent: number; transactionFeePercent: number; vatPercent: number; taxPercent: number };
  AIRBNB: { commissionPercent: number; transactionFeePercent: number; vatPercent: number; taxPercent: number };
}

export interface BookingFormValues {
  guestName: string;
  guests: string;
  platform: "BOOKING" | "AIRBNB";
  checkIn: string;
  checkOut: string;
  amountPaid: string;
  platformCommission: string;
  taxes: string;
  otherDeductions: string;
  cityTax: string;
  notes: string;
}

const DEFAULT_VALUES: BookingFormValues = {
  guestName: "",
  guests: "1",
  platform: "BOOKING",
  checkIn: "",
  checkOut: "",
  amountPaid: "",
  platformCommission: "0",
  taxes: "0",
  otherDeductions: "0",
  cityTax: "0",
  notes: "",
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function num(v: string) {
  return Number(v.replace(",", ".")) || 0;
}

export function BookingForm({
  propertyId,
  action,
  rates,
  cityTaxRate = 0,
  initial,
  submitLabel = "Salva prenotazione",
  autoCalcDefault = true,
}: {
  propertyId: string;
  action: (formData: FormData) => void;
  rates: PlatformRates;
  cityTaxRate?: number;
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

  const breakdown = useMemo(() => {
    const amount = num(values.amountPaid);
    const rate = rates[values.platform];
    const commission = (amount * rate.commissionPercent) / 100;
    const transactionFee = (amount * rate.transactionFeePercent) / 100;
    const vat = ((commission + transactionFee) * rate.vatPercent) / 100;
    return { commission, transactionFee, vat };
  }, [values.amountPaid, values.platform, rates]);

  const netProfit = useMemo(() => {
    const amount = num(values.amountPaid);
    const commission = num(values.platformCommission);
    const taxes = num(values.taxes);
    const other = num(values.otherDeductions);
    return amount - commission - taxes - other;
  }, [values.amountPaid, values.platformCommission, values.taxes, values.otherDeductions]);

  function applyAutoCalc(next: BookingFormValues) {
    if (!autoCalc) return next;
    const amount = num(next.amountPaid);
    const rate = rates[next.platform];
    const commission = (amount * rate.commissionPercent) / 100;
    const transactionFee = (amount * rate.transactionFeePercent) / 100;
    const vat = ((commission + transactionFee) * rate.vatPercent) / 100;
    const nightsCount = (() => {
      if (!next.checkIn || !next.checkOut) return 0;
      const diff = Math.round((new Date(next.checkOut).getTime() - new Date(next.checkIn).getTime()) / 86_400_000);
      return diff > 0 ? diff : 0;
    })();
    const guestsCount = Math.max(1, Math.round(num(next.guests)) || 1);
    return {
      ...next,
      platformCommission: String(round2(commission + transactionFee + vat)),
      taxes: String(round2((amount * rate.taxPercent) / 100)),
      cityTax: String(round2(nightsCount * guestsCount * cityTaxRate)),
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
        <Field label="Numero di ospiti">
          <Input
            type="number"
            min={1}
            name="guests"
            required
            value={values.guests}
            onChange={(e) => update("guests", e.target.value)}
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
        <div />
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
            Calcola automaticamente commissioni/IVA/tasse
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
          <Field label="Commissioni piattaforma + IVA (€)">
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

        {autoCalc ? (
          <p className="mt-2 text-xs text-slate-500">
            Dettaglio commissione: {formatCurrency(round2(breakdown.commission))}
            {breakdown.transactionFee > 0 ? ` + costo transazione ${formatCurrency(round2(breakdown.transactionFee))}` : ""} + IVA{" "}
            {formatCurrency(round2(breakdown.vat))}
          </p>
        ) : null}

        <p className="mt-3 text-sm text-slate-600">
          Guadagno netto stimato (senza spese collegate):{" "}
          <span className="font-semibold text-teal-700">{formatCurrency(netProfit)}</span>
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Field label="Tassa di soggiorno (€) — da versare al Comune, non è un guadagno">
          <Input
            type="text"
            inputMode="decimal"
            name="cityTax"
            value={values.cityTax}
            onChange={(e) => {
              setAutoCalc(false);
              update("cityTax", e.target.value);
            }}
          />
        </Field>
        <p className="mt-1 text-xs text-amber-700">
          Calcolata automaticamente come notti × ospiti × tariffa comunale. Non viene sottratta dal guadagno netto: viene tenuta da
          parte come importo da versare al Comune.
        </p>
      </div>

      <Field label="Note">
        <Textarea name="notes" rows={3} value={values.notes} onChange={(e) => update("notes", e.target.value)} />
      </Field>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
