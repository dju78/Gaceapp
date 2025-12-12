# Quick Start: Generate Sample Self Assessment Report

## 3 Simple Steps to Generate Your Report

### Step 1: Set Up the Database (One-Time Setup)

Open your **Supabase SQL Editor** and run the SQL from `/database-schema.sql`:

```sql
-- Copy and paste the CREATE TABLE statements from database-schema.sql
-- This creates: tax_calculations, assets, documents tables
```

**Important**: Make sure to run ALL sections from the schema file:
1. ✅ CREATE TABLE statements
2. ✅ CREATE INDEX statements  
3. ✅ ALTER TABLE ... ENABLE ROW LEVEL SECURITY statements
4. ✅ CREATE POLICY statements (RLS policies)

The RLS policies ensure that:
- Users can only access their own data
- The seeding endpoint (using service role key) can bypass RLS to create data
- Your app is secure and compliant

### Step 2: Populate Sample Data

**Option A: Using the UI Component (Easiest)**

1. Add the `SampleDataSeeder` component to your dashboard:

```tsx
import { SampleDataSeeder } from './components/SampleDataSeeder';

// In your component
<SampleDataSeeder />
```

2. Click "Populate Sample Data" button
3. Done! Data is created for your logged-in user

**Option B: Using API Directly**

```javascript
// In browser console or React component
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-b5fd51b8/seed/populate`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  }
);

const result = await response.json();
console.log('Created:', result);
```

**Option C: Manual SQL (For Testing)**

Replace `'YOUR_USER_ID_HERE'` with your user ID in `/database-schema.sql` and run the INSERT statements.

### Step 3: View Your Report

Navigate to the Self Assessment Report page and your sample data will be displayed!

---

## What Sample Data Gets Created

✅ **4 Overseas Assets** (Total: £482,000)
- 🏠 Spain: Barcelona Apartment (£245,000)
- 💼 USA: Investment Portfolio (£98,000)  
- 🏢 UAE: Dubai Commercial Property (£95,000)
- 🏦 Singapore: Bank Account (£44,000)

✅ **Complete Tax Calculation for 2024/2025**
- Total Income: £106,250
- UK Tax Liability: £36,158
- Foreign Tax Credits: £2,375
- **Balance Due: £11,443**

✅ **Double Taxation Analysis**
- Spain: Credit Method (£1,845 relief)
- USA: Credit Method (£530 relief)
- UAE: Exemption Method
- Singapore: Credit Method

✅ **6 AI-Powered Insights**
- Tax optimization recommendations
- Compliance deadlines (SA100, SA106, SA108)
- DTA treaty guidance

✅ **3 Sample Documents**
- Spanish rental income statement
- US 1099-DIV form
- Dubai rental agreement

---

## Available API Endpoints

### Seed Data
```
POST /make-server-b5fd51b8/seed/populate
Requires: Authorization header with access token
```

### Get Report Data
```
GET /make-server-b5fd51b8/seed/report-data
Requires: Authorization header with access token
Returns: Complete report data structure
```

### Generate PDF
```
POST /make-server-b5fd51b8/tax/generate-pdf
Body: { "taxYear": 2024 }
Requires: Authorization header with access token
Returns: PDF download URL
```

---

## Sample Report Data Structure

The `/seed/report-data` endpoint returns:

```json
{
  "user": {
    "id": "...",
    "name": "User Name",
    "email": "user@example.com",
    "nino": "AB123456C",
    "utr": "1234567890"
  },
  "taxYear": "2024/2025",
  "assets": [...],
  "incomeBreakdown": {...},
  "taxCalculation": {...},
  "doubleTaxationAgreements": [...],
  "complianceChecks": [...],
  "aiInsights": [...],
  "documents": [...],
  "nextSteps": [...]
}
```

---

## Troubleshooting

### ❌ "invalid claim: missing sub claim"
- Your access token is invalid or expired
- Get a fresh token: `await supabase.auth.getSession()`

### ❌ "Table does not exist"  
- Run the SQL schema from `/database-schema.sql`

### ❌ "Unauthorized"
- Make sure you're logged in
- Check that you're using the correct access token

### ❌ "Foreign key constraint"
- Ensure your user profile exists in `user_profiles` table

---

## Clean Up Sample Data

To remove all sample data:

```javascript
const { data: { user } } = await supabase.auth.getUser();

await supabase.from('documents').delete().eq('user_id', user.id);
await supabase.from('tax_calculations').delete().eq('user_id', user.id);
await supabase.from('assets').delete().eq('user_id', user.id);
```

Or use the "Clear All Data" button in the `SampleDataSeeder` component.

---

## For Your MVP Demo

This sample data creates a perfect scenario for demonstrating:

1. ✅ Multi-jurisdiction asset tracking
2. ✅ Complex UK tax calculations with DTA relief
3. ✅ AI-powered compliance insights
4. ✅ Professional Self Assessment Report generation
5. ✅ PDF export functionality
6. ✅ RegTech innovation for Innovator Founder endorsement

**Total overseas assets: £482,000**  
**Countries covered: Spain, USA, UAE, Singapore**  
**Tax optimization: £2,375 in foreign tax credits**  
**Professional HMRC-compliant reporting**

Perfect for showcasing the power of your GACE platform! 🚀