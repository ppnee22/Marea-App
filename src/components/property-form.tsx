import { Button, Field, Input, Textarea } from "@/components/ui/primitives";
import { Property } from "@prisma/client";
import { toDateInputValue } from "@/lib/format";

export function MonthlyPropertyForm({
  action,
  initial,
  submitLabel = "Salva appartamento",
}: {
  action: (formData: FormData) => void;
  initial?: Property;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome / indirizzo appartamento">
          <Input name="name" required defaultValue={initial?.name} />
        </Field>
        <Field label="Indirizzo completo (opzionale)">
          <Input name="address" defaultValue={initial?.address ?? ""} />
        </Field>
        <Field label="Nome inquilino">
          <Input name="tenantName" defaultValue={initial?.tenantName ?? ""} />
        </Field>
        <Field label="Numero di telefono inquilino">
          <Input name="tenantPhone" defaultValue={initial?.tenantPhone ?? ""} />
        </Field>
        <Field label="Affitto mensile fisso (€)">
          <Input type="text" inputMode="decimal" name="monthlyRent" defaultValue={initial?.monthlyRent?.toString() ?? ""} />
        </Field>
        <Field label="Deposito cauzionale (€)">
          <Input type="text" inputMode="decimal" name="deposit" defaultValue={initial?.deposit?.toString() ?? ""} />
        </Field>
        <Field label="Data inizio contratto">
          <Input type="date" name="contractStart" defaultValue={toDateInputValue(initial?.contractStart)} />
        </Field>
        <Field label="Data fine contratto">
          <Input type="date" name="contractEnd" defaultValue={toDateInputValue(initial?.contractEnd)} />
        </Field>
      </div>
      <Field label="Note">
        <Textarea name="notes" rows={3} defaultValue={initial?.notes ?? ""} />
      </Field>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
