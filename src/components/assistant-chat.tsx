"use client";

import { useRef, useState } from "react";
import { askAssistant, ChatMessage } from "@/lib/ai/assistant";
import { Button, Textarea } from "@/components/ui/primitives";

const SUGGESTIONS = [
  "Quanto ho guadagnato questo mese?",
  "Quale appartamento mi rende di più?",
  "Quali affitti non sono stati pagati?",
  "Quanto ho speso in manutenzione quest'anno?",
  "Quanto ho guadagnato con Booking rispetto ad Airbnb?",
];

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    const nextHistory: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const reply = await askAssistant(nextHistory);
      setMessages([...nextHistory, { role: "assistant", content: reply }]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore nella richiesta all'assistente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col md:h-[calc(100dvh-8rem)]">
      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Chiedi qualcosa sui tuoi dati, ad esempio:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user" ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading ? <p className="text-sm text-slate-400">L&apos;assistente sta pensando...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Scrivi una domanda..."
          className="resize-none"
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          Invia
        </Button>
      </form>
    </div>
  );
}
