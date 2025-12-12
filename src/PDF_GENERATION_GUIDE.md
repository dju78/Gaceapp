# PDF Generation for Self Assessment Reports

## Overview

Your GACE application supports two PDF generation approaches:

1. **Supabase Edge Functions** (Current) - HTML generation for client-side or external PDF conversion
2. **AWS Lambda with Puppeteer** (Optional) - Server-side PDF generation with Chromium

---

## Current Implementation: Edge Functions

### Endpoint
```
POST /make-server-b5fd51b8/tax/generate-pdf
Authorization: Bearer {access_token}
Content-Type: application/json

Body:
{
  "taxYear": 2024
}
```

### How It Works

1. **Frontend calls endpoint** with user's tax year
2. **Backend verifies authentication** using access token  
3. **Backend fetches latest snapshot** from `tax_calculation_snapshots`
4. **Backend generates HMRC-style HTML** using UkTaxSnapshot data
5. **Backend returns HTML** for client-side processing or external PDF service

### Database Query

```typescript
// Fetch latest snapshot with versioning
const { data: snap } = await supabase
  .from("tax_calculation_snapshots")
  .select("snapshot_data, version, calculation_id, created_at")
  .eq("calculation_id", calculationId)
  .order("version", { ascending: false })
  .limit(1)
  .maybeSingle();
```

### File: `/supabase/functions/server/pdf-generator.tsx`

**Key Functions:**
- `handlePdfGeneration(calculationId, userId)` - Main handler
- `buildSaHtml(snapshot)` - Generates HMRC-style HTML
- `money(n)` - Formats currency as GBP
- `esc(s)` - Escapes HTML entities

**Generated Report Includes:**
- ✅ Personal Tax Computation
- ✅ Income Summary with all income lines
- ✅ Allowances & Reliefs
- ✅ Tax & National Insurance breakdown
- ✅ Foreign Tax Credits (DTA Relief)
- ✅ AI-Powered Tax Insights (if available)
- ✅ Compliance Requirements checklist
- ✅ Self Assessment Statement
- ✅ Payment deadline information

### HTML Output Example

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    /* Professional HMRC-style formatting */
  </style>
</head>
<body>
  <div class="title">Personal Tax Computation</div>
  
  <!-- Client and Tax Year Info -->
  <div class="row">
    <div><b>Client:</b> Sample User</div>
    <div><b>Tax ref / UTR:</b> 1234567890</div>
  </div>
  
  <!-- Income Summary Table -->
  <table>
    <tr><th>Source</th><th class="r">Amount</th></tr>
    <tr><td>UK Employment</td><td class="r">£85,000.00</td></tr>
    <!-- ... more income lines -->
  </table>
  
  <!-- Foreign Tax Credits -->
  <div class="subtitle">Foreign Tax Credits (DTA Relief)</div>
  <table>
    <tr>
      <td>Spain</td>
      <td class="muted">Credit Method - Articles 6, 10, 23</td>
      <td class="r">£1,845.00</td>
    </tr>
    <!-- ... more countries -->
  </table>
  
  <!-- Amount Due Callout -->
  <div class="callout">£11,443.00</div>
</body>
</html>
```

### Converting HTML to PDF (Client-Side)

**Option 1: Browser Print API**
```javascript
// Open HTML in new window and trigger print dialog
const printWindow = window.open('', '_blank');
printWindow.document.write(html);
printWindow.document.close();
printWindow.print();
```

**Option 2: External PDF Service**
```javascript
// Send HTML to PDF conversion service
const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source: html,
    format: 'A4',
    margin: '16mm'
  })
});

const pdfBlob = await response.blob();
const url = URL.createObjectURL(pdfBlob);
// Download or display PDF
```

---

## Alternative: AWS Lambda with Puppeteer

For **server-side PDF generation** with full control, you can deploy the Lambda version.

### File: `/lambda-pdf-generator.js`

This is a complete AWS Lambda function that:
1. Uses Puppeteer with Chromium
2. Fetches snapshot from Supabase
3. Generates HTML
4. Converts to PDF binary
5. Returns base64-encoded PDF

### AWS Lambda Setup

#### 1. Install Dependencies
```bash
npm install @supabase/supabase-js @sparticuz/chromium puppeteer-core
```

#### 2. Add Chromium Layer

Download the latest Chromium layer from:
https://github.com/Sparticuz/chromium/releases

Or use the Lambda Layer ARN:
```
arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:43
```

#### 3. Lambda Configuration

```yaml
Runtime: Node.js 18.x
Memory: 2048 MB (minimum 1024 MB)
Timeout: 30 seconds
Handler: index.handler

Environment Variables:
  - SUPABASE_URL: https://your-project.supabase.co
  - SUPABASE_SERVICE_ROLE_KEY: your-service-role-key
```

#### 4. IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

#### 5. Deploy

```bash
# Zip your function
zip -r function.zip index.js node_modules/

# Upload to Lambda
aws lambda update-function-code \
  --function-name gace-pdf-generator \
  --zip-file fileb://function.zip
```

#### 6. Test

```bash
aws lambda invoke \
  --function-name gace-pdf-generator \
  --payload '{"body": "{\"calculationId\": \"your-calc-id\"}"}' \
  response.json

# Check the response
cat response.json
```

### Lambda Invocation

```javascript
// From your frontend or API
const response = await fetch('https://your-lambda-url.amazonaws.com', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    calculationId: 'uuid-here'
  })
});

// Response is base64-encoded PDF
const pdfBase64 = await response.json();
const pdfBlob = base64ToBlob(pdfBase64.body, 'application/pdf');
const url = URL.createObjectURL(pdfBlob);

// Download
const a = document.createElement('a');
a.href = url;
a.download = 'Self_Assessment_Report.pdf';
a.click();
```

---

## Comparison: Edge Functions vs Lambda

| Feature | Edge Functions (Current) | AWS Lambda (Optional) |
|---------|-------------------------|----------------------|
| **PDF Generation** | ❌ HTML only | ✅ Binary PDF |
| **Setup Complexity** | ✅ Simple | ⚠️ Complex (Chromium layer) |
| **Cost** | ✅ Low | ⚠️ Higher (memory + time) |
| **Performance** | ✅ Fast (HTML gen) | ⚠️ Slower (Puppeteer) |
| **Client Work** | ⚠️ Needs PDF conversion | ✅ Ready-to-download PDF |
| **Deployment** | ✅ Already deployed | ❌ Separate deployment |
| **Maintenance** | ✅ Easy | ⚠️ Chromium updates |

---

## Schema Updates for PDF Generation

### Added `version` Column

```sql
-- Updated tax_calculation_snapshots table
create table if not exists public.tax_calculation_snapshots (
  id uuid primary key default gen_random_uuid(),
  calculation_id uuid not null references public.tax_calculations(id) on delete cascade,
  snapshot_data jsonb not null,
  version integer not null default 1,  -- NEW: Version tracking
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(calculation_id, version)  -- Ensure unique versions
);

-- Index for fast version lookup
create index if not exists idx_tax_calculation_snapshots_version
on public.tax_calculation_snapshots(calculation_id, version desc);
```

### Querying Latest Snapshot

```typescript
// Get latest version
const { data: latest } = await supabase
  .from('tax_calculation_snapshots')
  .select('*')
  .eq('calculation_id', calcId)
  .order('version', { ascending: false })
  .limit(1)
  .single();

// Get specific version
const { data: specific } = await supabase
  .from('tax_calculation_snapshots')
  .select('*')
  .eq('calculation_id', calcId)
  .eq('version', 2)
  .single();

// Get all versions (history)
const { data: history } = await supabase
  .from('tax_calculation_snapshots')
  .select('*')
  .eq('calculation_id', calcId)
  .order('version', { ascending: false });
```

---

## UkTaxSnapshot Integration

Both approaches use the standardized `UkTaxSnapshot` type:

```typescript
{
  meta: {
    country: "UK",
    taxYear: "2024/2025",
    currency: "GBP",
    computedAt: "2024-12-12T...",
    methodVersion: "uk-sa-v1"
  },
  taxpayer: {
    name: "Sample User",
    utr: "1234567890"
  },
  inputs: {
    employmentIncome: 85000,
    propertyProfit: 16620,
    dividends: 3530,
    interest: 1100,
    // ... other inputs
  },
  outputs: {
    totalIncome: 106250,
    taxableIncome: 93680,
    incomeTax: 29932,
    totalTaxDue: 36158,
    amountDueBy31Jan: 11443,
    // ... other outputs
  },
  breakdown: {
    incomeLines: [
      { label: "UK Employment", amount: 85000 },
      { label: "Overseas Rental Income", amount: 16620 },
      // ...
    ],
    allowanceLines: [
      { label: "Personal Allowance", amount: 12570 }
    ],
    taxLines: [
      { label: "Basic Rate Income Tax (£37,700 @ 20%)", amount: 7540 },
      { label: "Higher Rate Income Tax (£55,980 @ 40%)", amount: 22392 },
      // ...
    ]
  },
  gaceExtensions: {
    foreignTaxCredits: [ /* ... */ ],
    aiInsights: [ /* ... */ ],
    complianceChecks: [ /* ... */ ]
  }
}
```

### HTML Generation from Snapshot

```typescript
function buildSaHtml(snapshot: UkTaxSnapshot) {
  // Extract structured data
  const incomeLines = snapshot.breakdown.incomeLines;
  const taxLines = snapshot.breakdown.taxLines;
  const foreignCredits = snapshot.gaceExtensions?.foreignTaxCredits;
  
  // Generate tables
  const incomeTable = incomeLines
    .map(line => `<tr><td>${line.label}</td><td class="r">${money(line.amount)}</td></tr>`)
    .join('');
  
  const taxTable = taxLines
    .map(line => `<tr><td>${line.label}</td><td class="r">${money(line.amount)}</td></tr>`)
    .join('');
  
  // Build complete HTML...
}
```

---

## External PDF Services

If you don't want to manage Puppeteer/Chromium, use a PDF service:

### 1. PDFShift
```javascript
const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa('api:YOUR_API_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source: html,
    format: 'A4',
    margin: '16mm',
    landscape: false,
    use_print: true
  })
});
```

### 2. DocRaptor
```javascript
const response = await fetch('https://docraptor.com/docs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_credentials: 'YOUR_API_KEY_HERE',
    doc: {
      document_content: html,
      type: 'pdf',
      test: false
    }
  })
});
```

### 3. Browserless.io
```javascript
const response = await fetch('https://chrome.browserless.io/pdf?token=YOUR_TOKEN', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    html: html,
    options: {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '16mm',
        right: '14mm',
        bottom: '16mm',
        left: '14mm'
      }
    }
  })
});
```

---

## Recommended Approach

### For MVP / Demo
✅ **Use Edge Functions** (current implementation)
- Generate HTML
- Use browser print dialog for PDF
- Simple, no external dependencies
- Works immediately

### For Production
Consider one of these:

**Option A: External PDF Service** (Recommended)
- ✅ No infrastructure management
- ✅ Professional PDF output
- ✅ Easy integration
- ⚠️ Subscription cost

**Option B: AWS Lambda with Puppeteer**
- ✅ Full control
- ✅ No per-PDF costs
- ⚠️ Complex setup
- ⚠️ Higher compute costs

**Option C: Client-Side PDF Library**
- Libraries: jsPDF, pdfmake
- ✅ No backend needed
- ⚠️ Limited HTML support
- ⚠️ Larger bundle size

---

## Testing

### Test Edge Function (Current)
```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/make-server-b5fd51b8/tax/generate-pdf \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"taxYear": 2024}'
```

### Test Lambda Function
```bash
aws lambda invoke \
  --function-name gace-pdf-generator \
  --payload '{"body": "{\"calculationId\": \"uuid-here\"}"}' \
  --cli-binary-format raw-in-base64-out \
  response.json
```

---

## Summary

✅ **Current Setup**: Edge Functions generate HMRC-style HTML  
✅ **Database Updated**: `version` column added for snapshot versioning  
✅ **UkTaxSnapshot Compatible**: Both approaches use standardized types  
✅ **Lambda Alternative**: Available in `/lambda-pdf-generator.js`  
✅ **Flexible Options**: Choose client-side, server-side, or external service  

**For Innovator Founder endorsement**, the current Edge Function + browser print approach demonstrates:
- ✅ Production-ready architecture
- ✅ Scalable design
- ✅ Professional HMRC-compliant reports
- ✅ Cost-effective solution

Deploy the Lambda version later if you need server-side PDF generation! 🚀
