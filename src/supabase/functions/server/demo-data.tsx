/**
 * Demo Data Generator for GACE Application
 * Creates realistic demo scenarios for presentations and testing
 */

export interface DemoUser {
  email: string;
  password: string;
  fullName: string;
  userType: 'individual' | 'tax_advisor' | 'admin';
  companyName?: string;
  scenario: string;
  assets: DemoAsset[];
  documents?: DemoDocument[];
}

export interface DemoAsset {
  asset_type: 'property' | 'investment' | 'pension' | 'business' | 'bank_account' | 'other';
  country: string;
  description: string;
  value_gbp: number;
  value_local: number;
  local_currency: string;
  acquisition_date: string;
  ownership_percentage: number;
  tax_paid_locally: number;
}

export interface DemoDocument {
  document_type: string;
  file_name: string;
  description: string;
}

/**
 * Demo User Scenarios
 */
export const DEMO_USERS: DemoUser[] = [
  {
    email: 'demo.expat@gace.demo',
    password: 'Demo123!',
    fullName: 'Sarah Mitchell',
    userType: 'individual',
    scenario: 'UK Expat with US Property Portfolio',
    assets: [
      {
        asset_type: 'property',
        country: 'United States',
        description: 'Rental property in Manhattan, New York - 2-bedroom apartment generating rental income',
        value_gbp: 850000,
        value_local: 1100000,
        local_currency: 'USD',
        acquisition_date: '2019-06-15',
        ownership_percentage: 100,
        tax_paid_locally: 15400,
      },
      {
        asset_type: 'property',
        country: 'United States',
        description: 'Vacation home in Miami Beach, Florida - 3-bedroom beachfront condo',
        value_gbp: 620000,
        value_local: 800000,
        local_currency: 'USD',
        acquisition_date: '2021-03-22',
        ownership_percentage: 100,
        tax_paid_locally: 8200,
      },
      {
        asset_type: 'investment',
        country: 'United States',
        description: 'US stock portfolio - Mix of tech and dividend-paying stocks (Apple, Microsoft, J&J)',
        value_gbp: 185000,
        value_local: 240000,
        local_currency: 'USD',
        acquisition_date: '2018-01-10',
        ownership_percentage: 100,
        tax_paid_locally: 4800,
      },
      {
        asset_type: 'bank_account',
        country: 'United States',
        description: 'Chase Bank USD savings account - Emergency fund and rental income',
        value_gbp: 77000,
        value_local: 100000,
        local_currency: 'USD',
        acquisition_date: '2018-09-01',
        ownership_percentage: 100,
        tax_paid_locally: 450,
      },
    ],
  },
  {
    email: 'demo.investor@gace.demo',
    password: 'Demo123!',
    fullName: 'James Chen',
    userType: 'individual',
    scenario: 'Multi-Jurisdiction Investment Portfolio',
    assets: [
      {
        asset_type: 'investment',
        country: 'Switzerland',
        description: 'Swiss private banking portfolio - Diversified fund including bonds and equities',
        value_gbp: 420000,
        value_local: 480000,
        local_currency: 'CHF',
        acquisition_date: '2017-11-05',
        ownership_percentage: 100,
        tax_paid_locally: 8900,
      },
      {
        asset_type: 'investment',
        country: 'Singapore',
        description: 'Singapore REIT portfolio - Real estate investment trusts focused on commercial property',
        value_gbp: 290000,
        value_local: 500000,
        local_currency: 'SGD',
        acquisition_date: '2020-02-14',
        ownership_percentage: 100,
        tax_paid_locally: 3200,
      },
      {
        asset_type: 'property',
        country: 'Spain',
        description: 'Holiday villa in Costa del Sol - 4-bedroom villa with sea views',
        value_gbp: 385000,
        value_local: 450000,
        local_currency: 'EUR',
        acquisition_date: '2016-07-20',
        ownership_percentage: 50,
        tax_paid_locally: 2100,
      },
      {
        asset_type: 'pension',
        country: 'Australia',
        description: 'Australian superannuation fund - From previous employment in Sydney',
        value_gbp: 145000,
        value_local: 280000,
        local_currency: 'AUD',
        acquisition_date: '2010-03-01',
        ownership_percentage: 100,
        tax_paid_locally: 0,
      },
      {
        asset_type: 'business',
        country: 'Germany',
        description: 'Minority stake in German tech startup - 15% equity ownership',
        value_gbp: 95000,
        value_local: 110000,
        local_currency: 'EUR',
        acquisition_date: '2022-05-10',
        ownership_percentage: 15,
        tax_paid_locally: 0,
      },
    ],
  },
  {
    email: 'demo.business@gace.demo',
    password: 'Demo123!',
    fullName: 'Priya Patel',
    userType: 'individual',
    scenario: 'Business Owner with International Operations',
    assets: [
      {
        asset_type: 'business',
        country: 'United Arab Emirates',
        description: 'E-commerce business in Dubai Free Zone - Online retail platform',
        value_gbp: 580000,
        value_local: 2650000,
        local_currency: 'AED',
        acquisition_date: '2019-09-01',
        ownership_percentage: 75,
        tax_paid_locally: 0, // Tax-free zone
      },
      {
        asset_type: 'property',
        country: 'United Arab Emirates',
        description: 'Commercial property in Dubai Marina - Office space for business operations',
        value_gbp: 425000,
        value_local: 1950000,
        local_currency: 'AED',
        acquisition_date: '2020-11-15',
        ownership_percentage: 75,
        tax_paid_locally: 0,
      },
      {
        asset_type: 'bank_account',
        country: 'United Arab Emirates',
        description: 'Emirates NBD business account - Operating capital and reserves',
        value_gbp: 155000,
        value_local: 710000,
        local_currency: 'AED',
        acquisition_date: '2019-09-01',
        ownership_percentage: 100,
        tax_paid_locally: 0,
      },
      {
        asset_type: 'investment',
        country: 'India',
        description: 'Indian stock market portfolio - NSE listed companies including Infosys, TCS, Reliance',
        value_gbp: 68000,
        value_local: 7200000,
        local_currency: 'INR',
        acquisition_date: '2021-04-12',
        ownership_percentage: 100,
        tax_paid_locally: 1850,
      },
    ],
  },
  {
    email: 'demo.advisor@gace.demo',
    password: 'Demo123!',
    fullName: 'Robert Williams',
    userType: 'tax_advisor',
    companyName: 'Williams Tax Advisory Ltd',
    scenario: 'Tax Advisor Managing Multiple Client Portfolios',
    assets: [], // Advisors manage other users' assets
  },
  {
    email: 'demo.retiree@gace.demo',
    password: 'Demo123!',
    fullName: 'Margaret Thompson',
    userType: 'individual',
    scenario: 'Retiree with Overseas Pensions and Property',
    assets: [
      {
        asset_type: 'pension',
        country: 'France',
        description: 'French state pension - From 15 years working in Paris',
        value_gbp: 185000,
        value_local: 215000,
        local_currency: 'EUR',
        acquisition_date: '2005-01-01',
        ownership_percentage: 100,
        tax_paid_locally: 3200,
      },
      {
        asset_type: 'property',
        country: 'France',
        description: 'Apartment in Paris 6th arrondissement - Retirement property',
        value_gbp: 520000,
        value_local: 605000,
        local_currency: 'EUR',
        acquisition_date: '2008-06-20',
        ownership_percentage: 100,
        tax_paid_locally: 4800,
      },
      {
        asset_type: 'pension',
        country: 'Canada',
        description: 'Canadian RRSP - Registered retirement savings from early career',
        value_gbp: 92000,
        value_local: 160000,
        local_currency: 'CAD',
        acquisition_date: '1995-03-15',
        ownership_percentage: 100,
        tax_paid_locally: 0,
      },
      {
        asset_type: 'bank_account',
        country: 'France',
        description: 'BNP Paribas EUR account - Living expenses and pension deposits',
        value_gbp: 34000,
        value_local: 40000,
        local_currency: 'EUR',
        acquisition_date: '2005-01-01',
        ownership_percentage: 100,
        tax_paid_locally: 180,
      },
    ],
  },
  {
    email: 'demo.simple@gace.demo',
    password: 'Demo123!',
    fullName: 'David Lee',
    userType: 'individual',
    scenario: 'Simple Case - Single Overseas Bank Account',
    assets: [
      {
        asset_type: 'bank_account',
        country: 'Hong Kong',
        description: 'HSBC Hong Kong savings account - Inherited from parents',
        value_gbp: 48000,
        value_local: 480000,
        local_currency: 'HKD',
        acquisition_date: '2023-02-10',
        ownership_percentage: 100,
        tax_paid_locally: 0,
      },
    ],
  },
];

/**
 * Generate tax calculation data for demo users
 */
export function generateDemoTaxCalculation(userId: string, assets: DemoAsset[], taxYear: number) {
  const totalForeignIncome = assets.reduce((sum, a) => {
    // Estimate 5% income on investments, 3% on property
    const incomeRate = a.asset_type === 'investment' ? 0.05 : 
                       a.asset_type === 'property' ? 0.03 : 0;
    return sum + (a.value_gbp * incomeRate);
  }, 0);

  const totalForeignTaxPaid = assets.reduce((sum, a) => sum + a.tax_paid_locally, 0);
  const totalUkIncome = 65000; // Assume some UK income

  // UK tax calculation (simplified)
  const totalIncome = totalForeignIncome + totalUkIncome;
  const personalAllowance = 12570;
  const taxableIncome = Math.max(0, totalIncome - personalAllowance);
  
  let ukTaxLiability = 0;
  if (taxableIncome <= 37700) {
    ukTaxLiability = taxableIncome * 0.20;
  } else if (taxableIncome <= 125140) {
    ukTaxLiability = 37700 * 0.20 + (taxableIncome - 37700) * 0.40;
  } else {
    ukTaxLiability = 37700 * 0.20 + 87440 * 0.40 + (taxableIncome - 125140) * 0.45;
  }

  // DTA relief (can claim foreign tax paid, up to UK liability on that income)
  const foreignIncomeUkTax = (totalForeignIncome / totalIncome) * ukTaxLiability;
  const dtaRelief = Math.min(totalForeignTaxPaid, foreignIncomeUkTax);

  const netTaxOwed = ukTaxLiability - dtaRelief;

  return {
    user_id: userId,
    tax_year: taxYear,
    total_foreign_income: Math.round(totalForeignIncome * 100) / 100,
    total_uk_income: totalUkIncome,
    total_foreign_tax_paid: Math.round(totalForeignTaxPaid * 100) / 100,
    uk_tax_liability: Math.round(ukTaxLiability * 100) / 100,
    dta_relief: Math.round(dtaRelief * 100) / 100,
    net_tax_owed: Math.round(netTaxOwed * 100) / 100,
    calculation_data: {
      personalAllowance,
      taxableIncome: Math.round(taxableIncome * 100) / 100,
      assetCount: assets.length,
      countriesInvolved: [...new Set(assets.map(a => a.country))],
    },
  };
}

/**
 * Demo login credentials summary
 */
export function getDemoCredentialsSummary(): string {
  return `
GACE Demo User Accounts
========================

${DEMO_USERS.map((user, idx) => `
${idx + 1}. ${user.fullName} (${user.scenario})
   Email: ${user.email}
   Password: ${user.password}
   Type: ${user.userType}
   Assets: ${user.assets.length} overseas assets
   Total Value: £${user.assets.reduce((sum, a) => sum + a.value_gbp, 0).toLocaleString()}
`).join('\n')}

All demo accounts use password: Demo123!
`;
}
