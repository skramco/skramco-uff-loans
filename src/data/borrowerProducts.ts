export interface BorrowerProduct {
  name: string;
  description: string;
  highlights: string[];
}

export interface BorrowerSegment {
  slug: string;
  title: string;
  summary: string;
  products: BorrowerProduct[];
}

export const borrowerSegments: BorrowerSegment[] = [
  {
    slug: 'wage-earners',
    title: 'Wage Earners',
    summary: 'Predictable W-2 income can support payment-focused options for purchase, refi, and renovation goals.',
    products: [
      {
        name: 'Payment-Stability Refinance',
        description: 'Built to reduce monthly payment pressure while keeping long-term flexibility.',
        highlights: [
          'Rate-and-term reset options',
          'Optional temporary buydown structures',
          'Best for borrowers prioritizing monthly cash flow',
        ],
      },
      {
        name: 'Cash-Out for Home Improvements',
        description: 'Convert equity into renovation funds for kitchens, baths, additions, and repairs.',
        highlights: [
          'Single loan payment after closing',
          'Useful for value-add home upgrades',
          'Commonly used for larger renovation projects',
        ],
      },
      {
        name: 'Fast-Close Purchase Path',
        description: 'Documentation-forward workflow for buyers who want certainty and speed.',
        highlights: [
          'Clear upfront document checklist',
          'Structured closing timeline milestones',
          'Good fit for competitive offer situations',
        ],
      },
    ],
  },
  {
    slug: 'self-employed',
    title: 'Self-Employed',
    summary: 'Alternative documentation paths help business owners qualify beyond tax-return write-offs.',
    products: [
      {
        name: '12-24 Month Bank Statement Loan',
        description: 'Uses deposit history instead of traditional W-2 income verification.',
        highlights: [
          'Personal or business bank statement analysis',
          'Helpful for owners with variable write-offs',
          'Common fit for entrepreneurs and 1099 earners',
        ],
      },
      {
        name: '1099-Only Qualification',
        description: 'Designed for independent contractors with strong 1099 earnings.',
        highlights: [
          'No traditional W-2 requirement',
          'Streamlined income documentation',
          'Useful for consultants and gig-economy professionals',
        ],
      },
      {
        name: 'P&L Program (CPA Prepared)',
        description: 'Supports qualifying with business performance documentation.',
        highlights: [
          'Leverages business profit-and-loss statements',
          'Can pair with business bank statements',
          'Suitable for borrowers with seasonality in earnings',
        ],
      },
    ],
  },
  {
    slug: 'veterans',
    title: 'Veterans',
    summary: 'Military households often benefit from specialized purchase and refinance strategies.',
    products: [
      {
        name: 'Veteran Streamline Refinance',
        description: 'Simplified refinance path focused on reducing payment or improving rate structure.',
        highlights: [
          'Lower-friction documentation process',
          'Often faster than a full refinance underwrite',
          'Designed for existing veteran loan holders',
        ],
      },
      {
        name: 'Low-Cash-to-Close Purchase Strategy',
        description: 'Planning-focused approach to reduce upfront out-of-pocket costs.',
        highlights: [
          'Credit and closing-cost optimization review',
          'Seller-credit and fee strategy planning',
          'Ideal for preserving post-close reserves',
        ],
      },
      {
        name: 'Equity Access for Major Repairs',
        description: 'Refinance solutions for home upgrades, safety items, and deferred maintenance.',
        highlights: [
          'Can consolidate renovation financing',
          'Useful for accessibility or mobility updates',
          'Structured around long-term payment comfort',
        ],
      },
    ],
  },
  {
    slug: 'first-time-homebuyers',
    title: 'First Time Homebuyers',
    summary: 'Entry-focused options prioritize affordability, education, and upfront cost management.',
    products: [
      {
        name: '3% Down Affordability Program',
        description: 'Low down-payment path with underwriting designed around responsible access.',
        highlights: [
          'Lower upfront down-payment requirement',
          'Education-based readiness support',
          'Good fit for stable income and limited savings',
        ],
      },
      {
        name: 'Down Payment Assistance Pairing',
        description: 'Combines eligible assistance resources with a primary mortgage structure.',
        highlights: [
          'City, county, or state DPA review',
          'Grant/second-lien coordination support',
          'Aims to reduce cash needed at closing',
        ],
      },
      {
        name: 'Starter Home Payment Buydown',
        description: 'Temporary buydown options to ease early-year monthly payment pressure.',
        highlights: [
          'Improves first-year payment comfort',
          'Works well when sellers contribute credits',
          'Designed for buyers expecting future income growth',
        ],
      },
    ],
  },
  {
    slug: 'investors',
    title: 'Investors',
    summary: 'Cash-flow and portfolio-oriented lending options built around property performance.',
    products: [
      {
        name: 'DSCR Rental Loan',
        description: 'Qualifies primarily on rental income potential rather than personal tax returns.',
        highlights: [
          'Property cash-flow focused underwriting',
          'Commonly used for long-term rentals',
          'Supports scaled portfolio planning',
        ],
      },
      {
        name: 'Short-Term Rental DSCR',
        description: 'Investor financing aligned to short-term rental revenue models.',
        highlights: [
          'Underwriting supports STR strategy',
          'Works for vacation-market operators',
          'Useful for purchase and refinance scenarios',
        ],
      },
      {
        name: 'Portfolio Expansion Refinance',
        description: 'Capital strategy to unlock equity for the next acquisition.',
        highlights: [
          'Equity extraction for reinvestment',
          'Debt structure optimization across holdings',
          'Designed for repeat and growth-minded investors',
        ],
      },
    ],
  },
  {
    slug: 'high-net-worth',
    title: 'High Net Worth',
    summary: 'Alternative qualification methods for borrowers with significant assets and complex income profiles.',
    products: [
      {
        name: 'Asset Depletion Mortgage',
        description: 'Qualifies using liquid and eligible investment assets in place of traditional income.',
        highlights: [
          'Designed for asset-rich borrowers',
          'Can reduce reliance on tax-return income',
          'Strong fit for retirees and liquidity-focused clients',
        ],
      },
      {
        name: 'Jumbo Alternative Documentation',
        description: 'Large-loan options for clients with non-standard income documentation.',
        highlights: [
          'Supports complex compensation structures',
          'Tailored reserve and asset review',
          'Suitable for high-value primary or secondary homes',
        ],
      },
      {
        name: 'Liquidity-First Mortgage Structuring',
        description: 'Mortgage strategy aimed at preserving capital for investment opportunities.',
        highlights: [
          'Cash-management centric planning',
          'Balances borrowing cost with retained liquidity',
          'Useful for borrowers with active investment portfolios',
        ],
      },
    ],
  },
];
