import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const CATEGORIES = [
  { name: "Billing", color: "#3b82f6" },
  { name: "Refund", color: "#a855f7" },
  { name: "Account Access", color: "#f97316" },
  { name: "Cancellation", color: "#ef4444" },
  { name: "General Inquiry", color: "#22c55e" },
];

const COLOR_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.name, c.color]));

export default function Analytics({ analytics }) {
  if (!analytics) return null;

  const chartData = CATEGORIES.map((cat) => ({
    name: cat.name,
    value: analytics.categories[cat.name]?.count ?? 0,
    color: cat.color,
  })).filter((d) => d.value > 0);

  return (
    <div>
      {/* Top stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Traces</p>
          <p className="text-4xl font-bold text-slate-900 mt-1">{analytics.total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Avg Response Time</p>
          <p className="text-4xl font-bold text-slate-900 mt-1">
            {analytics.avg_response_time_ms < 1000
              ? `${Math.round(analytics.avg_response_time_ms)}ms`
              : `${(analytics.avg_response_time_ms / 1000).toFixed(1)}s`}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-5">Category Breakdown</h2>
        <div className="flex gap-6 items-center">
          {/* Category cards */}
          <div className="flex-1 grid grid-cols-5 gap-3">
            {CATEGORIES.map((cat) => {
              const stats = analytics.categories[cat.name] ?? { count: 0, percentage: 0 };
              return (
                <div
                  key={cat.name}
                  className="rounded-lg p-3 border"
                  style={{ borderColor: cat.color + "40", backgroundColor: cat.color + "0d" }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs font-medium text-slate-600 leading-tight">{cat.name}</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stats.count}</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">{stats.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${stats.percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Donut chart */}
          {chartData.length > 0 && (
            <div className="w-56 flex-shrink-0">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
