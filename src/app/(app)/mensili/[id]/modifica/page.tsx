import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateMonthlyProperty, archiveMonthlyProperty } from "@/lib/actions/properties";
import { MonthlyPropertyForm } from "@/components/property-form";
import { Button, Card } from "@/components/ui/primitives";

export default async function EditMonthlyPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || property.type !== "MONTHLY") notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Modifica appartamento</h1>
      <Card>
        <MonthlyPropertyForm action={updateMonthlyProperty.bind(null, property.id)} initial={property} submitLabel="Salva modifiche" />
      </Card>
      <Card>
        <h2 className="font-semibold text-slate-900">Zona pericolosa</h2>
        <p className="mt-1 text-sm text-slate-500">Archivia l&apos;appartamento se non è più in gestione. I dati storici restano consultabili.</p>
        <form action={archiveMonthlyProperty.bind(null, property.id)} className="mt-3">
          <Button type="submit" variant="danger">
            Archivia appartamento
          </Button>
        </form>
      </Card>
    </div>
  );
}
