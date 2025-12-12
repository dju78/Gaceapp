import { createClient } from "npm:@supabase/supabase-js";

// Type definitions matching /types/tax-snapshot.ts
type UkTaxSnapshot = {
  meta: {
    country: "UK";
    taxYear: string;
    currency: "GBP";
    computedAt: string;
    methodVersion: string;
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

type GaceTaxSnapshot = UkTaxSnapshot & {
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

// Sample data seeding utilities for GACE application
export async function seedSampleData(userId: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`[Seed] Starting data seeding for user: ${userId}`);

  try {
    // 1. Create sample assets
    const assets = [
      {
        user_id: userId,
        asset_type: "property",
        country: "Spain",
        description: "Rental Property - Barcelona Apartment",
        value_gbp: 245000,
        value_local: 285000,
        local_currency: "EUR",
        acquisition_date: "2021-03-15",
        ownership_percentage: 100,
        tax_paid_locally: 1845,
        metadata: {
          address: "Carrer de Mallorca, 401, Barcelona",
          rentalIncome: 18500,
          expenses: 4200,
        },
      },
      {
        user_id: userId,
        asset_type: "securities",
        country: "United States",
        description: "US Investment Portfolio",
        value_gbp: 98000,
        value_local: 125000,
        local_currency: "USD",
        acquisition_date: "2020-06-10",
        ownership_percentage: 100,
        tax_paid_locally: 530,
        metadata: {
          dividends: 4500,
          capitalGains: 8200,
          broker: "Interactive Brokers",
        },
      },
      {
        user_id: userId,
        asset_type: "property",
        country: "United Arab Emirates",
        description: "Dubai Commercial Property",
        value_gbp: 95000,
        value_local: 450000,
        local_currency: "AED",
        acquisition_date: "2022-11-20",
        ownership_percentage: 100,
        tax_paid_locally: 0,
        metadata: {
          address: "Business Bay, Dubai",
          rentalIncome: 24000,
          expenses: 3600,
        },
      },
      {
        user_id: userId,
        asset_type: "bank_account",
        country: "Singapore",
        description: "Singapore Bank Account",
        value_gbp: 44000,
        value_local: 75000,
        local_currency: "SGD",
        acquisition_date: "2019-01-05",
        ownership_percentage: 100,
        tax_paid_locally: 0,
        metadata: {
          bank: "DBS Bank",
          interest: 1875,
        },
      },
    ];

    console.log("[Seed] Inserting assets...");
    const { data: insertedAssets, error: assetsError } = await supabase
      .from("assets")
      .insert(assets)
      .select();

    if (assetsError) {
      console.error("[Seed] Error inserting assets:", assetsError);
      throw assetsError;
    }

    console.log(`[Seed] Inserted ${insertedAssets?.length || 0} assets`);

    // 2. Create comprehensive tax snapshot using UkTaxSnapshot type
    const taxSnapshot: GaceTaxSnapshot = {
      meta: {
        country: "UK",
        taxYear: "2024/2025",
        currency: "GBP",
        computedAt: new Date().toISOString(),
        methodVersion: "uk-sa-v1",
      },
      taxpayer: {
        name: "Sample User",
        utr: "1234567890",
      },
      inputs: {
        employmentIncome: 85000,
        selfEmploymentProfit: 0,
        propertyProfit: 16620,
        interest: 1100,
        dividends: 3530,
        pensionContrib: 0,
      },
      outputs: {
        totalIncome: 106250,
        taxableIncome: 93680,
        incomeTax: 29932,
        nicClass2: 5540,
        nicClass4: 0,
        totalTaxDue: 36158,
        paymentsOnAccount: 0,
        amountDueBy31Jan: 11443,
      },
      breakdown: {
        incomeLines: [
          { label: "UK Employment", amount: 85000 },
          { label: "Overseas Rental Income", amount: 16620 },
          { label: "Overseas Dividends", amount: 3530 },
          { label: "Overseas Interest", amount: 1100 },
        ],
        allowanceLines: [
          { label: "Personal Allowance", amount: 12570 },
        ],
        taxLines: [
          { label: "Basic Rate Income Tax (£37,700 @ 20%)", amount: 7540 },
          { label: "Higher Rate Income Tax (£55,980 @ 40%)", amount: 22392 },
          { label: "Capital Gains Tax", amount: 686 },
          { label: "National Insurance Contributions", amount: 5540 },
        ],
      },
      gaceExtensions: {
        foreignTaxCredits: [
          {
            country: "Spain",
            amount: 1845,
            method: "Credit Method",
            articles: "Articles 6, 10, 23",
          },
          {
            country: "United States",
            amount: 530,
            method: "Credit Method",
            articles: "Articles 10, 13, 24",
          },
          {
            country: "United Arab Emirates",
            amount: 0,
            method: "Exemption Method",
            articles: "Article 6",
          },
          {
            country: "Singapore",
            amount: 0,
            method: "Credit Method",
            articles: "Article 11",
          },
        ],
        complianceChecks: [
          {
            requirement: "SA100 Self Assessment",
            status: "Required",
            deadline: "2026-01-31",
            notes: "File SA100 Self Assessment by 31 January 2026",
          },
          {
            requirement: "SA106 Foreign Income",
            status: "Required",
            deadline: "2026-01-31",
            notes: "Complete SA106 Foreign Income pages for all overseas income",
          },
          {
            requirement: "SA108 Capital Gains",
            status: "Required",
            deadline: "2026-01-31",
            notes: "Submit SA108 for US capital gains declaration",
          },
        ],
        aiInsights: [
          {
            category: "Double Taxation Relief",
            severity: "Info",
            title: "Spanish Rental Property Relief",
            description:
              "Your Spanish rental property qualifies for double taxation relief under the UK-Spain DTA Article 6. Foreign tax credit of £1,845 has been applied.",
            actionable: true,
          },
          {
            category: "Double Taxation Relief",
            severity: "Info",
            title: "US Dividend Income Relief",
            description:
              "US dividend income is subject to 15% withholding tax under the UK-US treaty. You may claim foreign tax credit of £530.",
            actionable: true,
          },
          {
            category: "Overseas Assets",
            severity: "Warning",
            title: "High Overseas Assets",
            description:
              "Total overseas assets exceed £100,000 - ensure all foreign income is reported on SA106.",
            actionable: true,
          },
          {
            category: "Tax Optimization",
            severity: "Info",
            title: "Pension Contributions",
            description:
              "Consider pension contributions to reduce higher rate tax liability of £22,392.",
            actionable: true,
          },
        ],
        overseasAssets: [
          {
            country: "Spain",
            type: "property",
            value: 245000,
            income: 16620,
          },
          {
            country: "United States",
            type: "securities",
            value: 98000,
            income: 8030,
          },
          {
            country: "United Arab Emirates",
            type: "property",
            value: 95000,
            income: 5130,
          },
          {
            country: "Singapore",
            type: "bank_account",
            value: 44000,
            income: 1100,
          },
        ],
      },
    };

    console.log("[Seed] Inserting tax calculation record...");

    // First, insert the tax_calculations table row (summary data)
    const taxCalculationRow = {
      user_id: userId,
      country: "UK",
      tax_year: "2024/2025",
      status: "COMPUTED",
      currency: "GBP",
      total_tax_due: taxSnapshot.outputs.totalTaxDue,
      amount_due_by_31jan: taxSnapshot.outputs.amountDueBy31Jan,
      computed_at: taxSnapshot.meta.computedAt,
      metadata: {
        taxpayer: taxSnapshot.taxpayer,
        inputs: taxSnapshot.inputs,
        outputs: taxSnapshot.outputs,
      },
    };

    const { data: taxCalc, error: taxError } = await supabase
      .from("tax_calculations")
      .upsert(taxCalculationRow, {
        onConflict: "user_id,country,tax_year",
      })
      .select()
      .single();

    if (taxError) {
      console.error("[Seed] Error inserting tax calculation:", taxError);
      throw taxError;
    }

    console.log("[Seed] Inserted tax calculation:", taxCalc?.id);

    // Second, insert the tax_calculation_snapshots table row (full UkTaxSnapshot)
    console.log("[Seed] Inserting tax calculation snapshot...");

    const { data: snapshot, error: snapshotError } = await supabase
      .from("tax_calculation_snapshots")
      .insert({
        calculation_id: taxCalc.id,
        snapshot_data: taxSnapshot,
        version: 1, // Initial version
      })
      .select()
      .single();

    if (snapshotError) {
      console.error("[Seed] Error inserting snapshot:", snapshotError);
      // Don't throw - snapshot might not be critical
      console.log("[Seed] Continuing without snapshot...");
    } else {
      console.log("[Seed] Inserted snapshot:", snapshot?.id);
    }

    // 3. Create sample documents
    const documents = [
      {
        user_id: userId,
        document_type: "income_statement",
        file_name: "Spanish Rental Income Statement 2024.pdf",
        file_path: "sample/spanish-rental-income-2024.pdf",
        file_size: 245678,
        status: "verified",
        metadata: {
          country: "Spain",
          assetType: "property",
          taxYear: "2024",
        },
      },
      {
        user_id: userId,
        document_type: "tax_certificate",
        file_name: "US 1099-DIV Form.pdf",
        file_path: "sample/us-1099-div-2024.pdf",
        file_size: 123456,
        status: "verified",
        metadata: {
          country: "United States",
          assetType: "securities",
          taxYear: "2024",
        },
      },
      {
        user_id: userId,
        document_type: "contract",
        file_name: "Dubai Rental Agreement.pdf",
        file_path: "sample/dubai-rental-agreement.pdf",
        file_size: 567890,
        status: "verified",
        metadata: {
          country: "United Arab Emirates",
          assetType: "property",
        },
      },
    ];

    console.log("[Seed] Inserting documents...");
    const { data: insertedDocs, error: docsError } = await supabase
      .from("documents")
      .insert(documents)
      .select();

    if (docsError) {
      console.error("[Seed] Error inserting documents:", docsError);
      // Don't throw - documents might not have all required fields
      console.log("[Seed] Skipping documents due to error");
    } else {
      console.log(`[Seed] Inserted ${insertedDocs?.length || 0} documents`);
    }

    console.log("[Seed] Data seeding completed successfully!");

    return {
      success: true,
      data: {
        assets: insertedAssets,
        taxCalculation: taxCalc,
        documents: insertedDocs || [],
      },
    };
  } catch (error) {
    console.error("[Seed] Error during data seeding:", error);
    throw error;
  }
}

// Get comprehensive sample report data for a user
export async function getSampleReportData(userId: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`[Sample Data] Fetching report data for user: ${userId}`);

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Get assets
    const { data: assets } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", userId);

    // Get tax calculation
    const { data: taxCalc } = await supabase
      .from("tax_calculations")
      .select("*")
      .eq("user_id", userId)
      .eq("tax_year", "2024/2025")
      .maybeSingle();

    // Get documents
    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId);

    // Transform into comprehensive report format
    const reportData = {
      user: {
        id: userId,
        name: profile?.full_name || "Sample User",
        email: profile?.email || "user@example.com",
        role: profile?.user_type || "client",
        nino: "AB123456C",
        utr: "1234567890",
        address: {
          line1: "45 Kensington Gardens",
          line2: "Flat 3B",
          city: "London",
          postcode: "W2 4QH",
          country: "United Kingdom",
        },
      },
      taxYear: taxCalc?.meta?.taxYear || "2024/2025",
      reportGeneratedDate: new Date().toISOString(),
      assets: assets?.map((asset) => ({
        id: asset.id,
        name: asset.description,
        type: asset.asset_type,
        country: asset.country,
        value: asset.value_local,
        currency: asset.local_currency,
        valueGBP: asset.value_gbp,
        acquisitionDate: asset.acquisition_date,
        income: asset.metadata || {},
      })) || [],
      incomeBreakdown: {
        ukEmployment: {
          gross: taxCalc?.inputs?.employmentIncome || 0,
          taxPaid: taxCalc?.breakdown?.taxLines.find(line => line.label === "Basic Rate Income Tax")?.amount || 0,
          niPaid: taxCalc?.breakdown?.taxLines.find(line => line.label === "National Insurance Contributions")?.amount || 0,
        },
        overseasIncome: {
          rentalIncome: taxCalc?.inputs?.propertyProfit || 0,
          dividends: taxCalc?.inputs?.dividends || 0,
          interest: taxCalc?.inputs?.interest || 0,
          total: taxCalc?.inputs?.propertyProfit + taxCalc?.inputs?.dividends + taxCalc?.inputs?.interest || 0,
        },
        capitalGains: {
          uk: 0,
          overseas: taxCalc?.inputs?.capitalGains || 0,
          total: taxCalc?.inputs?.capitalGains || 0,
        },
      },
      taxCalculation: {
        totalIncome: taxCalc?.outputs?.totalIncome || 0,
        personalAllowance: taxCalc?.breakdown?.allowanceLines.find(line => line.label === "Personal Allowance")?.amount || 0,
        taxableIncome: taxCalc?.outputs?.taxableIncome || 0,
        ukTaxBreakdown: {
          basicRate: { amount: taxCalc?.breakdown?.taxLines.find(line => line.label === "Basic Rate Income Tax")?.amount || 0, rate: 0.20, tax: taxCalc?.breakdown?.taxLines.find(line => line.label === "Basic Rate Income Tax")?.amount || 0 },
          higherRate: { amount: taxCalc?.breakdown?.taxLines.find(line => line.label === "Higher Rate Income Tax")?.amount || 0, rate: 0.40, tax: taxCalc?.breakdown?.taxLines.find(line => line.label === "Higher Rate Income Tax")?.amount || 0 },
          additionalRate: { amount: taxCalc?.breakdown?.taxLines.find(line => line.label === "Additional Rate Income Tax")?.amount || 0, rate: 0.45, tax: taxCalc?.breakdown?.taxLines.find(line => line.label === "Additional Rate Income Tax")?.amount || 0 },
          totalIncomeTax: taxCalc?.outputs?.incomeTax || 0,
        },
        capitalGainsTax: {
          taxableGains: taxCalc?.inputs?.capitalGains || 0,
          annualExemption: 3000,
          taxableAmount: taxCalc?.inputs?.capitalGains - 3000 > 0 ? taxCalc?.inputs?.capitalGains - 3000 : 0,
          rate: 0.20,
          tax: taxCalc?.breakdown?.taxLines.find(line => line.label === "Capital Gains Tax")?.amount || 0,
        },
        nationalInsurance: taxCalc?.breakdown?.taxLines.find(line => line.label === "National Insurance Contributions")?.amount || 0,
        totalUKTaxLiability: taxCalc?.outputs?.totalTaxDue || 0,
        foreignTaxCredit: {
          spain: taxCalc?.gaceExtensions?.foreignTaxCredits?.find(credit => credit.country === "Spain")?.amount || 0,
          usa: taxCalc?.gaceExtensions?.foreignTaxCredits?.find(credit => credit.country === "United States")?.amount || 0,
          uae: taxCalc?.gaceExtensions?.foreignTaxCredits?.find(credit => credit.country === "United Arab Emirates")?.amount || 0,
          singapore: taxCalc?.gaceExtensions?.foreignTaxCredits?.find(credit => credit.country === "Singapore")?.amount || 0,
          total: taxCalc?.gaceExtensions?.foreignTaxCredits?.reduce((sum, credit) => sum + credit.amount, 0) || 0,
        },
        netTaxPayable: taxCalc?.outputs?.totalTaxDue - taxCalc?.gaceExtensions?.foreignTaxCredits?.reduce((sum, credit) => sum + credit.amount, 0) || 0,
        taxAlreadyPaid: taxCalc?.inputs?.employmentIncome ? taxCalc?.breakdown?.taxLines.find(line => line.label === "Basic Rate Income Tax")?.amount + taxCalc?.breakdown?.taxLines.find(line => line.label === "Higher Rate Income Tax")?.amount + taxCalc?.breakdown?.taxLines.find(line => line.label === "Additional Rate Income Tax")?.amount : 0,
        balanceDue: taxCalc?.outputs?.amountDueBy31Jan || 0,
      },
      doubleTaxationAgreements: taxCalc?.gaceExtensions?.foreignTaxCredits?.map(credit => ({
        country: credit.country,
        applied: true,
        relief: credit.amount,
        method: credit.method,
        articles: credit.articles,
        note: credit.notes,
      })) || [],
      complianceChecks: taxCalc?.gaceExtensions?.complianceChecks?.map(check => ({
        requirement: check.requirement,
        status: check.status,
        deadline: check.deadline,
        notes: check.notes,
      })) || [],
      aiInsights: taxCalc?.gaceExtensions?.aiInsights?.map(insight => ({
        category: insight.category,
        severity: insight.severity,
        title: insight.title,
        description: insight.description,
        actionable: insight.actionable,
      })) || [],
      documents: documents?.map((doc) => ({
        id: doc.id,
        name: doc.file_name,
        type: doc.document_type,
        uploadDate: doc.uploaded_at,
        status: doc.status,
      })) || [],
      nextSteps: [
        "File SA100 Self Assessment by 31 January 2026",
        "Complete SA106 Foreign Income pages for all overseas income",
        "Submit SA108 for US capital gains declaration",
        `Pay balance of £${taxCalc?.outputs?.amountDueBy31Jan || 0} by 31 January 2026 to avoid penalties`,
        "Consider setting up payment on account for next tax year",
        "Review double taxation treaty positions annually",
      ],
    };

    return reportData;
  } catch (error) {
    console.error("[Sample Data] Error fetching report data:", error);
    throw error;
  }
}