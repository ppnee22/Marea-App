import { prisma } from "@/lib/prisma";
import { getAllProperties } from "@/lib/queries";
import { NotesPanel } from "@/components/notes-panel";

export default async function NotesPage() {
  const [notes, properties] = await Promise.all([
    prisma.note.findMany({ include: { property: true }, orderBy: { createdAt: "desc" } }),
    getAllProperties(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Note</h1>
        <p className="mt-1 text-sm text-slate-500">Note generali o associate a un appartamento specifico</p>
      </div>
      <NotesPanel notes={notes} properties={properties.map((p) => ({ id: p.id, name: p.name }))} />
    </div>
  );
}
