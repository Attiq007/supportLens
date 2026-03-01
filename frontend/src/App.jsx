import { useCallback, useEffect, useState } from "react";
import { fetchAnalytics, fetchTraces } from "./api.js";
import Analytics from "./components/Analytics.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import TraceTable from "./components/TraceTable.jsx";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [analytics, setAnalytics] = useState(null);
  const [traces, setTraces] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [analyticsData, tracesData] = await Promise.all([
        fetchAnalytics(),
        fetchTraces(categoryFilter, searchQuery || null),
      ]);
      setAnalytics(analyticsData);
      setTraces(tracesData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNewTrace = useCallback(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navbar */}
      <header className="bg-slate-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-0 flex items-center justify-between">
          <div className="flex items-center gap-3 py-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">SupportLens</span>
            <span className="text-slate-400 text-sm font-medium hidden sm:block">Observability Platform</span>
          </div>

          <nav className="flex">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-5 py-5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "dashboard"
                  ? "text-indigo-400 border-indigo-400"
                  : "text-slate-400 border-transparent hover:text-slate-200"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("chatbot")}
              className={`px-5 py-5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "chatbot"
                  ? "text-indigo-400 border-indigo-400"
                  : "text-slate-400 border-transparent hover:text-slate-200"
              }`}
            >
              Chatbot
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "dashboard" ? (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-slate-500">Loading...</div>
              </div>
            ) : (
              <>
                <Analytics analytics={analytics} />
                <TraceTable
                  traces={traces}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onRefresh={loadData}
                />
              </>
            )}
          </div>
        ) : (
          <ChatPanel onNewTrace={handleNewTrace} switchToDashboard={() => setActiveTab("dashboard")} />
        )}
      </main>
    </div>
  );
}
