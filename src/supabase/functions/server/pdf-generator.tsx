// PDF Generation for UK Self Assessment Reports
// Deno-compatible version for Supabase Edge Functions

import { createClient } from "npm:@supabase/supabase-js";

// Helper functions
function money(n: number | undefined): string {
  const x = Number(n || 0);
  return x.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

function esc(s: string | undefined): string {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[c] || c)
  );
}

// Build HMRC-style HTML for PDF
function buildSaHtml(snapshot: any): string {
  const meta = snapshot.meta || {};
  const t = snapshot.taxpayer || {};
  const out = snapshot.outputs || {};
  const breakdown = snapshot.breakdown || {};
  const incomeLines = breakdown.incomeLines || [];
  const allowanceLines = breakdown.allowanceLines || [];
  const taxLines = breakdown.taxLines || [];
  const ext = snapshot.gaceExtensions || {};

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body{font-family:Arial,sans-serif;color:#111;font-size:12px;line-height:1.5}
  .title{font-size:16px;font-weight:700;text-align:center;margin:6px 0 14px}
  .subtitle{font-size:14px;font-weight:700;margin:16px 0 8px}
  .row{display:flex;justify-content:space-between;gap:16px}
  .box{border:1px solid #222;padding:10px;margin-top:10px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th,td{padding:6px;border-bottom:1px solid #ddd;text-align:left}
  .r{text-align:right}
  .callout{border:2px solid #111;padding:8px 10px;font-weight:700;display:inline-block}
  .pagebreak{page-break-before:always}
  .muted{color:#555;font-size:11px}
  .section{margin-top:20px}
  .highlight{background:#fffacd;padding:8px;margin:8px 0}
</style>
</head>
<body>

<div class="title">Personal Tax Computation</div>

<div class="row">
  <div>
    <div><b>Client:</b> ${esc(t.name)}</div>
    <div><b>Tax year:</b> ${esc(meta.taxYear)}</div>
    <div class="muted">Method: ${esc(meta.methodVersion || "uk-sa-v1")}</div>
  </div>
  <div>
    <div><b>Tax ref / UTR:</b> ${esc(t.utr || "—")}</div>
    <div><b>Computed:</b> ${new Date(meta.computedAt).toLocaleDateString("en-GB")}</div>
  </div>
</div>

<div class="box">
  <div class="subtitle">Income Summary</div>
  <table>
    <tr><th>Source</th><th class="r">Amount</th></tr>
    ${incomeLines.map((x) => `<tr><td>${esc(x.label)}</td><td class="r">${money(x.amount)}</td></tr>`).join("")}
    <tr style="font-weight:700"><td>Total Income</td><td class="r">${money(out.totalIncome)}</td></tr>
  </table>

  <div class="subtitle" style="margin-top:16px">Allowances & Reliefs</div>
  <table>
    <tr><th>Allowance</th><th class="r">Amount</th></tr>
    ${allowanceLines.map((x) => `<tr><td>${esc(x.label)}</td><td class="r">${money(x.amount)}</td></tr>`).join("")}
  </table>

  <div class="subtitle" style="margin-top:16px">Tax Calculation</div>
  <table>
    <tr><th>Description</th><th class="r">Amount</th></tr>
    <tr><td>Taxable Income</td><td class="r">${money(out.taxableIncome)}</td></tr>
  </table>

  <div class="subtitle" style="margin-top:16px">Tax & National Insurance</div>
  <table>
    <tr><th>Type</th><th class="r">Amount</th></tr>
    ${taxLines.map((x) => `<tr><td>${esc(x.label)}</td><td class="r">${money(x.amount)}</td></tr>`).join("")}
    <tr style="font-weight:700;border-top:2px solid #111"><td>Total Tax Due</td><td class="r">${money(out.totalTaxDue)}</td></tr>
  </table>

  ${ext.foreignTaxCredits && ext.foreignTaxCredits.length > 0 ? `
  <div class="subtitle" style="margin-top:16px">Foreign Tax Credits (DTA Relief)</div>
  <table>
    <tr><th>Country</th><th>Method</th><th class="r">Relief</th></tr>
    ${ext.foreignTaxCredits.map((c: any) => `
      <tr>
        <td>${esc(c.country)}</td>
        <td class="muted">${esc(c.method)} - ${esc(c.articles)}</td>
        <td class="r">${money(c.amount)}</td>
      </tr>
    `).join("")}
    <tr style="font-weight:700">
      <td colspan="2">Total Foreign Tax Credits</td>
      <td class="r">${money(ext.foreignTaxCredits.reduce((sum: number, c: any) => sum + c.amount, 0))}</td>
    </tr>
  </table>
  ` : ""}

  <div style="margin-top:20px;padding-top:16px;border-top:2px solid #111">
    <div class="row">
      <div><b>Amount payable by 31 January:</b></div>
      <div class="callout">${money(out.amountDueBy31Jan)}</div>
    </div>
  </div>
</div>

${ext.aiInsights && ext.aiInsights.length > 0 ? `
<div class="pagebreak"></div>
<div class="title">AI-Powered Tax Insights</div>

<div class="box">
  ${ext.aiInsights.map((insight: any, idx: number) => `
    <div class="section" style="${idx > 0 ? 'margin-top:16px;padding-top:16px;border-top:1px solid #ddd' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-weight:700">${esc(insight.title)}</div>
        <div class="muted">${esc(insight.category)} - ${esc(insight.severity)}</div>
      </div>
      <div style="margin-top:8px">${esc(insight.description)}</div>
      ${insight.actionable ? '<div class="highlight" style="margin-top:8px">⚡ Action recommended</div>' : ''}
    </div>
  `).join("")}
</div>
` : ""}

${ext.complianceChecks && ext.complianceChecks.length > 0 ? `
<div class="pagebreak"></div>
<div class="title">Compliance Requirements</div>

<div class="box">
  <table>
    <tr><th>Requirement</th><th>Status</th><th>Deadline</th></tr>
    ${ext.complianceChecks.map((c: any) => `
      <tr>
        <td>${esc(c.requirement)}</td>
        <td>${esc(c.status)}</td>
        <td>${c.deadline ? new Date(c.deadline).toLocaleDateString("en-GB") : "—"}</td>
      </tr>
      ${c.notes ? `<tr><td colspan="3" class="muted">${esc(c.notes)}</td></tr>` : ""}
    `).join("")}
  </table>
</div>
` : ""}

<div class="pagebreak"></div>
<div class="title">Self Assessment Statement</div>

<div class="box">
  <div class="muted">
    This statement is generated from a locked calculation snapshot (Version ${snapshot.version || 1}). 
    No recalculation occurs during export.
  </div>
  
  <div class="section">
    <table>
      <tr><th>Description</th><th class="r">Amount</th></tr>
      <tr><td>Total tax due for ${esc(meta.taxYear)}</td><td class="r">${money(out.totalTaxDue)}</td></tr>
      ${ext.foreignTaxCredits ? `
        <tr><td>Less: Foreign tax credits</td><td class="r">-${money(ext.foreignTaxCredits.reduce((sum: number, c: any) => sum + c.amount, 0))}</td></tr>
      ` : ""}
      <tr><td>Tax already paid (PAYE/deductions)</td><td class="r">-${money(out.totalTaxDue - out.amountDueBy31Jan)}</td></tr>
      <tr style="font-weight:700;border-top:2px solid #111">
        <td>Balancing payment</td>
        <td class="r">${money(out.amountDueBy31Jan)}</td>
      </tr>
    </table>
  </div>

  <div style="margin-top:20px;padding:12px;background:#f0f0f0;border-left:4px solid #111">
    <div style="font-weight:700;margin-bottom:8px">Important:</div>
    <div>Payment must be received by HMRC by <b>31 January ${Number(meta.taxYear?.split("/")[0]) + 1}</b></div>
    <div style="margin-top:4px" class="muted">
      Late payment interest will be charged on any amount unpaid after the deadline.
    </div>
  </div>

  <div style="margin-top:20px" class="row">
    <div><b>Amount due by 31 January:</b></div>
    <div class="callout">${money(out.amountDueBy31Jan)}</div>
  </div>
</div>

<div style="margin-top:30px;padding-top:16px;border-top:1px solid #ddd;text-align:center" class="muted">
  Generated by GACE (Global Asset Compliance Engine) on ${new Date().toLocaleDateString("en-GB")}
</div>

</body></html>`;
}

// Generate PDF using external service (placeholder)
// In production, you would use a service like:
// - Browserless.io
// - PDFShift
// - DocRaptor
// - Or self-hosted Puppeteer
export async function generatePdfFromHtml(
  html: string,
  fileName: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  // This is a placeholder - you need to implement actual PDF generation
  // Options:
  // 1. Use a PDF generation service API
  // 2. Deploy Puppeteer to a separate service
  // 3. Use browser-native PDF generation on client side

  console.log("[PDF] HTML generated, ready for PDF conversion");
  console.log("[PDF] Filename:", fileName);

  // For now, return the HTML as base64
  // You would replace this with actual PDF service call
  return {
    success: true,
    url: `data:text/html;base64,${btoa(html)}`,
  };
}

// Main handler for PDF generation endpoint
export async function handlePdfGeneration(
  calculationId: string,
  userId: string
): Promise<{
  success: boolean;
  html?: string;
  snapshot?: any;
  error?: string;
}> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log(`[PDF] Generating PDF for calculation: ${calculationId}`);

    // Fetch latest snapshot
    const { data: snap, error } = await supabase
      .from("tax_calculation_snapshots")
      .select("snapshot_data, version, calculation_id, created_at")
      .eq("calculation_id", calculationId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !snap) {
      console.error("[PDF] Snapshot not found:", error);
      return {
        success: false,
        error: "Snapshot not found",
      };
    }

    console.log(`[PDF] Found snapshot version ${snap.version}`);

    // Add version to snapshot data
    const snapshotWithVersion = {
      ...snap.snapshot_data,
      version: snap.version,
    };

    // Build HTML
    const html = buildSaHtml(snapshotWithVersion);

    console.log("[PDF] HTML generated successfully");

    return {
      success: true,
      html,
      snapshot: snapshotWithVersion,
    };
  } catch (err) {
    console.error("[PDF] Error generating PDF:", err);
    return {
      success: false,
      error: String(err),
    };
  }
}

// Legacy function name for compatibility with existing code
export function generateSelfAssessmentPDF(reportData: any): Buffer | null {
  console.log("[PDF] generateSelfAssessmentPDF called (legacy compatibility)");
  console.log("[PDF] Building HTML from report data...");
  
  try {
    // Extract snapshot from report data if available
    const snapshot = reportData.snapshot || reportData;
    const html = buildSaHtml(snapshot);
    
    // Note: This returns null because we're not doing binary PDF generation
    // The HTML should be used directly
    console.log("[PDF] HTML generated, but binary PDF not available in Edge Functions");
    console.log("[PDF] Use the HTML directly or deploy Lambda for binary PDFs");
    
    return null;
  } catch (err) {
    console.error("[PDF] Error in generateSelfAssessmentPDF:", err);
    return null;
  }
}