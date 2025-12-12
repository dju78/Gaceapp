import { CheckCircle, Clock, Lock, AlertTriangle } from "lucide-react";

interface ReportSummaryCardProps {
  taxYear: string;
  totalTaxDue: number;
  amountDueBy31Jan: number;
  status: "DRAFT" | "COMPUTED" | "LOCKED" | "SUBMITTED";
  snapshot?: {
    version: number;
    created_at: string;
    snapshot_data: {
      breakdown: {
        incomeLines: { label: string; amount: number }[];
        taxLines: { label: string; amount: number }[];
      };
      outputs: {
        totalIncome: number;
      };
      gaceExtensions?: {
        foreignTaxCredits?: {
          country: string;
          amount: number;
          method: string;
          articles: string;
        }[];
      };
    };
  };
}

export function ReportSummaryCard({
  taxYear,
  totalTaxDue,
  amountDueBy31Jan,
  status,
  snapshot,
}: ReportSummaryCardProps) {
  const statusConfig = {
    DRAFT: { icon: Clock, color: "text-gray-500", bg: "bg-gray-500/10", label: "Draft" },
    COMPUTED: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", label: "Computed" },
    LOCKED: { icon: Lock, color: "text-blue-500", bg: "bg-blue-500/10", label: "Locked" },
    SUBMITTED: { icon: CheckCircle, color: "text-purple-500", bg: "bg-purple-500/10", label: "Submitted" },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status */}
        <div className="bg-gradient-to-br from-[#1a1f35] to-[#0f1424] border border-gray-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${statusConfig[status].bg}`}>
              <StatusIcon className={`w-5 h-5 ${statusConfig[status].color}`} />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Status</div>
              <div className="text-white font-medium">{statusConfig[status].label}</div>
            </div>
          </div>
          {snapshot && (
            <div className="text-xs text-gray-500 mt-2">
              Version {snapshot.version} • {new Date(snapshot.created_at).toLocaleDateString("en-GB")}
            </div>
          )}
        </div>

        {/* Total Tax Due */}
        <div className="bg-gradient-to-br from-[#1a1f35] to-[#0f1424] border border-gray-800/50 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Total Tax Due</div>
          <div className="text-white text-2xl font-bold">
            £{totalTaxDue.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">For tax year {taxYear}</div>
        </div>

        {/* Amount Due by 31 Jan */}
        <div className="bg-gradient-to-br from-[#1a1f35] to-[#0f1424] border border-gray-800/50 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Due by 31 January</div>
          <div className="text-cyan-400 text-2xl font-bold">
            £{amountDueBy31Jan.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">Balancing payment</div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {snapshot && (
        <div className="bg-gradient-to-br from-[#1a1f35] to-[#0f1424] border border-gray-800/50 rounded-xl p-6">
          <h3 className="text-white mb-4">Calculation Breakdown</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income */}
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

            {/* Tax */}
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
                    £{totalTaxDue.toLocaleString()}
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
                  {snapshot.snapshot_data.gaceExtensions.foreignTaxCredits.map(
                    (credit, idx) => (
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
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
