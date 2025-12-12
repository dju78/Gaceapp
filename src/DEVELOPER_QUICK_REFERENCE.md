# Developer Quick Reference - Sample Data & UkTaxSnapshot

## 🚀 Quick Commands

### Populate Sample Data
```bash
# Option 1: Use UI Component
<SampleDataSeeder />

# Option 2: API Call
POST /make-server-b5fd51b8/seed/populate
Authorization: Bearer {access_token}

# Option 3: Run SQL directly in Supabase
# Copy/paste from database-schema.sql
```

### Retrieve Report Data
```bash
GET /make-server-b5fd51b8/seed/report-data
Authorization: Bearer {access_token}
```

### Clear All Data
```javascript
const { data: { user } } = await supabase.auth.getUser();
await supabase.from('documents').delete().eq('user_id', user.id);
await supabase.from('tax_calculation_snapshots').delete().eq('calculation_id', /* calc_id */);
await supabase.from('tax_calculations').delete().eq('user_id', user.id);
await supabase.from('assets').delete().eq('user_id', user.id);
```

---

## 📊 Database Tables

### tax_calculations (Summary Data)
```typescript
{
  id: uuid,
  user_id: uuid,
  country: string,              // "UK"
  tax_year: string,             // "2024/2025"
  status: string,               // "COMPUTED"
  currency: string,             // "GBP"
  total_tax_due: number,        // 36158
  amount_due_by_31jan: number,  // 11443
  computed_at: timestamp,
  metadata: jsonb               // Flexible metadata
}
```

### tax_calculation_snapshots (Full Snapshot)
```typescript
{
  id: uuid,
  calculation_id: uuid,         // FK to tax_calculations
  snapshot_data: jsonb,         // Full UkTaxSnapshot
  created_at: timestamp,
  updated_at: timestamp
}
```

### assets
```typescript
{
  id: uuid,
  user_id: uuid,
  asset_type: string,           // "property" | "securities" | "bank_account"
  country: string,              // "Spain" | "United States" | etc.
  description: string,
  value_gbp: number,
  value_local: number,
  local_currency: string,       // "EUR" | "USD" | etc.
  acquisition_date: date,
  ownership_percentage: number,
  tax_paid_locally: number,
  metadata: jsonb               // Asset-specific data
}
```

### documents
```typescript
{
  id: uuid,
  user_id: uuid,
  document_type: string,        // "income_statement" | "tax_certificate" | "contract"
  file_name: string,
  file_path: string,
  file_size: number,
  status: string,               // "verified" | "pending"
  uploaded_at: timestamp,
  metadata: jsonb
}
```

---

## 🔐 RLS Policies Quick Reference

All tables have RLS enabled. Users can only access their own data:

```sql
-- Users can only SELECT/INSERT/UPDATE their own records
using (auth.uid() = user_id)
with check (auth.uid() = user_id)

-- Snapshots: users own via FK join
using (
  exists (
    select 1 from tax_calculations c
    where c.id = calculation_id and c.user_id = auth.uid()
  )
)
```

**Backend Exception**: Service role key bypasses RLS (used for seeding).

---

## 📝 UkTaxSnapshot Type Quick Reference

### Core Structure
```typescript
type UkTaxSnapshot = {
  meta: {
    country: "UK";
    taxYear: string;           // "2024/2025"
    currency: "GBP";
    computedAt: string;        // ISO timestamp
    methodVersion: string;     // "uk-sa-v1"
  };
  taxpayer: {
    name: string;
    utr?: string;
  };
  inputs: {
    employmentIncome?: number;
    selfEmploymentProfit?: number;
    propertyProfit?: number;
    interest?: number;
    dividends?: number;
    pensionContrib?: number;
  };
  outputs: {
    totalIncome: number;
    taxableIncome: number;
    incomeTax: number;
    nicClass2?: number;
    nicClass4?: number;
    totalTaxDue: number;
    paymentsOnAccount?: number;
    amountDueBy31Jan: number;
  };
  breakdown: {
    incomeLines: { label: string; amount: number }[];
    allowanceLines: { label: string; amount: number }[];
    taxLines: { label: string; amount: number }[];
  };
};
```

### GACE Extensions
```typescript
type GaceTaxSnapshot = UkTaxSnapshot & {
  gaceExtensions?: {
    foreignTaxCredits?: Array<{
      country: string;
      amount: number;
      method: string;
      articles: string;
    }>;
    complianceChecks?: Array<{
      requirement: string;
      status: string;
      deadline?: string;
      notes?: string;
    }>;
    aiInsights?: Array<{
      category: string;
      severity: string;
      title: string;
      description: string;
      actionable: boolean;
    }>;
    overseasAssets?: Array<{
      country: string;
      type: string;
      value: number;
      income: number;
    }>;
  };
};
```

---

## 💡 Common Queries

### Get Latest Snapshot for User
```typescript
const { data } = await supabase
  .from('tax_calculations')
  .select(`
    *,
    snapshots:tax_calculation_snapshots(*)
  `)
  .eq('user_id', userId)
  .eq('tax_year', '2024/2025')
  .single();

const snapshot = data.snapshots[0]?.snapshot_data as GaceTaxSnapshot;
```

### Get All Assets for User
```typescript
const { data: assets } = await supabase
  .from('assets')
  .select('*')
  .eq('user_id', userId)
  .order('country');
```

### Get All Documents for User
```typescript
const { data: docs } = await supabase
  .from('documents')
  .select('*')
  .eq('user_id', userId)
  .order('uploaded_at', { ascending: false });
```

### Create New Tax Calculation with Snapshot
```typescript
// 1. Insert summary record
const { data: calc } = await supabase
  .from('tax_calculations')
  .insert({
    user_id: userId,
    country: 'UK',
    tax_year: '2024/2025',
    status: 'COMPUTED',
    currency: 'GBP',
    total_tax_due: snapshot.outputs.totalTaxDue,
    amount_due_by_31jan: snapshot.outputs.amountDueBy31Jan,
    computed_at: snapshot.meta.computedAt,
  })
  .select()
  .single();

// 2. Insert full snapshot
await supabase
  .from('tax_calculation_snapshots')
  .insert({
    calculation_id: calc.id,
    snapshot_data: snapshot,
  });
```

### Update Existing Snapshot
```typescript
const { data } = await supabase
  .from('tax_calculation_snapshots')
  .update({
    snapshot_data: updatedSnapshot,
    updated_at: new Date().toISOString(),
  })
  .eq('calculation_id', calcId)
  .select()
  .single();
```

---

## 🎯 Sample Data Values

### 4 Assets (Total: £482,000)
| Country    | Type       | Value (GBP) | Income (GBP) |
|------------|------------|-------------|--------------|
| Spain      | Property   | £245,000    | £16,620      |
| USA        | Securities | £98,000     | £8,030       |
| UAE        | Property   | £95,000     | £5,130       |
| Singapore  | Bank       | £44,000     | £1,100       |

### Tax Summary (2024/2025)
```
Total Income:           £106,250
Personal Allowance:      £12,570
Taxable Income:          £93,680

Income Tax:              £29,932
Capital Gains Tax:          £686
National Insurance:       £5,540
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Tax Due:           £36,158

Foreign Tax Credits:      £2,375
Tax Paid (PAYE):         £22,340
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Balance Due (31 Jan):    £11,443
```

### 4 Foreign Tax Credits
- Spain: £1,845 (Credit Method)
- USA: £530 (Credit Method)
- UAE: £0 (Exemption Method)
- Singapore: £0 (Credit Method)

### 3 Sample Documents
1. Spanish Rental Income Statement 2024.pdf
2. US 1099-DIV Form.pdf
3. Dubai Rental Agreement.pdf

---

## 🔍 Troubleshooting

### Error: "invalid claim: missing sub claim"
**Cause**: Invalid or expired access token  
**Fix**: Get fresh token with `await supabase.auth.getSession()`

### Error: "new row violates row-level security policy"
**Cause**: Frontend trying to insert with user-level permissions  
**Fix**: Use backend endpoint with service role key

### Error: "relation does not exist"
**Cause**: Database tables not created  
**Fix**: Run `/database-schema.sql` in Supabase SQL Editor

### Error: "Foreign key violation"
**Cause**: User profile doesn't exist  
**Fix**: Ensure user_profiles table has entry for the user

### Empty Results from Queries
**Cause**: RLS policies blocking access  
**Fix**: Verify `auth.uid()` matches `user_id` in data

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `/QUICK_START.md` | 3-step getting started guide |
| `/SAMPLE_DATA_GUIDE.md` | Comprehensive usage instructions |
| `/RLS_AND_SEEDING.md` | Security and RLS explanation |
| `/UK_TAX_SNAPSHOT_INTEGRATION.md` | UkTaxSnapshot type details |
| `/IMPLEMENTATION_COMPLETE.md` | Complete implementation summary |
| `/database-schema.sql` | SQL schema with RLS policies |
| `/sample-report-data.json` | Sample JSON data reference |
| `/types/tax-snapshot.ts` | TypeScript type definitions |

---

## ⚡ Quick Tips

1. **Always use `UkTaxSnapshot` type** for type safety
2. **Store summary in `tax_calculations`** for fast queries
3. **Store full data in `snapshots`** for detailed reports
4. **Use service role key on backend only** (never in frontend)
5. **Test RLS policies** with real user tokens
6. **Version your snapshots** using `methodVersion` field
7. **Query JSONB fields** for complex snapshot data queries
8. **Upsert calculations** to avoid duplicates (user_id, country, tax_year)

---

## 🎬 Demo Preparation Checklist

- [ ] Run SQL schema in Supabase
- [ ] Populate sample data (click button or call API)
- [ ] Verify 4 assets created
- [ ] Verify tax calculation exists
- [ ] Check snapshot data is properly structured
- [ ] Test Self Assessment Report rendering
- [ ] Generate PDF and review
- [ ] Test RLS (try accessing other user's data - should fail)
- [ ] Clear and re-populate to test reproducibility
- [ ] Review all 4 AI insights display correctly

---

## 🚀 Integration Workflow

```
1. User logs in
   ↓
2. Populate sample data (one-click or API)
   ↓
3. Data created:
   - 4 assets in assets table
   - 1 tax_calculation in tax_calculations table
   - 1 snapshot in tax_calculation_snapshots table
   - 3 documents in documents table
   ↓
4. Navigate to Self Assessment Report
   ↓
5. Report fetches data:
   - Summary from tax_calculations
   - Full snapshot from tax_calculation_snapshots
   - Assets from assets table
   - Documents from documents table
   ↓
6. Display structured report with:
   - Income breakdown (from snapshot.breakdown.incomeLines)
   - Tax calculation (from snapshot.breakdown.taxLines)
   - DTA analysis (from snapshot.gaceExtensions.foreignTaxCredits)
   - AI insights (from snapshot.gaceExtensions.aiInsights)
   - Compliance (from snapshot.gaceExtensions.complianceChecks)
   ↓
7. Generate PDF (uses snapshot data)
   ↓
8. Download and review
```

---

**Last Updated**: December 12, 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
