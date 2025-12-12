// AWS Lambda PDF Generator with Puppeteer
// This is the Lambda version shown by the user
// Use this for deployment to AWS Lambda with Chromium layer

import { createClient } from "@supabase/supabase-js";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const handler = async (event) => {
  try {
    const { calculationId } = JSON.parse(event.body || "{}");
    if (!calculationId) return resp(400, { error: "calculationId is required" });

    // Server-only key (DO NOT prefix with VITE_)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch latest snapshot - UPDATED to use snapshot_data column
    const { data: snap, error } = await supabase
      .from("tax_calculation_snapshots")
      .select("snapshot_data, version, calculation_id, created_at")
      .eq("calculation_id", calculationId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !snap) return resp(404, { error: "Snapshot not found" });

    // Use snapshot_data field (matches our schema)
    const html = buildSaHtml(snap.snapshot_data);

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" },
    });

    await browser.close();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="SA_Report_${snap.snapshot_data?.meta?.taxYear || "UK"}.pdf"`,
      },
      body: pdf.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e) {
    return resp(500, { error: "PDF generation failed", details: String(e) });
  }
};

function resp(statusCode, body) {
  return { statusCode, body: JSON.stringify(body) };
}

function money(n) {
  const x = Number(n || 0);
  return x.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function buildSaHtml(snapshot) {
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
    ${incomeLines.map(x => `<tr><td>${esc(x.label)}</td><td class="r">${money(x.amount)}</td></tr>`).join("")}
    <tr style="font-weight:700"><td>Total Income</td><td class="r">${money(out.totalIncome)}</td></tr>
  </table>

  <div class="subtitle" style="margin-top:16px">Allowances & Reliefs</div>
  <table>
    <tr><th>Allowance</th><th class="r">Amount</th></tr>
    ${allowanceLines.map(x => `<tr><td>${esc(x.label)}</td><td class="r">${money(x.amount)}</td></tr>`).join("")}
  </table>

  <div class="subtitle" style="margin-top:16px">Tax Calculation</div>
  <table>
    <tr><th>Description</th><th class="r">Amount</th></tr>
    <tr><td>Taxable Income</td><td class="r">${money(out.taxableIncome)}</td></tr>
  </table>

  <div class="subtitle" style="margin-top:16px">Tax & National Insurance</div>
  <table>
    <tr><th>Type</th><th class="r">Amount</th></tr>
    ${taxLines.map(x => `<tr><td>${esc(x.label)}</td><td class="r">${money(x.amount)}</td></tr>`).join("")}
    <tr style="font-weight:700;border-top:2px solid #111"><td>Total Tax Due</td><td class="r">${money(out.totalTaxDue)}</td></tr>
  </table>

  ${ext.foreignTaxCredits && ext.foreignTaxCredits.length > 0 ? `
  <div class="subtitle" style="margin-top:16px">Foreign Tax Credits (DTA Relief)</div>
  <table>
    <tr><th>Country</th><th>Method</th><th class="r">Relief</th></tr>
    ${ext.foreignTaxCredits.map(c => `
      <tr>
        <td>${esc(c.country)}</td>
        <td class="muted">${esc(c.method)} - ${esc(c.articles)}</td>
        <td class="r">${money(c.amount)}</td>
      </tr>
    `).join("")}
    <tr style="font-weight:700">
      <td colspan="2">Total Foreign Tax Credits</td>
      <td class="r">${money(ext.foreignTaxCredits.reduce((sum, c) => sum + c.amount, 0))}</td>
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
  ${ext.aiInsights.map((insight, idx) => `
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
    ${ext.complianceChecks.map(c => `
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
    This statement is generated from a locked calculation snapshot. 
    No recalculation occurs during export.
  </div>
  
  <div class="section">
    <table>
      <tr><th>Description</th><th class="r">Amount</th></tr>
      <tr><td>Total tax due for ${esc(meta.taxYear)}</td><td class="r">${money(out.totalTaxDue)}</td></tr>
      ${ext.foreignTaxCredits ? `
        <tr><td>Less: Foreign tax credits</td><td class="r">-${money(ext.foreignTaxCredits.reduce((sum, c) => sum + c.amount, 0))}</td></tr>
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

// DEPLOYMENT INSTRUCTIONS:
// ========================
// 1. Install dependencies:
//    npm install @supabase/supabase-js @sparticuz/chromium puppeteer-core
//
// 2. Add Chromium layer to your Lambda:
//    https://github.com/Sparticuz/chromium/releases
//
// 3. Set environment variables in Lambda:
//    - SUPABASE_URL
//    - SUPABASE_SERVICE_ROLE_KEY
//
// 4. Configure Lambda:
//    - Memory: 1024MB minimum (2048MB recommended)
//    - Timeout: 30 seconds minimum
//    - Runtime: Node.js 18.x or later
//
// 5. Deploy and test with:
//    {
//      "body": "{\"calculationId\": \"your-calc-id-here\"}"
//    }
