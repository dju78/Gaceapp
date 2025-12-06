import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import { alertAPI, type ComplianceAlert as APIAlert } from "../utils/api/client";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  jurisdiction: string;
  deadline?: string;
  daysRemaining?: number;
  actions: string[];
  status: "open" | "in-progress" | "resolved";
  createdDate: string;
}

// Transform API alert to display format
function transformAlert(apiAlert: APIAlert): Alert {
  const calculateDaysRemaining = (dueDate?: string) => {
    if (!dueDate) return undefined;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Map API severity to display type
  const typeMap: Record<string, "critical" | "warning" | "info"> = {
    critical: "critical",
    high: "critical",
    medium: "warning",
    low: "info",
  };

  return {
    id: apiAlert.id,
    type: typeMap[apiAlert.severity] || "info",
    title: apiAlert.title,
    description: apiAlert.description || "",
    jurisdiction: "United Kingdom", // TODO: Extract from alert data
    deadline: apiAlert.due_date,
    daysRemaining: calculateDaysRemaining(apiAlert.due_date),
    actions: [], // TODO: Extract from alert metadata
    status: apiAlert.is_resolved ? "resolved" : apiAlert.is_read ? "in-progress" : "open",
    createdDate: apiAlert.created_at.split('T')[0],
  };
}

export const ComplianceAlerts: React.FC = () => {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>("all");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch alerts from API
  useEffect(() => {
    async function fetchAlerts() {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await alertAPI.getAll();

      if (apiError) {
        console.error("Error fetching alerts:", apiError);
        setError("Failed to load alerts. Please try again.");
        setAlerts([]);
      } else if (data?.alerts) {
        const transformedAlerts = data.alerts.map(transformAlert);
        setAlerts(transformedAlerts);
      } else {
        setAlerts([]);
      }

      setLoading(false);
    }

    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesType = filterType === "all" || alert.type === filterType;
    const matchesJurisdiction =
      filterJurisdiction === "all" || alert.jurisdiction === filterJurisdiction;
    return matchesType && matchesJurisdiction;
  });

  const criticalCount = alerts.filter((a) => a.type === "critical").length;
  const warningCount = alerts.filter((a) => a.type === "warning").length;
  const infoCount = alerts.filter((a) => a.type === "info").length;
  const urgentCount = alerts.filter(
    (a) => a.daysRemaining && a.daysRemaining <= 7
  ).length;

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-5 w-5" />;
      case "warning":
        return <AlertCircle className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
    }
  };

  const getAlertColor = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return {
          border: "border-rose-500/40",
          bg: "bg-rose-500/10",
          text: "text-rose-300",
          iconBg: "bg-rose-500/20",
        };
      case "warning":
        return {
          border: "border-amber-500/40",
          bg: "bg-amber-500/10",
          text: "text-amber-300",
          iconBg: "bg-amber-500/20",
        };
      case "info":
        return {
          border: "border-sky-500/40",
          bg: "bg-sky-500/10",
          text: "text-sky-300",
          iconBg: "bg-sky-500/20",
        };
    }
  };

  const jurisdictions = [
    "all",
    ...Array.from(new Set(alerts.map((a) => a.jurisdiction))),
  ];

  return (
    <div className="mx-auto max-w-7xl">
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4">
          <div className="flex items-center gap-2 text-rose-300">
            <AlertTriangle className="h-5 w-5" />
            <div className="text-xs font-medium uppercase tracking-[0.18em]">
              Critical Alerts
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">
            {criticalCount}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Require immediate action
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertCircle className="h-5 w-5" />
            <div className="text-xs font-medium uppercase tracking-[0.18em]">
              Warnings
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">
            {warningCount}
          </div>
          <div className="mt-1 text-xs text-slate-400">Review recommended</div>
        </div>

        <div className="rounded-2xl border border-sky-500/40 bg-sky-500/10 p-4">
          <div className="flex items-center gap-2 text-sky-300">
            <Info className="h-5 w-5" />
            <div className="text-xs font-medium uppercase tracking-[0.18em]">
              Information
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">
            {infoCount}
          </div>
          <div className="mt-1 text-xs text-slate-400">For your awareness</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="h-5 w-5" />
            <div className="text-xs font-medium uppercase tracking-[0.18em]">
              Urgent (≤7 days)
            </div>
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-50">
            {urgentCount}
          </div>
          <div className="mt-1 text-xs text-slate-400">Due within a week</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-400">
            Alert Type:
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Information</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-400">
            Jurisdiction:
          </label>
          <select
            value={filterJurisdiction}
            onChange={(e) => setFilterJurisdiction(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          >
            {jurisdictions.map((jurisdiction) => (
              <option key={jurisdiction} value={jurisdiction}>
                {jurisdiction === "all" ? "All Jurisdictions" : jurisdiction}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-400">
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => {
          const colors = getAlertColor(alert.type);
          return (
            <button
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className={`w-full rounded-2xl border ${colors.border} ${colors.bg} p-4 text-left transition-all hover:brightness-110`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${colors.iconBg} ${colors.text}`}
                >
                  {getAlertIcon(alert.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-100">
                          {alert.title}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            alert.status === "open"
                              ? "bg-slate-700 text-slate-300"
                              : alert.status === "in-progress"
                              ? "bg-sky-500/20 text-sky-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {alert.status === "open"
                            ? "Open"
                            : alert.status === "in-progress"
                            ? "In Progress"
                            : "Resolved"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">
                        {alert.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                        <span>📍 {alert.jurisdiction}</span>
                        {alert.deadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {alert.deadline}
                          </span>
                        )}
                        <span>Created: {alert.createdDate}</span>
                      </div>
                    </div>

                    {alert.daysRemaining !== undefined && (
                      <div className="text-right">
                        <div
                          className={`text-2xl font-bold ${
                            alert.daysRemaining <= 3
                              ? "text-rose-400"
                              : alert.daysRemaining <= 7
                              ? "text-amber-400"
                              : "text-slate-300"
                          }`}
                        >
                          {alert.daysRemaining}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          days left
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
          <h3 className="mt-4 font-semibold text-slate-100">
            No alerts match your filters
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Try adjusting your filter criteria to see more alerts
          </p>
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                    getAlertColor(selectedAlert.type).iconBg
                  } ${getAlertColor(selectedAlert.type).text}`}
                >
                  {getAlertIcon(selectedAlert.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    {selectedAlert.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {selectedAlert.jurisdiction}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="rounded-lg p-2 hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Description */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-slate-100">
                  Description
                </h4>
                <p className="text-sm text-slate-300">
                  {selectedAlert.description}
                </p>
              </div>

              {/* Deadline Info */}
              {selectedAlert.deadline && (
                <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">
                        Deadline
                      </h4>
                      <p className="mt-1 text-slate-300">
                        {selectedAlert.deadline}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-2xl font-bold ${
                          selectedAlert.daysRemaining! <= 3
                            ? "text-rose-400"
                            : selectedAlert.daysRemaining! <= 7
                            ? "text-amber-400"
                            : "text-slate-300"
                        }`}
                      >
                        {selectedAlert.daysRemaining}
                      </div>
                      <div className="text-xs text-slate-400">days remaining</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Required Actions */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-100">
                  Required Actions
                </h4>
                <ul className="space-y-2">
                  {selectedAlert.actions.map((action, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-300">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-medium text-slate-100 hover:border-indigo-500 hover:bg-slate-700">
                  Mark as In Progress
                </button>
                <button className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
                  Take Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};