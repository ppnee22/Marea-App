import { Document } from "@prisma/client";
import { formatDate } from "@/lib/format";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/labels";
import { deleteDocument } from "@/lib/actions/documents";
import { Badge } from "@/components/ui/primitives";

function isImage(mimeType: string | null) {
  return !!mimeType && mimeType.startsWith("image/");
}

export function DocumentList({ documents }: { documents: Document[] }) {
  if (documents.length === 0) {
    return <p className="text-sm text-slate-500">Nessun documento caricato.</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((d) => (
        <li key={d.id} className="overflow-hidden rounded-xl border border-slate-200">
          <a href={d.fileUrl} target="_blank" rel="noreferrer" className="block">
            {isImage(d.mimeType) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.fileUrl} alt={d.fileName} className="h-32 w-full object-cover" />
            ) : (
              <div className="flex h-32 w-full items-center justify-center bg-slate-50 text-3xl">📄</div>
            )}
          </a>
          <div className="p-3">
            <Badge>{DOCUMENT_CATEGORY_LABELS[d.category]}</Badge>
            <p className="mt-1 truncate text-sm text-slate-700">{d.fileName}</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-slate-400">{formatDate(d.uploadedAt)}</span>
              <form action={deleteDocument.bind(null, d.id)}>
                <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
                  Elimina
                </button>
              </form>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
