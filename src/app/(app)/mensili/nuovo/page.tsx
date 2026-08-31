import { createMonthlyProperty } from "@/lib/actions/properties";
import { MonthlyPropertyForm } from "@/components/property-form";
import { Card } from "@/components/ui/primitives";

export default function NewMonthlyPropertyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Nuovo appartamento (affitto mensile)</h1>
      <Card>
        <MonthlyPropertyForm action={createMonthlyProperty} />
      </Card>
    </div>
  );
}
