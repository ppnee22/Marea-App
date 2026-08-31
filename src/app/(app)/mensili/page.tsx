import Link from "next/link";
import { getMonthlyProperties, computeMonthlyPropertyBalance } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { Badge, Button, Card, EmptyState } from "@/components/ui/primitives";

export default async function MonthlyPropertiesPage() {
  const properties = await getMonthlyProperties();
  const year = new Date().getUTCFullYear();
  const balances = await Promise.all(properties.map((p) => computeMonthlyPropertyBalance(p.id, year)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Affitti mensili</h1>
          <p className="mt-1 text-sm text-slate-500">I tuoi appartamenti in affitto mensile</p>
        </div>
        <Link href="/mensili/nuovo">
          <Button>+ Nuovo appartamento</Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <EmptyState title="Nessun appartamento" description="Aggiungi il primo appartamento in affitto mensile." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p, i) => {
            const balance = balances[i];
            return (
              <Link key={p.id} href={`/mensili/${p.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  {p.tenantName ? <p className="text-sm text-slate-500">Inquilino: {p.tenantName}</p> : null}
                  <div className="mt-3 flex items-center justify-between">
                    <Badge color="green">{formatCurrency(p.monthlyRent ? Number(p.monthlyRent) : 0)}/mese</Badge>
                    {balance.outstanding > 0 ? (
                      <Badge color="red">{formatCurrency(balance.outstanding)} da ricevere</Badge>
                    ) : (
                      <Badge color="green">In regola</Badge>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
