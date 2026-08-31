import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAllProperties } from "@/lib/queries";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/labels";
import { DocumentUploadForm } from "@/components/document-upload-form";
import { DocumentList } from "@/components/document-list";
import { Card } from "@/components/ui/primitives";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string }>;
}) {
  const params = await searchParams;
  const properties = await getAllProperties();

  const documents = await prisma.document.findMany({
    where: params.propertyId ? { propertyId: params.propertyId } : {},
    include: { property: true },
    orderBy: { uploadedAt: "desc" },
  });

  const grouped = new Map<string, typeof documents>();
  for (const doc of documents) {
    const key = doc.category;
    grouped.set(key, [...(grouped.get(key) ?? []), doc]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Documenti</h1>
          <p className="mt-1 text-sm text-slate-500">Contratti, fatture, ricevute e altri documenti per appartamento</p>
        </div>
        <DocumentUploadForm propertyId={params.propertyId} properties={properties.map((p) => ({ id: p.id, name: p.name }))} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/documenti"
          className={`rounded-full px-3 py-1 text-xs ${!params.propertyId ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Tutti gli appartamenti
        </Link>
        {properties.map((p) => (
          <Link
            key={p.id}
            href={`/documenti?propertyId=${p.id}`}
            className={`rounded-full px-3 py-1 text-xs ${params.propertyId === p.id ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {p.name}
          </Link>
        ))}
      </div>

      {documents.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">Nessun documento caricato.</p>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([category, docs]) => (
          <Card key={category}>
            <h2 className="mb-3 font-semibold text-slate-900">
              {DOCUMENT_CATEGORY_LABELS[category as keyof typeof DOCUMENT_CATEGORY_LABELS]}
            </h2>
            <DocumentList documents={docs} />
          </Card>
        ))
      )}
    </div>
  );
}
