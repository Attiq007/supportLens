import { useEffect } from "react";
import { CATEGORY_COLORS } from "./categoryColors.js";

export default function TraceModal({ trace, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const color = CATEGORY_COLORS[trace.category] ?? "#64748b";

  const formatted = new Date(trace.timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {trace.category}
            </span>
            <span className="text-sm text-slate-500">{formatted}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Customer Message</p>
            <div className="bg-slate-50 rounded-xl p-4 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap border border-slate-200">
              {trace.user_message}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Bot Response</p>
            <div className="bg-indigo-50 rounded-xl p-4 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap border border-indigo-100">
              {trace.bot_response}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center gap-4 text-xs text-slate-400">
          <span>ID: {trace.id.slice(0, 8)}…</span>
          <span>Response time: {trace.response_time_ms}ms</span>
        </div>
      </div>
    </div>
  );
}
