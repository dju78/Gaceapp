# UkTaxSnapshot Type Integration

## Overview

The seeding system now uses your `UkTaxSnapshot` type definition to create properly structured tax calculation data. This ensures compatibility with your UK tax calculation engine and provides a standardized format for storing and retrieving tax data.

---

## Type Structure

### Core `UkTaxSnapshot` Type

```typescript
export type UkTaxSnapshot = {
  meta: {
    country: "UK";
    taxYear: string;         // "2024/2025"
    currency: "GBP";
    computedAt: string;      // ISO string
    methodVersion: string;   // "uk-sa-v1"
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

### Extended `GaceTaxSnapshot` Type

For GACE-specific features (DTA analysis, AI insights, compliance tracking), we've created an extended type:

```typescript
export type GaceTaxSnapshot = UkTaxSnapshot & {
  gaceExtensions?: {
    foreignTaxCredits?: {
      country: string;
      amount: number;
      method: string;
      articles: string;
    }[];
    complianceChecks?: {
      requirement: string;
      status: string;
      deadline?: string;
      notes?: string;
    }[];
    aiInsights?: {
      category: string;
      severity: string;
      title: string;
      description: string;
      actionable: boolean;
    }[];
    overseasAssets?: {
      country: string;
      type: string;
      value: number;
      income: number;
    }[];
  };
};
```

---

## Database Storage Strategy

### Two-Table Approach

We use a dual-table approach for optimal performance and flexibility:

#### 1. **`tax_calculations` table** - Summary Data
Stores high-level summary data for quick queries and listing:

```typescript
{
  user_id: string,
  country: "UK",
  tax_year: "2024/2025",
  status: "COMPUTED",
  currency: "GBP",
  total_tax_due: 36158,
  amount_due_by_31jan: 11443,
  computed_at: "2024-12-12T...",
  metadata: {
    taxpayer: { ... },
    inputs: { ... },
    outputs: { ... }
  }
}
```

#### 2. **`tax_calculation_snapshots` table** - Full Snapshot
Stores complete `UkTaxSnapshot` data in JSONB column:

```typescript
{
  id: uuid,
  calculation_id: uuid,  // FK to tax_calculations
  snapshot_data: GaceTaxSnapshot,  // Full JSONB snapshot
  created_at: timestamp,
  updated_at: timestamp
}
```

### Why This Approach?

✅ **Fast queries** - List all calculations without loading full snapshots  
✅ **Versioning** - Store multiple snapshots per calculation  
✅ **Flexibility** - Full snapshot preserves all calculation details  
✅ **Performance** - Summary data is indexed, full data loaded only when needed  

---

## Sample Data Generated

When you populate sample data, the system creates a `GaceTaxSnapshot` with:

### Inputs
```json
{
  "employmentIncome": 85000,
  "selfEmploymentProfit": 0,
  "propertyProfit": 16620,
  "interest": 1100,
  "dividends": 3530,
  "pensionContrib": 0
}
```

### Outputs
```json
{
  "totalIncome": 106250,
  "taxableIncome": 93680,
  "incomeTax": 29932,
  "nicClass2": 5540,
  "nicClass4": 0,
  "totalTaxDue": 36158,
  "paymentsOnAccount": 0,
  "amountDueBy31Jan": 11443
}
```

### Breakdown
```json
{
  "incomeLines": [
    { "label": "UK Employment", "amount": 85000 },
    { "label": "Overseas Rental Income", "amount": 16620 },
    { "label": "Overseas Dividends", "amount": 3530 },
    { "label": "Overseas Interest", "amount": 1100 }
  ],
  "allowanceLines": [
    { "label": "Personal Allowance", "amount": 12570 }
  ],
  "taxLines": [
    { "label": "Basic Rate Income Tax (£37,700 @ 20%)", "amount": 7540 },
    { "label": "Higher Rate Income Tax (£55,980 @ 40%)", "amount": 22392 },
    { "label": "Capital Gains Tax", "amount": 686 },
    { "label": "National Insurance Contributions", "amount": 5540 }
  ]
}
```

### GACE Extensions
```json
{
  "foreignTaxCredits": [
    {
      "country": "Spain",
      "amount": 1845,
      "method": "Credit Method",
      "articles": "Articles 6, 10, 23"
    },
    // ... 3 more countries
  ],
  "complianceChecks": [
    {
      "requirement": "SA100 Self Assessment",
      "status": "Required",
      "deadline": "2026-01-31",
      "notes": "File SA100 Self Assessment by 31 January 2026"
    },
    // ... more checks
  ],
  "aiInsights": [
    {
      "category": "Double Taxation Relief",
      "severity": "Info",
      "title": "Spanish Rental Property Relief",
      "description": "Your Spanish rental property qualifies...",
      "actionable": true
    },
    // ... more insights
  ],
  "overseasAssets": [
    {
      "country": "Spain",
      "type": "property",
      "value": 245000,
      "income": 16620
    },
    // ... 3 more assets
  ]
}
```

---

## How to Use the Snapshots

### Creating a Snapshot

```typescript
// Your tax calculation engine creates a UkTaxSnapshot
const snapshot: UkTaxSnapshot = {
  meta: {
    country: "UK",
    taxYear: "2024/2025",
    currency: "GBP",
    computedAt: new Date().toISOString(),
    methodVersion: "uk-sa-v1",
  },
  taxpayer: { name: user.name, utr: user.utr },
  inputs: { /* user's input data */ },
  outputs: { /* calculated results */ },
  breakdown: { /* detailed breakdown */ },
};

// Store in database
const { data: calc } = await supabase
  .from('tax_calculations')
  .insert({
    user_id: userId,
    country: "UK",
    tax_year: "2024/2025",
    total_tax_due: snapshot.outputs.totalTaxDue,
    amount_due_by_31jan: snapshot.outputs.amountDueBy31Jan,
    // ... other summary fields
  })
  .select()
  .single();

// Store full snapshot
await supabase
  .from('tax_calculation_snapshots')
  .insert({
    calculation_id: calc.id,
    snapshot_data: snapshot,
  });
```

### Retrieving a Snapshot

```typescript
// Get calculation with full snapshot
const { data: calc } = await supabase
  .from('tax_calculations')
  .select(`
    *,
    snapshots:tax_calculation_snapshots(*)
  `)
  .eq('user_id', userId)
  .eq('tax_year', '2024/2025')
  .single();

const latestSnapshot = calc.snapshots[0]?.snapshot_data as GaceTaxSnapshot;

// Access structured data
console.log('Total income:', latestSnapshot.outputs.totalIncome);
console.log('Tax due:', latestSnapshot.outputs.amountDueBy31Jan);
console.log('Foreign credits:', latestSnapshot.gaceExtensions?.foreignTaxCredits);
```

### Querying Snapshot Data

Since `snapshot_data` is JSONB, you can query it directly:

```sql
-- Find all calculations with high foreign tax credits
SELECT 
  tc.user_id,
  tc.tax_year,
  tcs.snapshot_data->'gaceExtensions'->'foreignTaxCredits'
FROM tax_calculations tc
JOIN tax_calculation_snapshots tcs ON tcs.calculation_id = tc.id
WHERE (tcs.snapshot_data->'gaceExtensions'->'foreignTaxCredits'->0->>'amount')::numeric > 1000;

-- Get all AI insights for a user
SELECT 
  tc.tax_year,
  jsonb_array_elements(tcs.snapshot_data->'gaceExtensions'->'aiInsights') as insight
FROM tax_calculations tc
JOIN tax_calculation_snapshots tcs ON tcs.calculation_id = tc.id
WHERE tc.user_id = 'user-id';
```

---

## Benefits of This Structure

### ✅ Type Safety
- TypeScript enforces correct structure
- No missing or mistyped fields
- IDE autocomplete support

### ✅ Extensibility
- Core `UkTaxSnapshot` remains stable
- `gaceExtensions` can grow without breaking changes
- Easy to add new GACE features

### ✅ Compatibility
- Works with your existing tax engine
- Standardized format across the app
- Easy integration with reporting

### ✅ Versioning
- `methodVersion` tracks calculation algorithm
- Multiple snapshots per calculation supported
- Easy to compare versions over time

### ✅ Performance
- Summary data in `tax_calculations` for fast listing
- Full data loaded only when needed
- JSONB indexing available for complex queries

---

## Integration Checklist

- [x] **Type definitions created** (`/types/tax-snapshot.ts`)
- [x] **Database schema updated** (`tax_calculation_snapshots` table with RLS)
- [x] **Seeding system updated** (creates proper `UkTaxSnapshot` structures)
- [x] **Sample data uses correct types** (all fields populated correctly)
- [ ] **Your tax engine uses `UkTaxSnapshot`** (integrate when ready)
- [ ] **Report generation reads from snapshots** (use `snapshot_data` field)
- [ ] **PDF generation uses structured breakdown** (access via `snapshot_data.breakdown`)

---

## Next Steps

### 1. Update Your Tax Calculation Engine

Modify your calculation engine to output `UkTaxSnapshot` format:

```typescript
import { UkTaxSnapshot } from '../types/tax-snapshot';

export function calculateUkTax(inputs: TaxInputs): UkTaxSnapshot {
  // Your existing calculation logic
  
  return {
    meta: {
      country: "UK",
      taxYear: inputs.taxYear,
      currency: "GBP",
      computedAt: new Date().toISOString(),
      methodVersion: "uk-sa-v1",
    },
    taxpayer: {
      name: inputs.taxpayerName,
      utr: inputs.utr,
    },
    inputs: {
      employmentIncome: inputs.employment,
      propertyProfit: inputs.property,
      // ... map your inputs
    },
    outputs: {
      totalIncome: /* calculated */,
      taxableIncome: /* calculated */,
      incomeTax: /* calculated */,
      totalTaxDue: /* calculated */,
      amountDueBy31Jan: /* calculated */,
      // ... other outputs
    },
    breakdown: {
      incomeLines: [/* ... */],
      allowanceLines: [/* ... */],
      taxLines: [/* ... */],
    },
  };
}
```

### 2. Update Report Components

Use the structured snapshot data in your reports:

```typescript
const { data } = await supabase
  .from('tax_calculations')
  .select('*, snapshots:tax_calculation_snapshots(*)')
  .eq('user_id', userId)
  .single();

const snapshot = data.snapshots[0]?.snapshot_data as GaceTaxSnapshot;

// Use structured data in your components
<TaxBreakdown 
  incomeLines={snapshot.breakdown.incomeLines}
  taxLines={snapshot.breakdown.taxLines}
/>

<ForeignTaxCredits 
  credits={snapshot.gaceExtensions?.foreignTaxCredits}
/>

<AIInsights 
  insights={snapshot.gaceExtensions?.aiInsights}
/>
```

### 3. PDF Generation

Access the structured breakdown for PDF generation:

```typescript
const snapshot = await getLatestSnapshot(userId, taxYear);

// Generate PDF sections from structured data
generateIncomeSection(snapshot.breakdown.incomeLines);
generateTaxSection(snapshot.breakdown.taxLines);
generateDTASection(snapshot.gaceExtensions?.foreignTaxCredits);
```

---

## Summary

Your GACE application now has:

✅ **Standardized tax snapshot format** (`UkTaxSnapshot`)  
✅ **Extended GACE-specific data** (`GaceTaxSnapshot`)  
✅ **Dual-table storage** (summary + full snapshot)  
✅ **Sample data using correct types**  
✅ **Type-safe querying and manipulation**  

The sample data seeding system creates properly structured `UkTaxSnapshot` objects that are compatible with your tax calculation engine and ready for integration with your reporting and PDF generation features!
