import { FileText, ArrowRight } from "lucide-react";

interface ReportEmptyStateProps {
  title: string;
  message: string;
  primaryAction?: {
    label: string;
    to: string;
  };
}

export function ReportEmptyState({
  title,
  message,
  primaryAction,
}: ReportEmptyStateProps) {
  return (
    <div className="bg-gradient-to-br from-[#1a1f35] to-[#0f1424] border border-gray-800/50 rounded-2xl p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 mb-6">
        <FileText className="w-8 h-8 text-cyan-400" />
      </div>

      <h2 className="text-white text-2xl mb-3">{title}</h2>
      <p className="text-gray-400 max-w-md mx-auto mb-8">{message}</p>

      {primaryAction && (
        <button
          onClick={() => (window.location.href = primaryAction.to)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <span>{primaryAction.label}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
