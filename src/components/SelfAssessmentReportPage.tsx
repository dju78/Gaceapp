import { useState, useEffect } from "react";
import { Download, FileText, AlertCircle, CheckCircle, Clock, Lock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { UkTaxSnapshot } from "../types/tax-snapshot";

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

interface TaxCalculation {
  id: string;
  user_id: string;
  country: string;
  tax_year: string;
  status: "DRAFT" | "COMPUTED" | "LOCKED" | "SUBMITTED";
  currency: string;
  total_tax_due: number;
  amount_due_by_31jan: number;
  computed_at: string;
  metadata?: any;
}

interface TaxSnapshot {
  id: string;
  calculation_id: string;
  snapshot_data: UkTaxSnapshot;
  version: number;
  created_at: string;
  updated_at: string;
}

export function SelfAssessmentReportPage() {
  const [taxYear, setTaxYear] = useState<number>(2024);
  const [calculation, setCalculation] = useState<TaxCalculation | null>(null);
  const [snapshot, setSnapshot] = useState<TaxSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch calculation and snapshot
  useEffect(() => {
    fetchCalculationData();
  }, [taxYear]);

  async function fetchCalculationData() {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Please sign in to view tax calculations");
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // Fetch calculation
      const { data: calc, error: calcError } = await supabase
        .from("tax_calculations")
        .select("*")
        .eq("user_id", userId)
        .eq("tax_year", `${taxYear}/${taxYear + 1}`)
        .maybeSingle();

      if (calcError) {
        console.error("Error fetching calculation:", calcError);
        setError("Failed to load tax calculation");
        setLoading(false);
        return;
      }

      setCalculation(calc);

      // Fetch latest snapshot if calculation exists
      if (calc) {
        const { data: snap, error: snapError } = await supabase
          .from("tax_calculation_snapshots")
          .select("*")
          .eq("calculation_id", calc.id)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (snapError) {
          console.error("Error fetching snapshot:", snapError);
        } else {
          setSnapshot(snap);
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function generatePDF() {
    if (!calculation) return;

    setGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Please sign in to generate PDF");
        setGenerating(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b5fd51b8/tax/generate-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ taxYear }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const result = await response.json();

      // Open HTML in new window for printing
      if (result.html) {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(result.html);
          printWindow.document.close();
          
          // Trigger print dialog after a short delay
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  }

  const canGenerate =
    calculation?.status === "COMPUTED" || calculation?.status === "LOCKED" || calculation?.status === "SUBMITTED";

  const statusConfig = {
    DRAFT: { icon: Clock, color: "text-gray-500", bg: "bg-gray-500/10", label: "Draft" },
    COMPUTED: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", label: "Computed" },
    LOCKED: { icon: Lock, color: "text-blue-500", bg: "bg-blue-500/10", label: "Locked" },
    SUBMITTED: { icon: CheckCircle, color: "text-purple-500", bg: "bg-purple-500/10", label: "Submitted" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading tax calculation...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-cyan-400" />
              Self Assessment Report
            </h1>
            <p className="text-gray-400 mt-1">
              HMRC-compliant tax computation for UK residents with overseas assets
            </p>
          </div>

          {/* Tax Year Selector */}
          <div className="flex items-center gap-3">
            <label className="text-gray-400 text-sm">Tax Year:</label>
            <select
              value={taxYear}
              onChange={(e) => setTaxYear(Number(e.target.value))}
              className="bg-[#1a1f35] text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value={2022}>2022/2023</option>
              <option value={2023}>2023/2024</option>
              <option value={2024}>2024/2025</option>
              <option value={2025}>2025/2026</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-red-400 font-medium">Error</div>
              <div className="text-red-300 text-sm mt-1">{error}</div>
            </div>
          </div>
        )}

        {/* No Calculation State */}
        {!calculation && !loading && (
          <div className="bg-gradient-to-br from-[#1a1f35] to-[#0f1424] border border-gray-800/50 rounded-2xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 mb-6">
              <FileText className="w-8 h-8 text-cyan-400" />
            </div>
            
            <h2 className="text-white text-2xl mb-3">Tax Calculation Required</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              To generate an HMRC-style Self Assessment report for tax year {taxYear}/{taxYear + 1}, 
              run the Tax Calculation Engine first.
            </p>

            <button
              onClick={() => (window.location.href = "/dashboard/tax-engine")}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Run Tax Calculation
            </button>
          </div>
        )}

        {/* Calculation Summary */}
        {calculation && (
          <div className="space-y-6">
            {/* Status & Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Card */}
              <div className="bg-gradient-to-br from-[#1a1f35] to-[#0f1424] border border-gray-800/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    const StatusIcon = statusConfig[calculation.status].icon;
                    return (
                      <div
                        className={`p-2 rounded-lg ${statusConfig[calculation.status].bg}`}
                      >
                        <StatusIcon
                          className={`w-5 h-5 ${statusConfig[calculation.status].color}`}
                        />
                      </div>
                    );
                  })()}
                  <div>
                    <div className="text-gray-400 text-sm">Status</div>
                    <div className="text-white font-medium">
                      {statusConfig[calculation.status].label}
                    </div>
                  </div>
                </div>
                {snapshot && (
                  <div className="text-xs text-gray-500 mt-2">
                    Version {snapshot.version} • {new Date(snapshot.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Total Tax Due */}
              <div className="bg-gradient-to-br from-[#1a1f35] to-[#0f1424] border border-gray-800/50 rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Total Tax Due</div>
                <div className="text-white text-2xl font-bold">
                  £{calculation.total_tax_due.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  For tax year {calculation.tax_year}
                </div>
              </div>

              {/* Amount Due by 31 Jan */}
              <div className="bg-gradient-to-br from-[#1a1f35] to-[#0f1424] border border-gray-800/50 rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Due by 31 January</div>
                <div className="text-cyan-400 text-2xl font-bold">
                  £{calculation.amount_due_by_31jan.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Balancing payment deadline
                </div>
              </div>
            </div>

            {/* Snapshot Preview */}
            {snapshot && snapshot.snapshot_data && (
              <div className="bg-gradient-to-br from-[#1a1f35] to-[#0f1424] border border-gray-800/50 rounded-xl p-6">
                <h3 className="text-white text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Calculation Preview
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Income Summary */}
                  <div>
                    <div className="text-gray-400 text-sm mb-3 font-medium">Income Sources</div>
                    <div className="space-y-2">
                      {snapshot.snapshot_data.breakdown.incomeLines.map((line, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">{line.label}</span>
                          <span className="text-white font-medium">
                            £{line.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-700">
                        <span className="text-white font-medium">Total Income</span>
                        <span className="text-cyan-400 font-bold">
                          £{snapshot.snapshot_data.outputs.totalIncome.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Breakdown */}
                  <div>
                    <div className="text-gray-400 text-sm mb-3 font-medium">Tax & NIC</div>
                    <div className="space-y-2">
                      {snapshot.snapshot_data.breakdown.taxLines.map((line, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">{line.label}</span>
                          <span className="text-white font-medium">
                            £{line.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-700">
                        <span className="text-white font-medium">Total Tax Due</span>
                        <span className="text-red-400 font-bold">
                          £{snapshot.snapshot_data.outputs.totalTaxDue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Foreign Tax Credits */}
                {snapshot.snapshot_data.gaceExtensions?.foreignTaxCredits && 
                 snapshot.snapshot_data.gaceExtensions.foreignTaxCredits.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <div className="text-gray-400 text-sm mb-3 font-medium">
                      Foreign Tax Credits (DTA Relief)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {snapshot.snapshot_data.gaceExtensions.foreignTaxCredits.map((credit, idx) => (
                        <div key={idx} className="bg-[#0f1424] rounded-lg p-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-white font-medium">{credit.country}</span>
                            <span className="text-green-400 font-bold">
                              £{credit.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {credit.method} • {credit.articles}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generate PDF Button */}
            <div className="bg-gradient-to-br from-[#1a1f35] to-[#0f1424] border border-gray-800/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium mb-1">Export PDF Report</h3>
                  <p className="text-gray-400 text-sm">
                    {canGenerate
                      ? "Generate a professional HMRC-style Self Assessment report"
                      : "Run Tax Calculation to unlock PDF export"}
                  </p>
                </div>

                <button
                  onClick={generatePDF}
                  disabled={!canGenerate || generating}
                  title={
                    !canGenerate
                      ? "Run Tax Calculation to unlock PDF export"
                      : generating
                      ? "Generating PDF..."
                      : "Generate PDF Report"
                  }
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    canGenerate
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Generate PDF</span>
                    </>
                  )}
                </button>
              </div>

              {/* Additional Info */}
              {canGenerate && snapshot && (
                <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-gray-500 mb-1">Report Version</div>
                    <div className="text-gray-300">Version {snapshot.version}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Calculation Method</div>
                    <div className="text-gray-300">
                      {snapshot.snapshot_data.meta.methodVersion}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Last Updated</div>
                    <div className="text-gray-300">
                      {new Date(snapshot.updated_at).toLocaleDateString("en-GB")}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="text-cyan-300 font-medium mb-1">About PDF Reports</div>
                <div className="text-cyan-200/80">
                  The PDF report is generated from a locked snapshot (version {snapshot?.version || "N/A"}) 
                  of your tax calculation. No recalculation occurs during export, ensuring the report 
                  matches your approved calculation exactly.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
