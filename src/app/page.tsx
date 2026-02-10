"use client";

import { useMemo, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "https://your-n8n-instance.com/webhook/chatbot";


export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "สวัสดีครับ พิมพ์ข้อความเพื่อเริ่มแชทได้เลย" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "demo";
    const key = "session_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(key, id);
    return id;
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.N8N_WEBHOOK_SECRET! },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: "U-001",
          customer_name: "Somchai",
          message: text,
        }),
      });

      const data = await res.json();
      const reply = data?.reply ?? "ขออภัย ระบบไม่สามารถตอบได้ในขณะนี้";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">N8N Web Chat AI</h1>
        <p className="text-white text-opacity-80">Powered by n8n & Gemini</p>
      </div>

      <div className="flex-1 rounded-lg p-4 h-[60vh] overflow-auto space-y-3 bg-white shadow-lg">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
              m.role === "user" 
                ? "bg-blue-100 text-gray-800" 
                : "bg-gray-100 text-gray-800"
            }`}>
              <div className="text-xs font-semibold mb-1 opacity-70">
                {m.role === "user" ? "You" : "Assistant"}
              </div>
              <div className="whitespace-pre-wrap text-sm">{m.text}</div>
            </div>
          </div>
        ))}
        {busy && (
          <div className="text-left">
            <div className="inline-block bg-gray-100 text-gray-800 rounded-lg px-4 py-2 shadow-sm">
              <div className="flex gap-1">
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 border-0 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
          disabled={busy}
        />
        <button
          className="px-6 py-3 rounded-lg bg-white text-blue-500 font-semibold disabled:opacity-60 hover:shadow-lg transition-shadow shadow-md disabled:cursor-not-allowed"
          onClick={send}
          disabled={busy}
        >
          {busy ? "..." : "Send"}
        </button>
      </div>

      <div className="text-xs text-white text-opacity-70 mt-3 text-center">
        Session: {sessionId.slice(0, 8)}...
      </div>
    </main>
  );
}
