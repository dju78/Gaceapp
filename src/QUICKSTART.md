# 🚀 GACE PDF Generation - Quick Start

Get your Self Assessment Report feature running in **5 minutes**!

---

## Step 1: Run Database Migration (1 min)

Open **Supabase SQL Editor** and run:

```sql
-- Add version column
alter table public.tax_calculation_snapshots 
add column if not exists version integer not null default 1;

-- Add unique constraint
alter table public.tax_calculation_snapshots 
add constraint unique_calc_version 
unique (calculation_id, version);

-- Add index
create index if not exists idx_tax_calculation_snapshots_version
on public.tax_calculation_snapshots(calculation_id, version desc);
```

---

## Step 2: Seed Sample Data (1 min)

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/make-server-b5fd51b8/seed-sample-data \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Verify in Supabase**:
```sql
SELECT * FROM tax_calculations;
SELECT * FROM tax_calculation_snapshots;
```

---

## Step 3: Add Component to Your App (2 min)

```tsx
// In your main App.tsx or routes file
import { SelfAssessmentReportPage } from './components/SelfAssessmentReportPage';

// Add route
<Route path="/reports" element={<SelfAssessmentReportPage />} />
```

---

## Step 4: Navigate and Test (1 min)

1. Open `http://localhost:5173/reports`
2. Select tax year: **2024**
3. See summary card with £36,158 total tax due
4. Click **"Generate PDF Report"**
5. Print dialog opens → Save as PDF ✅

---

## ✅ You're Done!

Your Self Assessment Report feature is now:
- ✅ Generating HMRC-style reports
- ✅ Using versioned snapshots
- ✅ Displaying foreign tax credits
- ✅ Showing AI insights
- ✅ Production-ready

---

## 🔧 Troubleshooting

### No calculation found?
```bash
# Re-run seeding
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/make-server-b5fd51b8/seed-sample-data \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### PDF button disabled?
Check calculation status:
```sql
SELECT status FROM tax_calculations WHERE tax_year = '2024/2025';
```
Should be `COMPUTED`, `LOCKED`, or `SUBMITTED`.

### Version not showing?
```sql
SELECT version FROM tax_calculation_snapshots;
```
Should show `1`. If NULL, run migration again.

### HTML not rendering?
Check browser console for errors. Verify endpoint returns HTML:
```javascript
console.log(result.html.substring(0, 100));
```

---

## 📖 Full Documentation

- **Complete Guide**: `/INTEGRATION_COMPLETE.md`
- **PDF Generation**: `/PDF_GENERATION_GUIDE.md`
- **Components**: `/REPORT_COMPONENT_GUIDE.md`
- **Schema**: `/SCHEMA_UPDATES_SUMMARY.md`
- **Type Validation**: `/VALIDATION_SUMMARY.md`

---

## 🎯 Next: Deploy Lambda (Optional)

For server-side PDF generation:

1. Read `/PDF_GENERATION_GUIDE.md`
2. Deploy `/lambda-pdf-generator.js` to AWS
3. Configure Lambda with 2GB memory, 30s timeout
4. Add Chromium layer
5. Update frontend to call Lambda URL

---

**Happy coding!** 🚀
