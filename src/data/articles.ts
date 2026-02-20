export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  image: string;
}

export const articles: Article[] = [
  {
    slug: 'first-time-homebuyer-guide',
    title: 'The First-Time Homebuyer Guide That Skips the Fluff',
    excerpt: 'Everything you actually need to know about buying your first home, from pre-approval to closing day.',
    category: 'Buying',
    readTime: '8 min',
    image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    slug: 'how-much-house-can-i-afford',
    title: 'How Much House Can You Actually Afford?',
    excerpt: 'Forget the rule of thumb. Here is how lenders really calculate what you can borrow.',
    category: 'Buying',
    readTime: '5 min',
    image: 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    slug: 'understanding-mortgage-rates',
    title: 'Mortgage Rates Explained Without the Jargon',
    excerpt: 'What moves rates, how they are set, and what you can do to get the best one.',
    category: 'Rates',
    readTime: '6 min',
    image: 'https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    slug: 'fixed-vs-adjustable',
    title: 'Fixed vs. Adjustable Rate: Which Is Right for You?',
    excerpt: 'A side-by-side comparison that helps you pick the structure that fits your timeline.',
    category: 'Rates',
    readTime: '5 min',
    image: 'https://images.pexels.com/photos/7821487/pexels-photo-7821487.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    slug: 'down-payment-strategies',
    title: 'Down Payment Strategies Beyond the 20% Myth',
    excerpt: 'Low- and no-down-payment options that might save you more than you think.',
    category: 'Buying',
    readTime: '6 min',
    image: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    slug: 'refinance-breakeven',
    title: 'When Does Refinancing Actually Make Sense?',
    excerpt: 'The break-even math that tells you if refinancing is worth the closing costs.',
    category: 'Refinancing',
    readTime: '5 min',
    image: 'https://images.pexels.com/photos/5849577/pexels-photo-5849577.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    slug: 'credit-score-mortgage',
    title: 'Your Credit Score and Your Mortgage: What Really Matters',
    excerpt: 'How your score affects your rate, and fast moves to improve it before you apply.',
    category: 'Credit',
    readTime: '7 min',
    image: 'https://images.pexels.com/photos/4386372/pexels-photo-4386372.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    slug: 'closing-costs-explained',
    title: 'Closing Costs Explained: Every Line Item Decoded',
    excerpt: 'A line-by-line walkthrough of what you will pay at the closing table and why.',
    category: 'Buying',
    readTime: '8 min',
    image: 'https://images.pexels.com/photos/7821486/pexels-photo-7821486.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    slug: 'home-equity-options',
    title: 'HELOC vs. Home Equity Loan vs. Cash-Out Refi',
    excerpt: 'Three ways to tap your equity, compared on cost, flexibility, and speed.',
    category: 'Equity',
    readTime: '6 min',
    image: 'https://images.pexels.com/photos/8293778/pexels-photo-8293778.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    slug: 'fha-va-conventional',
    title: 'FHA vs. VA vs. Conventional: Choosing Your Loan Type',
    excerpt: 'Each loan type has trade-offs. Here is how to pick the one that saves you the most.',
    category: 'Loan Types',
    readTime: '7 min',
    image: 'https://images.pexels.com/photos/8297031/pexels-photo-8297031.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    slug: 'mortgage-preapproval',
    title: 'Pre-Approval vs. Pre-Qualification: Why It Matters',
    excerpt: 'One gets you in the door. The other gets your offer accepted. Know the difference.',
    category: 'Buying',
    readTime: '4 min',
    image: 'https://images.pexels.com/photos/7821489/pexels-photo-7821489.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    slug: 'mortgage-process-timeline',
    title: 'The Mortgage Timeline: What Happens After You Apply',
    excerpt: 'A week-by-week breakdown from application to closing, so nothing catches you off guard.',
    category: 'Process',
    readTime: '6 min',
    image: 'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];
