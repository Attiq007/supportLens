import { useEffect, useRef, useState } from "react";
import { createTrace, sendChat } from "../api.js";
import { CATEGORY_COLORS } from "./categoryColors.js";

function TypingIndicator() {
  return (
    <div className="flex gap-1.5 items-center px-4 py-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function ChatPanel({ onNewTrace, switchToDashboard }) {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I'm the BillFlow support assistant. How can I help you today?",
      category: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const chatRes = await sendChat(text);
      const traceRes = await createTrace(text, chatRes.bot_response, chatRes.response_time_ms);

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: chatRes.bot_response, category: traceRes.category, response_time_ms: chatRes.response_time_ms },
      ]);
      onNewTrace();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Sorry, I'm having trouble connecting. Please try again.", category: null },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col" style={{ height: "calc(100vh - 12rem)" }}>
        {/* Chat header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">BillFlow Support</p>
            <p className="text-xs text-green-500 font-medium">● Online</p>
          </div>
          <button
            onClick={switchToDashboard}
            className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            View dashboard
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${msg.role === "user" ? "" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "bg-slate-100 text-slate-800 rounded-tl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === "bot" && msg.category && (
                  <div className="flex items-center gap-2 mt-1.5 pl-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: CATEGORY_COLORS[msg.category] ?? "#64748b" }}
                    >
                      {msg.category}
                    </span>
                    {msg.response_time_ms && (
                      <span className="text-xs text-slate-400">{msg.response_time_ms}ms</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm">
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-slate-200">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your message… (Enter to send)"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 max-h-32 leading-relaxed"
              style={{ minHeight: "42px" }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Each conversation is classified and logged to the{" "}
            <button onClick={switchToDashboard} className="text-indigo-500 hover:underline">
              observability dashboard
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
