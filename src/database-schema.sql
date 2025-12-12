-- GACE Application Database Schema
-- This file documents the complete database structure for the GACE RegTech platform
-- NOTE: Execute these DDL statements in your Supabase SQL Editor, not via the application

-- ============================================
-- TAX CALCULATIONS TABLE (Already exists)
-- ============================================
create table if not exists public.tax_calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  country text not null check (country in ('UK','NG')),
  tax_year text not null, -- e.g. '2025/26'
  status text not null default 'DRAFT' check (status in ('DRAFT','COMPUTED','LOCKED','VOID')),
  currency text not null default 'GBP',
  total_tax_due numeric(12,2) not null default 0,
  amount_due_by_31jan numeric(12,2) not null default 0,
  computed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb, -- Store detailed tax calculation data, DTA info, compliance checks
  unique (user_id, country, tax_year)
);

create index if not exists idx_tax_calculations_user_year
on public.tax_calculations(user_id, country, tax_year);

-- ============================================
-- TAX CALCULATION SNAPSHOTS TABLE
-- ============================================
create table if not exists public.tax_calculation_snapshots (
  id uuid primary key default gen_random_uuid(),
  calculation_id uuid not null references public.tax_calculations(id) on delete cascade,
  snapshot_data jsonb not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Ensure unique versions per calculation
  unique(calculation_id, version)
);

create index if not exists idx_tax_calculation_snapshots_calculation_id
on public.tax_calculation_snapshots(calculation_id);

create index if not exists idx_tax_calculation_snapshots_version
on public.tax_calculation_snapshots(calculation_id, version desc);

-- ============================================
-- ASSETS TABLE
-- ============================================
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  asset_type text not null check (asset_type in ('property','securities','bank_account','crypto','pension','other')),
  country text not null,
  description text not null,
  value_gbp numeric(15,2) not null,
  value_local numeric(15,2),
  local_currency text,
  acquisition_date date,
  ownership_percentage numeric(5,2) default 100 check (ownership_percentage > 0 and ownership_percentage <= 100),
  tax_paid_locally numeric(12,2) default 0,
  metadata jsonb, -- Additional asset-specific data (rental income, dividends, etc.)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assets_user_id on public.assets(user_id);
create index if not exists idx_assets_country on public.assets(country);
create index if not exists idx_assets_type on public.assets(asset_type);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  document_type text not null check (document_type in ('income_statement','tax_certificate','contract','bank_statement','self_assessment','other')),
  file_name text not null,
  file_path text not null,
  file_size bigint,
  status text default 'pending' check (status in ('pending','processing','verified','rejected')),
  metadata jsonb, -- OCR data, extracted info, country, asset references
  uploaded_at timestamptz not null default now(),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_documents_type on public.documents(document_type);
create index if not exists idx_documents_status on public.documents(status);

-- ============================================
-- USER PROFILES TABLE (Likely already exists)
-- ============================================
create table if not exists public.user_profiles (
  id uuid primary key,
  email text unique not null,
  user_type text not null check (user_type in ('client','advisor','admin')),
  full_name text not null,
  company_name text,
  has_completed_onboarding boolean default false,
  admin_role text check (admin_role in ('super_admin','support',null)),
  metadata jsonb, -- Additional profile data (address, phone, NINO, UTR, etc.)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_email on public.user_profiles(email);
create index if not exists idx_user_profiles_type on public.user_profiles(user_type);

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================
-- Use the /make-server-b5fd51b8/seed/populate endpoint to populate sample data
-- Or execute these manual INSERT statements for a specific user:

-- Example for user ID: 'YOUR_USER_ID_HERE'
/*
INSERT INTO public.assets (user_id, asset_type, country, description, value_gbp, value_local, local_currency, acquisition_date, ownership_percentage, tax_paid_locally, metadata)
VALUES
  ('YOUR_USER_ID_HERE', 'property', 'Spain', 'Rental Property - Barcelona Apartment', 245000, 285000, 'EUR', '2021-03-15', 100, 1845, 
    '{"address": "Carrer de Mallorca, 401, Barcelona", "rentalIncome": 18500, "expenses": 4200}'::jsonb),
  ('YOUR_USER_ID_HERE', 'securities', 'United States', 'US Investment Portfolio', 98000, 125000, 'USD', '2020-06-10', 100, 530,
    '{"dividends": 4500, "capitalGains": 8200, "broker": "Interactive Brokers"}'::jsonb),
  ('YOUR_USER_ID_HERE', 'property', 'United Arab Emirates', 'Dubai Commercial Property', 95000, 450000, 'AED', '2022-11-20', 100, 0,
    '{"address": "Business Bay, Dubai", "rentalIncome": 24000, "expenses": 3600}'::jsonb),
  ('YOUR_USER_ID_HERE', 'bank_account', 'Singapore', 'Singapore Bank Account', 44000, 75000, 'SGD', '2019-01-05', 100, 0,
    '{"bank": "DBS Bank", "interest": 1875}'::jsonb);

INSERT INTO public.tax_calculations (user_id, country, tax_year, status, currency, total_tax_due, amount_due_by_31jan, computed_at, metadata)
VALUES
  ('YOUR_USER_ID_HERE', 'UK', '2024/2025', 'COMPUTED', 'GBP', 36158, 11443, now(),
    '{
      "incomeBreakdown": {
        "ukEmployment": {"gross": 85000, "taxPaid": 22340, "niPaid": 5540},
        "overseasIncome": {"rentalIncome": 16620, "dividends": 3530, "interest": 1100, "total": 21250},
        "capitalGains": {"uk": 0, "overseas": 6430, "total": 6430}
      },
      "taxCalculation": {
        "totalIncome": 106250,
        "personalAllowance": 12570,
        "taxableIncome": 93680,
        "ukTaxBreakdown": {
          "basicRate": {"amount": 37700, "rate": 0.20, "tax": 7540},
          "higherRate": {"amount": 55980, "rate": 0.40, "tax": 22392},
          "additionalRate": {"amount": 0, "rate": 0.45, "tax": 0},
          "totalIncomeTax": 29932
        },
        "capitalGainsTax": {
          "taxableGains": 6430,
          "annualExemption": 3000,
          "taxableAmount": 3430,
          "rate": 0.20,
          "tax": 686
        },
        "nationalInsurance": 5540,
        "totalUKTaxLiability": 36158,
        "foreignTaxCredit": {"spain": 1845, "usa": 530, "uae": 0, "singapore": 0, "total": 2375},
        "netTaxPayable": 33783,
        "taxAlreadyPaid": 22340,
        "balanceDue": 11443
      },
      "doubleTaxationAgreements": [
        {"country": "Spain", "applied": true, "relief": 1845, "method": "Credit Method", "articles": "Articles 6, 10, 23"},
        {"country": "United States", "applied": true, "relief": 530, "method": "Credit Method", "articles": "Articles 10, 13, 24"},
        {"country": "United Arab Emirates", "applied": true, "relief": 0, "method": "Exemption Method", "articles": "Article 6", "note": "UAE has no income tax on rental income"},
        {"country": "Singapore", "applied": true, "relief": 0, "method": "Credit Method", "articles": "Article 11", "note": "No withholding tax on interest for non-residents"}
      ],
      "complianceChecks": [
        {"requirement": "SA100 Self Assessment", "status": "Required", "deadline": "2026-01-31", "completed": false},
        {"requirement": "SA106 Foreign Income", "status": "Required", "deadline": "2026-01-31", "completed": false},
        {"requirement": "SA108 Capital Gains", "status": "Required", "deadline": "2026-01-31", "completed": false},
        {"requirement": "Trust Registration Service", "status": "Not Required", "completed": null}
      ],
      "aiInsights": [
        "Your Spanish rental property qualifies for double taxation relief under the UK-Spain DTA Article 6. Foreign tax credit of £1,845 has been applied.",
        "US dividend income is subject to 15% withholding tax under the UK-US treaty. You may claim foreign tax credit of £530.",
        "Your Dubai property income is exempt from UAE tax. No foreign tax credit available, but income must still be declared in UK.",
        "Total overseas assets exceed £100,000 - ensure all foreign income is reported on SA106.",
        "Consider pension contributions to reduce higher rate tax liability of £22,392.",
        "You may benefit from remittance basis election if you are non-UK domiciled (not applied in this calculation)."
      ]
    }'::jsonb);
*/

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables
alter table public.tax_calculations enable row level security;
alter table public.tax_calculation_snapshots enable row level security;
alter table public.assets enable row level security;
alter table public.documents enable row level security;
alter table public.user_profiles enable row level security;

-- Tax Calculations policies - only owner can access
create policy "tax_calculations_select_own"
  on public.tax_calculations for select
  using (auth.uid() = user_id);

create policy "tax_calculations_insert_own"
  on public.tax_calculations for insert
  with check (auth.uid() = user_id);

create policy "tax_calculations_update_own"
  on public.tax_calculations for update
  using (auth.uid() = user_id);

-- Tax Calculation Snapshots policies - owner through join
create policy "snapshots_select_own"
  on public.tax_calculation_snapshots for select
  using (
    exists (
      select 1 from public.tax_calculations c
      where c.id = calculation_id and c.user_id = auth.uid()
    )
  );

create policy "snapshots_insert_own"
  on public.tax_calculation_snapshots for insert
  with check (
    exists (
      select 1 from public.tax_calculations c
      where c.id = calculation_id and c.user_id = auth.uid()
    )
  );

-- Assets policies
create policy "Users can view own assets"
  on public.assets for select
  using (auth.uid() = user_id);

create policy "Users can insert own assets"
  on public.assets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own assets"
  on public.assets for update
  using (auth.uid() = user_id);

create policy "Users can delete own assets"
  on public.assets for delete
  using (auth.uid() = user_id);

-- Documents policies
create policy "Users can view own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own documents"
  on public.documents for update
  using (auth.uid() = user_id);

-- User Profiles policies
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================
-- Execute this in Supabase SQL Editor or via the server startup routine:
/*
-- Create private bucket for documents
insert into storage.buckets (id, name, public)
values ('make-b5fd51b8-documents', 'make-b5fd51b8-documents', false)
on conflict (id) do nothing;

-- Storage policies
create policy "Users can upload own documents"
  on storage.objects for insert
  with check (bucket_id = 'make-b5fd51b8-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own documents"
  on storage.objects for select
  using (bucket_id = 'make-b5fd51b8-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own documents"
  on storage.objects for delete
  using (bucket_id = 'make-b5fd51b8-documents' and auth.uid()::text = (storage.foldername(name))[1]);
*/