# GACE Sample Data Generation Guide

This guide explains how to populate sample data for testing the Self Assessment Report feature.

## Overview

We've created a comprehensive sample data seeding system that will generate:
- 4 overseas assets (Spain, USA, UAE, Singapore)
- Complete tax calculation for 2024/2025 with all metadata
- Sample documents
- Realistic UK tax scenario with £482,000 in overseas assets

## Prerequisites

1. You must be logged in as a user
2. Your database must have the required tables (see `/database-schema.sql`)
3. Run the SQL in `/database-schema.sql` in your Supabase SQL Editor first

## Option 1: Use the Seeding Endpoint (Recommended)

### Step 1: Execute the Database Schema

Open your Supabase SQL Editor and run the SQL from `/database-schema.sql`:

```sql
-- This creates the tables: tax_calculations, assets, documents
-- Run all CREATE TABLE statements from database-schema.sql
```

### Step 2: Call the Seeding Endpoint

After logging in, make a POST request to populate your user's data:

```javascript
// From your frontend (e.g., in a React component or browser console)
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-b5fd51b8/seed/populate`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`, // Your session token
      'Content-Type': 'application/json'
    }
  }
);

const result = await response.json();
console.log('Sample data created:', result);
```

This will create:
- 4 assets worth £482,000 total
- 1 tax calculation for 2024/2025 with £11,443 balance due
- 3 sample documents

### Step 3: Fetch the Report Data

Now you can fetch the comprehensive report data:

```javascript
const reportResponse = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-b5fd51b8/seed/report-data`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);

const reportData = await reportResponse.json();
console.log('Report data:', reportData);
```

## Option 2: Manual SQL Insertion

If you prefer to insert data directly, use the sample INSERT statements in `/database-schema.sql`:

1. Replace `'YOUR_USER_ID_HERE'` with your actual user ID
2. Run the INSERT statements in Supabase SQL Editor

## Sample Data Structure

The generated data includes:

### Assets (4 total):
1. **Spain - Barcelona Apartment** (£245,000)
   - Rental income: €18,500
   - Foreign tax paid: £1,845
   
2. **USA - Investment Portfolio** (£98,000)
   - Dividends: $4,500
   - Capital gains: $8,200
   - Foreign tax paid: £530

3. **UAE - Dubai Commercial Property** (£95,000)
   - Rental income: AED 24,000
   - No foreign tax (UAE has no income tax)

4. **Singapore - Bank Account** (£44,000)
   - Interest: SGD 1,875
   - No withholding tax

### Tax Calculation for 2024/2025:
- **Total Income**: £106,250 (UK employment + overseas)
- **Personal Allowance**: £12,570
- **Taxable Income**: £93,680
- **Total UK Tax Liability**: £36,158
- **Foreign Tax Credits**: £2,375
- **Balance Due**: £11,443

### Double Taxation Agreements:
- Spain: Credit method, £1,845 relief
- USA: Credit method, £530 relief
- UAE: Exemption method
- Singapore: Credit method

### AI Insights:
- 6 smart recommendations based on the tax scenario
- Compliance deadlines
- Optimization suggestions

## Testing the PDF Generation

Once you have sample data, test the PDF generation:

```javascript
const pdfResponse = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-b5fd51b8/tax/generate-pdf`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      taxYear: 2024
    })
  }
);

const pdfResult = await pdfResponse.json();
console.log('PDF generated:', pdfResult);
// Download URL will be in pdfResult.downloadUrl
```

## Cleaning Up Sample Data

To remove the sample data:

```sql
-- In Supabase SQL Editor
DELETE FROM assets WHERE user_id = 'YOUR_USER_ID';
DELETE FROM tax_calculations WHERE user_id = 'YOUR_USER_ID';
DELETE FROM documents WHERE user_id = 'YOUR_USER_ID';
```

## Troubleshooting

### "Missing sub claim" Error
This usually means your access token is invalid or expired. Get a fresh token:

```javascript
const { data: { session } } = await supabase.auth.getSession();
const accessToken = session?.access_token;
```

### "Table does not exist" Error
Run the SQL schema from `/database-schema.sql` in your Supabase SQL Editor.

### "Foreign key constraint violation"
Make sure your user profile exists in the `user_profiles` table before seeding data.

### "RLS policy violation"
The seed endpoint uses the service role key on the backend, so it bypasses RLS. If you're seeing this error, you might be trying to query data directly from the frontend without proper policies.

## Next Steps

After populating sample data:

1. Navigate to the Self Assessment Report page
2. The report should auto-load with your sample data
3. Test PDF generation
4. Test different scenarios by modifying the data
5. Present your MVP demo with realistic data!

## Production Considerations

- This seeding system is for DEMO/MVP purposes only
- In production, use real user data from asset imports and calculations
- Consider adding data validation before seeding
- Implement proper error handling and rollback on failures
- Add audit logging for compliance purposes
