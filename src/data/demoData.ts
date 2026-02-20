export const demoQuote = {
  paymentRange: { low: 2145, high: 2380 },
  rateRange: { low: 6.25, high: 6.875 },
  cashToClose: { low: 14200, high: 18500 },
  homePrice: 425000,
  downPayment: 85000,
  loanAmount: 340000,
  term: 30,
  propertyTax: 385,
  homeInsurance: 145,
  pmi: 0,
};

export const demoTasks = [
  { id: '1', title: 'Complete loan application', status: 'completed' as const, category: 'Application' },
  { id: '2', title: 'Upload proof of income (W-2s, pay stubs)', status: 'in_progress' as const, category: 'Documents' },
  { id: '3', title: 'Upload bank statements (last 2 months)', status: 'in_progress' as const, category: 'Documents' },
  { id: '4', title: 'Upload photo ID', status: 'pending' as const, category: 'Documents' },
  { id: '5', title: 'Sign initial disclosures', status: 'pending' as const, category: 'Disclosures' },
  { id: '6', title: 'Schedule home appraisal', status: 'pending' as const, category: 'Processing' },
  { id: '7', title: 'Review Loan Estimate', status: 'pending' as const, category: 'Disclosures' },
  { id: '8', title: 'Provide homeowner insurance binder', status: 'pending' as const, category: 'Processing' },
];

export const demoTimeline = [
  { label: 'Application', status: 'completed' as const, date: 'Feb 10' },
  { label: 'Disclosures', status: 'completed' as const, date: 'Feb 12' },
  { label: 'Processing', status: 'active' as const, date: 'Feb 14' },
  { label: 'Underwriting', status: 'upcoming' as const, date: 'Est. Feb 21' },
  { label: 'Clear to Close', status: 'upcoming' as const, date: 'Est. Feb 26' },
  { label: 'Closing', status: 'upcoming' as const, date: 'Est. Mar 3' },
];

export const demoMessages = [
  {
    id: '1',
    sender: 'Loan Officer',
    senderName: 'Alex Rivera',
    text: 'Welcome! I have received your application and everything looks great. I will need a few documents to move forward. You can upload them directly in the Documents tab.',
    timestamp: '2026-02-10T14:30:00',
    isOwn: false,
  },
  {
    id: '2',
    sender: 'You',
    senderName: 'You',
    text: 'Thanks Alex! I will get those uploaded today. Quick question - do you need my 2024 or 2025 W-2?',
    timestamp: '2026-02-10T15:12:00',
    isOwn: true,
  },
  {
    id: '3',
    sender: 'Loan Officer',
    senderName: 'Alex Rivera',
    text: 'Great question - I will need your most recent W-2 (2025). If you have both years handy, uploading both would actually speed things up since underwriting sometimes requests the prior year.',
    timestamp: '2026-02-10T15:45:00',
    isOwn: false,
  },
];

export const demoDocCategories = [
  { name: 'Income', items: ['W-2 (2025)', 'Pay Stubs (last 30 days)'] },
  { name: 'Assets', items: ['Bank Statements (last 2 months)', 'Investment Accounts'] },
  { name: 'Identity', items: ['Driver\'s License or Passport'] },
  { name: 'Property', items: ['Purchase Agreement', 'Homeowner Insurance'] },
  { name: 'Other', items: [] },
];
