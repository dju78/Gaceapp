import React, { useState, useEffect } from "react";
import { Download, FileText, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { getSupabaseClient } from "../utils/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "motion/react";

interface TaxCalculation {
  id: string;
  tax_year: number;
  total_foreign_income: number;
  total_uk_income: number;
  total_foreign_tax_paid: number;
  uk_tax_liability: number;
  dta_relief: number;
  net_tax_owed: number;
  created_at: string;
}

export function SelfAssessmentReport() {
  const { user, session } = useAuth();
  const [calculations, setCalculations] = useState<TaxCalculation[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Log auth state for debugging
    console.log("Auth state - user:", !!user, "session:", !!session);
    if (user) {
      console.log("User ID:", user.id);
    }
    
    if (session) {
      fetchTaxCalculations();
    } else {
      console.warn("No session available, cannot fetch tax calculations");
      setLoading(false);
      setError("You must be logged in to view tax calculations");
    }
  }, [session, user]);

  // Helper to get fresh access token
  const getAccessToken = async (): Promise<string | null> => {
    const supabase = getSupabaseClient();
    const { data: { session: currentSession }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    
    if (!currentSession) {
      console.error("No session found");
      return null;
    }
    
    console.log("Session found, access_token available:", !!currentSession.access_token);
    console.log("Token starts with:", currentSession.access_token?.substring(0, 20) + "...");
    
    return currentSession.access_token || null;
  };

  const fetchTaxCalculations = async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setError("No active session");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b5fd51b8/tax/history`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch tax calculations");
      }

      const data = await response.json();
      setCalculations(data.calculations || []);
      
      // Set the most recent year as default
      if (data.calculations && data.calculations.length > 0) {
        setSelectedYear(data.calculations[0].tax_year);
      }
    } catch (err: any) {
      console.error("Error fetching tax calculations:", err);
      setError(err.message || "Failed to load tax calculations");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setError("No active session");
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b5fd51b8/tax/generate-pdf`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ taxYear: selectedYear }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const data = await response.json();
      
      // Download the PDF
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
        setSuccess("PDF generated and downloaded successfully!");
      } else {
        throw new Error("No download URL received");
      }
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      setError(err.message || "Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  const selectedCalculation = calculations.find(
    (calc) => calc.tax_year === selectedYear
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[--neon-cyan] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Self Assessment Tax Return</h1>
          <p className="text-muted-foreground">
            Generate and download your HMRC-compliant Self Assessment tax return
            for foreign assets and income.
          </p>
        </div>

        {/* Year Selector & Generate Button */}
        <div className="glass p-6 rounded-lg mb-6 border border-[--neon-blue]/20">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1">
              <label className="block mb-2">Select Tax Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full sm:w-64 px-4 py-2 bg-[--input-background] border border-[--neon-blue]/30 rounded-lg text-foreground focus:outline-none focus:border-[--neon-cyan] transition-colors"
              >
                {calculations.length > 0 ? (
                  calculations.map((calc) => (
                    <option key={calc.id} value={calc.tax_year}>
                      {calc.tax_year}/{calc.tax_year + 1}
                    </option>
                  ))
                ) : (
                  <option value={selectedYear}>
                    {selectedYear}/{selectedYear + 1}
                  </option>
                )}
              </select>
            </div>

            <button
              onClick={handleGeneratePDF}
              disabled={generating || !selectedCalculation}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[--neon-cyan] to-[--neon-blue] text-[--primary-foreground] rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-cyan"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generate PDF Report
                </>
              )}
            </button>
          </div>

          {/* Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-destructive/20 border border-destructive/50 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-destructive">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-[--neon-green]/20 border border-[--neon-green]/50 rounded-lg flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-[--neon-green] flex-shrink-0 mt-0.5" />
              <p className="text-[--neon-green]">{success}</p>
            </motion.div>
          )}
        </div>

        {/* Tax Calculation Summary */}
        {selectedCalculation ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Income Summary */}
            <div className="glass p-6 rounded-lg border border-[--neon-purple]/20">
              <h2 className="text-xl mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[--neon-purple]" />
                Income Summary
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground">UK Income</span>
                  <span>
                    £{selectedCalculation.total_uk_income.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground">Foreign Income</span>
                  <span>
                    £{selectedCalculation.total_foreign_income.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground">
                    Foreign Tax Paid
                  </span>
                  <span className="text-[--neon-green]">
                    £{selectedCalculation.total_foreign_tax_paid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Income</span>
                  <span>
                    £
                    {(
                      selectedCalculation.total_uk_income +
                      selectedCalculation.total_foreign_income
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Tax Liability */}
            <div className="glass p-6 rounded-lg border border-[--neon-cyan]/20">
              <h2 className="text-xl mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[--neon-cyan]" />
                Tax Calculation
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground">Personal Allowance</span>
                  <span className="text-[--neon-green]">£12,570</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground">UK Tax Liability</span>
                  <span className="text-destructive">
                    £{selectedCalculation.uk_tax_liability.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground">DTA Relief</span>
                  <span className="text-[--neon-green]">
                    £{selectedCalculation.dta_relief.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span>Net Tax Owed</span>
                  <span className="text-xl text-[--neon-cyan]">
                    £{selectedCalculation.net_tax_owed.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="lg:col-span-2 glass p-6 rounded-lg border border-[--neon-pink]/20">
              <h2 className="text-xl mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[--neon-pink]" />
                Payment Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="mb-2">Payment Deadline</h3>
                  <p className="text-muted-foreground mb-2">
                    31st January {selectedYear + 2}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Late payment may incur penalties and interest charges.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2">Payment Methods</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Direct Debit</li>
                    <li>• Online or telephone banking</li>
                    <li>• Debit or credit card online</li>
                    <li>• CHAPS (same-day payment)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="lg:col-span-2 glass p-6 rounded-lg border border-[--neon-blue]/20">
              <h2 className="text-xl mb-4">Important Notes</h2>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  • This report is generated based on your registered foreign
                  assets and income in the GACE system.
                </li>
                <li>
                  • Double Taxation Agreement (DTA) relief has been calculated
                  based on foreign tax already paid.
                </li>
                <li>
                  • Ensure all foreign income and assets are accurately reported
                  to avoid HMRC penalties.
                </li>
                <li>
                  • For complex tax situations, consult with a qualified tax
                  advisor or accountant.
                </li>
                <li>
                  • Generated PDF reports are stored in your Documents section
                  for future reference.
                </li>
              </ul>
            </div>
          </motion.div>
        ) : (
          <div className="glass p-12 rounded-lg border border-border text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl mb-2">No Tax Calculation Found</h3>
            <p className="text-muted-foreground mb-6">
              No tax calculation exists for the selected year. Please run a tax
              calculation from the Tax Calculation Engine first.
            </p>
            <a
              href="/dashboard/tax-engine"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[--neon-cyan] to-[--neon-blue] text-[--primary-foreground] rounded-lg hover:opacity-90 transition-all"
            >
              Go to Tax Engine
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}