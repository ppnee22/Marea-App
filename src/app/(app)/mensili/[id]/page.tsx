import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureYearPayments } from "@/lib/actions/monthly-payments";
import { computeMonthlyPropertyBalance } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge, Button, Card, StatCard } from "@/components/ui/primitives";
import { MonthlyPaymentsTable } from "@/components/monthly-payments-table";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { DocumentUploadForm } from "@/components/document-upload-form";
import { DocumentList } from "@/components/document-list";
import { NotesPanel } from "@/components/notes-panel";

export default async function MonthlyPropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id } = await params;
  const { year: yearParam } = await searchParams;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || property.type !== "MONTHLY") notFound();

  const currentYear = new Date().getUTCFullYear();
  const year = yearParam ? Number(yearParam) : currentYear;

  const [payments, expenses, documents, notes, balance] = await Promise.all([
    ensureYearPayments(property.id, year),
    prisma.expense.findMany({
      where: { propertyId: property.id, date: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } },
      orderBy: { date: "desc" },
    }),
    prisma.document.findMany({ where: { propertyId: property.id }, orderBy: { uploadedAt: "desc" } }),
    prisma.note.findMany({ where: { propertyId: property.id }, orderBy: { createdAt: "desc" } }),
    computeMonthlyPropertyBalance(property.id, year),
  ]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{property.name}</h1>
          {property.address ? <p className="text-sm text-slate-500">{property.address}</p> : null}
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
            {property.tenantName ? <Badge>Inquilino: {property.tenantName}</Badge> : null}
            {property.tenantPhone ? <Badge>{property.tenantPhone}</Badge> : null}
            {property.contractEnd ? <Badge color="amber">Contratto fino al {formatDate(property.contractEnd)}</Badge> : null}
          </div>
        </div>
        <Link href={`/mensili/${property.id}/modifica`}>
          <Button variant="secondary">Modifica</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {years.map((y) => (
          <Link
            key={y}
            href={`/mensili/${property.id}?year=${y}`}
            className={`rounded-full px-3 py-1 text-sm ${y === year ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {y}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Affitti incassati" value={formatCurrency(balance.totalRentCollected)} color="green" />
        <StatCard label="Spese" value={formatCurrency(balance.totalExpenses)} color="red" />
        <StatCard label="Guadagno netto" value={formatCurrency(balance.netProfit)} color={balance.netProfit >= 0 ? "green" : "red"} />
        <StatCard label="Da ricevere" value={formatCurrency(balance.outstanding)} color="amber" />
      </div>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">Pagamenti mensili {year}</h2>
        <MonthlyPaymentsTable payments={payments} />
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Spese ({year})</h2>
          <ExpenseForm propertyId={property.id} />
        </div>
        <ExpenseList expenses={expenses} />
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Documenti</h2>
          <DocumentUploadForm propertyId={property.id} />
        </div>
        <DocumentList documents={documents} />
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">Note</h2>
        <NotesPanel notes={notes} propertyId={property.id} />
      </Card>
    </div>
  );
}
