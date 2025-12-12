// Type definitions for UK Tax Calculation Snapshots
// Used in tax_calculation_snapshots.snapshot_data JSONB column

export type UkTaxSnapshot = {
  meta: {
    country: "UK";
    taxYear: string;         // "2025/26"
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

// Extended snapshot type for GACE with additional metadata
export type GaceTaxSnapshot = UkTaxSnapshot & {
  gaceExtensions?: {
    // Foreign tax credits from DTA analysis
    foreignTaxCredits?: {
      country: string;
      amount: number;
      method: string; // "Credit Method" | "Exemption Method"
      articles: string;
    }[];
    
    // Compliance requirements
    complianceChecks?: {
      requirement: string;
      status: string;
      deadline?: string;
      notes?: string;
    }[];
    
    // AI-generated insights
    aiInsights?: {
      category: string;
      severity: string;
      title: string;
      description: string;
      actionable: boolean;
    }[];
    
    // Overseas assets summary
    overseasAssets?: {
      country: string;
      type: string;
      value: number;
      income: number;
    }[];
  };
};
