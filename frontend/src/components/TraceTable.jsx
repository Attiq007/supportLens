import { useCallback, useEffect, useRef, useState } from "react";
import { exportTracesUrl, fetchTraces } from "../api.js";
import { CATEGORY_COLORS } from "./categoryColors.js";
import TraceModal from "./TraceModal.jsx";

const CATEGORIES = ["Billing", "Refund", "Account Access", "Cancellation", "General Inquiry"];

function truncate(str, len = 70) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

function formatTime(ms) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TraceTable({
  traces,
  categoryFilter,
  setCategoryFilter,
  searchQuery,
  setSearchQuery,
  onRefresh,
}) {
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [localSearch, setSearchQuery]);

  const handleCategoryFilter = (cat) => {
    setCategoryFilter(cat === categoryFilter ? null : cat);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold text-slate-700">Trace Log</h2>
          <div className="flex items-center gap-2">
            <a
              href={exportTracesUrl(categoryFilter)}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Export as CSV"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </a>
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search messages…"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 w-48"
            />
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !categoryFilter
                  ? "bg-slate-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors`}
                style={
                  categoryFilter === cat
                    ? { backgroundColor: CATEGORY_COLORS[cat], color: "white" }
                    : { backgroundColor: CATEGORY_COLORS[cat] + "20", color: CATEGORY_COLORS[cat] }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {traces.length === 0 ? (
          <div className="text-center text-slate-400 py-12 text-sm">No traces found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Timestamp</th>
                <th className="px-5 py-3 text-left">Customer Message</th>
                <th className="px-5 py-3 text-left">Bot Response</th>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-right">Response Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {traces.map((trace) => {
                const color = CATEGORY_COLORS[trace.category] ?? "#64748b";
                return (
                  <tr
                    key={trace.id}
                    onClick={() => setSelectedTrace(trace)}
                    className="hover:bg-indigo-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                      {formatDate(trace.timestamp)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 max-w-xs">
                      <span className="group-hover:text-indigo-700 transition-colors">
                        {truncate(trace.user_message, 65)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-xs">
                      {truncate(trace.bot_response, 65)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap"
                        style={{ backgroundColor: color }}
                      >
                        {trace.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-right whitespace-nowrap font-mono text-xs">
                      {formatTime(trace.response_time_ms)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Row count */}
      {traces.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
          Showing {traces.length} trace{traces.length !== 1 ? "s" : ""}
          {categoryFilter ? ` in ${categoryFilter}` : ""}
          {localSearch ? ` matching "${localSearch}"` : ""}
          . Click a row to see full details.
        </div>
      )}

      {selectedTrace && (
        <TraceModal trace={selectedTrace} onClose={() => setSelectedTrace(null)} />
      )}
    </div>
  );
}
