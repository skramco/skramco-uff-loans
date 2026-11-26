/** Authoritative state licensing list — count and entries must match NMLS Consumer Access. */
export type StateLicense = {
  state: string;
  license: string;
  tradeName?: string;
};

export const stateLicenses: StateLicense[] = [
  { state: 'Alabama', license: 'Consumer Credit License #23184', tradeName: 'UFF Express' },
  { state: 'Arizona', license: 'Mortgage Banker License #BK-2015110', tradeName: 'UFF Express' },
  { state: 'Arkansas', license: 'Combination Mortgage Banker-Broker-Servicer License #43004', tradeName: 'UFF Express' },
  { state: 'California', license: 'DFPI Financing Law License #603J733', tradeName: 'UFF CORP.' },
  { state: 'Colorado', license: 'Mortgage Company Registration', tradeName: 'UFF Express' },
  { state: 'Connecticut', license: 'Mortgage Lender License #ML-34381' },
  { state: 'Florida', license: 'Mortgage Lender License #MLD506', tradeName: 'UFF Express; UFFC Mortgage' },
  { state: 'Georgia', license: 'Mortgage Lender License #66436', tradeName: 'UFF Express' },
  { state: 'Idaho', license: 'Mortgage Broker/Lender License #MBL-2080034381', tradeName: 'UFF; UFF Express; UFF West; UFFC Mortgage' },
  { state: 'Illinois', license: 'Residential Mortgage License #MB.6760568', tradeName: 'UFF Express' },
  { state: 'Indiana', license: 'Mortgage Lending License (DFI) #11139', tradeName: 'UFF Express' },
  { state: 'Iowa', license: 'Mortgage Banker License #2008-0093' },
  { state: 'Kansas', license: 'Mortgage Company License #MC.0025426', tradeName: 'UFF Express; UFFC Mortgage; United Fidelity Funding' },
  { state: 'Kentucky', license: 'Mortgage Company License #MC23287' },
  { state: 'Maine', license: 'Supervised Lender License #34381' },
  { state: 'Maryland', license: 'Mortgage Lender License #34381' },
  { state: 'Massachusetts', license: 'Mortgage Lender License #ML34381', tradeName: 'UFF Express' },
  { state: 'Michigan', license: '1st Mortgage Broker/Lender/Servicer Registrant #FR0020432' },
  { state: 'Minnesota', license: 'Residential Mortgage Originator License #MN-MO-40134678' },
  { state: 'Mississippi', license: 'Mortgage Lender License #34381' },
  { state: 'Missouri', license: 'Mortgage Company License #34381', tradeName: 'UFF Express; United Fidelity Funding' },
  { state: 'Montana', license: 'Mortgage Lender License #34381' },
  { state: 'Nebraska', license: 'Mortgage Banker License #2004', tradeName: 'UFF Express' },
  { state: 'Nevada', license: 'Mortgage Company License #4944' },
  { state: 'New Hampshire', license: 'Mortgage Banker License #34381MB' },
  { state: 'New Jersey', license: 'Residential Mortgage Lender License' },
  { state: 'New Mexico', license: 'Mortgage Loan Company License' },
  { state: 'North Carolina', license: 'Mortgage Lender License #L-186719', tradeName: 'UFF Express' },
  { state: 'North Dakota', license: 'Residential Mortgage Lender #ML104863' },
  { state: 'Ohio', license: 'Residential Mortgage Lending Act Certificate #RM.850040.000' },
  { state: 'Oklahoma', license: 'Mortgage Lender License #ML011045', tradeName: 'UFFC Mortgage' },
  { state: 'Oregon', license: 'Mortgage Lending License #34381', tradeName: 'UFF Express' },
  { state: 'Pennsylvania', license: 'Mortgage Lender License #99512', tradeName: 'UFF Express' },
  { state: 'South Carolina', license: 'Mortgage Lender/Servicer License (BFI) #MLS-34381' },
  { state: 'South Dakota', license: 'Mortgage Lender License #34381.ML' },
  { state: 'Tennessee', license: 'Mortgage License #34381', tradeName: 'UFF Express' },
  { state: 'Texas', license: 'Mortgage Banker Registration (SML)', tradeName: 'VFF United Fidelity Funding Corp.' },
  { state: 'Virginia', license: 'Lender License #MC-7052', tradeName: 'UFF Express' },
  { state: 'Washington', license: 'Consumer Loan Company License #CL-34381', tradeName: 'UFF West Funding Corp.' },
  { state: 'Wisconsin', license: 'Mortgage Banker License #34381BA', tradeName: 'UFF Express' },
];

export const licensedStateCount = stateLicenses.length;

/** Two-letter abbreviations for compact compliance footers (sorted). */
export const licensedStateAbbreviations = [
  'AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'ME', 'MD', 'MA', 'MI',
  'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'SC', 'SD', 'TN',
  'TX', 'VA', 'WA', 'WI',
] as const;

export const licensedStateNames = stateLicenses.map((s) => s.state);