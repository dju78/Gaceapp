import React, { useState } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, ChevronRight, X } from "lucide-react";

const portfolioData = [
  { month: "Jan", value: 198000 },
  { month: "Feb", value: 202000 },
  { month: "Mar", value: 205000 },
  { month: "Apr", value: 208000 },
  { month: "May", value: 212000 },
  { month: "Jun", value: 215430 },
];

const assetAllocationData = [
  { name: "UK Equities", value: 92340, percentage: 48 },
  { name: "US Equities", value: 56120, percentage: 26 },
  { name: "Nigeria Stocks", value: 37500, percentage: 18 },
  { name: "Real Estate & Cash", value: 29470, percentage: 8 },
];

const gainsData = [
  {
    jurisdiction: "United Kingdom",
    realised: 4230,
    unrealised: 12800,
  },
  {
    jurisdiction: "Nigeria",
    realised: 1950,
    unrealised: 6200,
  },
  {
    jurisdiction: "US/EU",
    realised: 600,
    unrealised: 3400,
  },
];

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981"];

type DetailModal = "portfolio" | "cgt" | "tasks" | "filings" | null;

export const ComplianceOverview: React.FC = () => {
  const [modalOpen, setModalOpen] = useState<DetailModal>(null);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  return (
    <>
      <div className="mx-auto max-w-7xl">
        {/* Welcome Section */}
        <div data-tour="welcome" className="mb-6 p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <h2 className="text-white mb-2">Welcome to GACE</h2>
          <p className="text-white/60">Your intelligent Global Asset Compliance Engine for UK tax compliance.</p>
        </div>

        {/* KPI Cards */}
        <section className="grid gap-4 md:grid-cols-4">
          {/* Portfolio Value */}
          <button
            data-tour="portfolio-value"
            onClick={() => setModalOpen("portfolio")}
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left transition-all hover:border-indigo-500/50 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Global Portfolio Value
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-indigo-400" />
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-2xl font-semibold text-slate-50">
                  £215,430
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Across 4 jurisdictions
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                +7.4% YTD
              </div>
            </div>
          </button>

          {/* CGT Liability */}
          <button
            data-tour="cgt-liability"
            onClick={() => setModalOpen("cgt")}
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left transition-all hover:border-indigo-500/50 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Est. CGT Liability (YTD)
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-indigo-400" />
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-2xl font-semibold text-slate-50">
                  £6,780
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  3 asset classes · Draft
                </div>
              </div>
              <div className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300">
                Review Required
              </div>
            </div>
          </button>

          {/* Compliance Status */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Compliance Status
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-sm font-semibold text-slate-100">
                  On Track
                </span>
              </div>
              <div className="text-xs text-slate-400">
                2 actions before Jan 31
              </div>
            </div>
          </div>

          {/* Deadlines */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Upcoming Deadlines
            </div>
            <div className="mt-3">
              <div className="text-xl font-semibold text-slate-50">
                2 Filings
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Due in the next 14 days
              </div>
              <div className="mt-3 text-[11px] text-slate-300">
                • UK Self Assessment (2024/25)
                <br />• Nigeria PIT Filing (2025)
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Left: Charts & Gains */}
          <div className="space-y-6 lg:col-span-2">
            {/* Portfolio Growth Chart */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Portfolio Growth (YTD)
                  </h2>
                  <p className="text-xs text-slate-400">
                    6-month performance across all jurisdictions
                  </p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={portfolioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    style={{ fontSize: "11px" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: "11px" }}
                    tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`£${value.toLocaleString()}`, "Value"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: "#6366f1", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Asset Allocation */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Global Asset Allocation
                  </h2>
                  <p className="text-xs text-slate-400">
                    Distribution by asset class and region
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex flex-1 justify-center">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={assetAllocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        onMouseEnter={(_, index) =>
                          setSelectedAsset(assetAllocationData[index].name)
                        }
                        onMouseLeave={() => setSelectedAsset(null)}
                      >
                        {assetAllocationData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            style={{
                              filter:
                                selectedAsset === entry.name
                                  ? "brightness(1.2)"
                                  : "brightness(1)",
                              cursor: "pointer",
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [
                          `£${value.toLocaleString()}`,
                          "Value",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2 text-xs">
                  {assetAllocationData.map((item, index) => (
                    <button
                      key={item.name}
                      onMouseEnter={() => setSelectedAsset(item.name)}
                      onMouseLeave={() => setSelectedAsset(null)}
                      className={`flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 transition-all hover:border-indigo-500/50 ${
                        selectedAsset === item.name ? "border-indigo-500/50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded"
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <div>
                          <div className="text-[11px] font-semibold text-slate-100">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            £{item.value.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-300">
                        {item.percentage}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Realised vs Unrealised */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Realised vs Unrealised Gains
                  </h2>
                  <p className="text-xs text-slate-400">
                    Breakdown by jurisdiction (YTD)
                  </p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gainsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="jurisdiction"
                    stroke="#64748b"
                    style={{ fontSize: "11px" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: "11px" }}
                    tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => `£${value.toLocaleString()}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  />
                  <Bar dataKey="realised" fill="#10b981" name="Realised" />
                  <Bar dataKey="unrealised" fill="#6366f1" name="Unrealised" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Tasks & Filings */}
          <div className="space-y-6">
            {/* Compliance Tasks */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Compliance Tasks
                  </h2>
                  <p className="text-xs text-slate-400">
                    Actions required to stay fully compliant
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen("tasks")}
                  className="text-xs text-indigo-300 hover:text-indigo-200"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  {
                    title: "Upload Q3 Nigeria brokerage statements",
                    due: "Due in 3 days",
                    status: "Pending",
                    tag: "Nigeria · Equities",
                    priority: "high",
                  },
                  {
                    title: "Confirm cost basis for Oando Plc disposals",
                    due: "Due in 7 days",
                    status: "In progress",
                    tag: "Event review",
                    priority: "medium",
                  },
                  {
                    title: "Review draft UK CGT calculation (2024/25)",
                    due: "Due in 12 days",
                    status: "Pending",
                    tag: "UK · CGT",
                    priority: "medium",
                  },
                ].map(({ title, due, status, tag, priority }) => (
                  <button
                    key={title}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-left transition-all hover:border-indigo-500/50 hover:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-[11px] font-semibold text-slate-100">
                          {title}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          {tag}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-slate-400">
                          {due}
                        </span>
                        <span
                          className={
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                            (status === "Pending"
                              ? "bg-amber-500/10 text-amber-300"
                              : "bg-sky-500/10 text-sky-300")
                          }
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Filings */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Recent Filings & Events
                  </h2>
                  <p className="text-xs text-slate-400">
                    Latest submissions and compliance events
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen("filings")}
                  className="text-xs text-indigo-300 hover:text-indigo-200"
                >
                  Export Log
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  {
                    title: "UK Self Assessment (2023/24)",
                    date: "Filed · 25 Jan 2025",
                    status: "Accepted",
                  },
                  {
                    title: "Nigeria Personal Income Tax (2024)",
                    date: "Filed · 15 Apr 2025",
                    status: "In review",
                  },
                  {
                    title: "CGT Event – Nigerian Equities Disposal",
                    date: "Recorded · 08 Mar 2025",
                    status: "Awaiting confirmation",
                  },
                ].map(({ title, date, status }) => (
                  <button
                    key={title}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2.5 text-left transition-all hover:border-indigo-500/50 hover:bg-slate-800"
                  >
                    <div>
                      <div className="text-[11px] font-semibold text-slate-100">
                        {title}
                      </div>
                      <div className="text-[11px] text-slate-400">{date}</div>
                    </div>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                        (status === "Accepted"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : status === "In review"
                          ? "bg-sky-500/10 text-sky-300"
                          : "bg-amber-500/10 text-amber-300")
                      }
                    >
                      {status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Alert Banner */}
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-100">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-300" />
                <div>
                  <div className="font-semibold">
                    Action recommended on Nigerian equity disposals
                  </div>
                  <div className="mt-1 text-[11px] text-amber-100/80">
                    We've detected multiple large disposals in your Nigerian
                    portfolio. Confirm these events to avoid under-reporting
                    CGT in both Nigeria and the UK.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Detail Modals */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">
                {modalOpen === "portfolio" && "Portfolio Details"}
                {modalOpen === "cgt" && "CGT Liability Breakdown"}
                {modalOpen === "tasks" && "All Compliance Tasks"}
                {modalOpen === "filings" && "Filing History"}
              </h3>
              <button
                onClick={() => setModalOpen(null)}
                className="rounded-lg p-1 hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              {modalOpen === "portfolio" && (
                <div>
                  <p className="mb-3 text-slate-400">
                    Detailed breakdown of your global portfolio holdings
                  </p>
                  <div className="space-y-2">
                    {assetAllocationData.map((asset) => (
                      <div
                        key={asset.name}
                        className="rounded-lg border border-slate-800 bg-slate-800/50 p-3"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{asset.name}</span>
                          <span>£{asset.value.toLocaleString()}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {asset.percentage}% of total portfolio
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modalOpen === "cgt" && (
                <div>
                  <p className="mb-3 text-slate-400">
                    Estimated Capital Gains Tax liability for current year
                  </p>
                  <div className="space-y-2">
                    <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-3">
                      <div className="flex justify-between">
                        <span>UK CGT (20% rate)</span>
                        <span className="font-semibold">£4,230</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-3">
                      <div className="flex justify-between">
                        <span>Nigeria CGT (10% rate)</span>
                        <span className="font-semibold">£1,950</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-3">
                      <div className="flex justify-between">
                        <span>Other Jurisdictions</span>
                        <span className="font-semibold">£600</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-indigo-500/50 bg-indigo-500/10 p-3">
                      <div className="flex justify-between font-semibold">
                        <span>Total Estimated Liability</span>
                        <span>£6,780</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(modalOpen === "tasks" || modalOpen === "filings") && (
                <p className="text-slate-400">
                  Detailed {modalOpen === "tasks" ? "task" : "filing"} information
                  would be displayed here in the full application.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};