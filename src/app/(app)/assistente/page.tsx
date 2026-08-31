import { AssistantChat } from "@/components/assistant-chat";

export default function AssistantPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Assistente IA</h1>
        <p className="mt-1 text-sm text-slate-500">Fai domande sui tuoi dati di gestione (anno corrente)</p>
      </div>
      <AssistantChat />
    </div>
  );
}
