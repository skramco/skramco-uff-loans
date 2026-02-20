export interface ArticleSection {
  heading?: string;
  content: string;
  type?: 'text' | 'callout' | 'tip' | 'warning' | 'comparison' | 'checklist';
  items?: string[];
}

export interface ArticleContent {
  slug: string;
  sections: ArticleSection[];
  keyTakeaways: string[];
  relatedSlugs: string[];
}

export const articleContents: Record<string, ArticleContent> = {
  'first-time-homebuyer-guide': {
    slug: 'first-time-homebuyer-guide',
    keyTakeaways: [
      'Get pre-approved before you start shopping so sellers take your offers seriously.',
      'Budget for more than just the mortgage -- taxes, insurance, maintenance, and closing costs add up.',
      'Your credit score directly impacts your interest rate, which affects your monthly payment for decades.',
      'The cheapest house is not always the best deal. Location, condition, and resale value matter.',
      'Lean on your loan officer -- that is literally what they are there for.',
    ],
    relatedSlugs: ['how-much-house-can-i-afford', 'mortgage-preapproval', 'closing-costs-explained'],
    sections: [
      {
        content: 'Buying your first home is one of the biggest financial decisions you will ever make. It is also one of the most rewarding. But between the jargon, the paperwork, and the sheer number of decisions, it can feel overwhelming. This guide walks you through the entire process -- step by step, in plain English -- so you know exactly what to expect and how to prepare.',
      },
      {
        heading: 'Step 1: Figure Out What You Can Actually Afford',
        content: 'Before you fall in love with a listing, you need a realistic picture of your budget. Lenders look at your debt-to-income ratio (DTI), which compares your monthly debt payments to your gross monthly income. Most lenders want your total DTI -- including the new mortgage -- to stay below 43%, though some programs allow higher.\n\nHere is a quick way to estimate: take your gross monthly income and multiply by 0.28. That gives you a rough ceiling for your housing payment (principal, interest, taxes, and insurance). If you earn $6,000/month before taxes, your comfortable housing payment is around $1,680.\n\nDo not forget the costs that come on top of the mortgage: property taxes (typically 1-2% of home value per year), homeowner\'s insurance, potential HOA fees, and maintenance (budget about 1% of the home value per year). A $400,000 house does not cost $400,000 -- it costs significantly more over time.',
      },
      {
        heading: 'Step 2: Check and Strengthen Your Credit',
        content: 'Your credit score is the single biggest factor in the interest rate you will be offered. A higher score means a lower rate, which means lower monthly payments and tens of thousands saved over the life of the loan.\n\nPull your free credit reports from annualcreditreport.com and review them for errors. Dispute anything inaccurate. Then focus on these high-impact moves:\n\nPay down credit card balances to below 30% of your limits (below 10% is even better). Do not open new credit accounts in the months before you apply. Do not close old accounts -- length of credit history matters. Make every payment on time, no exceptions.\n\nYou do not need perfect credit to buy a home. FHA loans accept scores as low as 580 with 3.5% down, and VA loans have no minimum score requirement from the VA itself (though most lenders want 620+). But every point improvement in your score can save you money.',
      },
      {
        type: 'tip',
        content: 'Start working on your credit at least 3-6 months before you plan to apply for a mortgage. Even small improvements in your score can result in meaningfully better rates.',
      },
      {
        heading: 'Step 3: Get Pre-Approved (Not Just Pre-Qualified)',
        content: 'Pre-qualification is a rough estimate based on what you tell a lender about your finances. Pre-approval is a verified commitment -- the lender pulls your credit, reviews your income and assets, and gives you a letter stating how much they are willing to lend.\n\nIn competitive markets, sellers often will not even look at offers without a pre-approval letter. It shows you are serious and financially capable.\n\nThe pre-approval process involves providing W-2s, pay stubs, tax returns, bank statements, and identification. The lender will pull your credit (this counts as a hard inquiry, but multiple mortgage inquiries within a 14-45 day window count as a single inquiry for scoring purposes).\n\nA pre-approval letter is typically valid for 60-90 days. If your home search takes longer, your lender can usually refresh it.',
      },
      {
        heading: 'Step 4: Find the Right Home',
        content: 'Now comes the fun part. Work with a buyer\'s agent (their commission is typically paid by the seller) to identify properties in your price range. Look beyond the surface:\n\nLocation drives long-term value more than any renovation. Check commute times, school ratings, crime stats, and future development plans. The house itself should have sound structure -- roof condition, foundation, HVAC age, plumbing, and electrical. Cosmetic updates are easy; structural problems are not.\n\nVisit properties at different times of day. A quiet street at 10am might be a highway on-ramp at 5pm. Talk to neighbors if you can. Check flood zone maps.\n\nWhen you find the right home, your agent will help you craft an offer based on comparable sales (comps), market conditions, and the seller\'s situation.',
      },
      {
        heading: 'Step 5: Make an Offer and Negotiate',
        content: 'Your offer includes the price, your pre-approval letter, earnest money deposit (typically 1-3% of the purchase price held in escrow to show good faith), contingencies (inspection, appraisal, financing), and a proposed closing date.\n\nIn a buyer\'s market, you may have room to negotiate below asking price, request repairs, or ask for seller concessions toward closing costs. In a seller\'s market, you may need to offer at or above asking, limit contingencies, or offer a larger earnest money deposit.\n\nOnce the seller accepts your offer (or you agree on a counter-offer), you are "under contract" and the real work begins.',
      },
      {
        heading: 'Step 6: Home Inspection and Appraisal',
        content: 'A home inspection (which you pay for, typically $300-$500) is your chance to uncover hidden problems before you commit. The inspector will evaluate the roof, foundation, electrical, plumbing, HVAC, and more. If major issues are found, you can negotiate repairs, a price reduction, or walk away.\n\nThe appraisal is ordered by your lender to confirm the home is worth what you are paying. If the appraisal comes in below your offer price, you have options: negotiate the price down, make up the difference in cash, or contest the appraisal with additional comparable sales data.',
      },
      {
        heading: 'Step 7: Final Underwriting and Clear to Close',
        content: 'While you have been house hunting, your lender\'s underwriting team has been verifying every detail of your application. They may ask for additional documentation -- a letter explaining a large deposit, updated bank statements, or employment verification.\n\nDo not make any major financial moves during this period. Do not change jobs, open new credit accounts, make large purchases, or move money between accounts without telling your lender. Any of these can delay or derail your closing.\n\nOnce underwriting is satisfied, you will receive a "clear to close" -- the official green light.',
      },
      {
        heading: 'Step 8: Closing Day',
        content: 'Three business days before closing, you will receive your Closing Disclosure -- a five-page document detailing every cost and term of your loan. Compare it carefully to your Loan Estimate from earlier. If anything looks wrong, ask immediately.\n\nAt closing, you will sign a substantial stack of documents, provide your cashier\'s check or wire transfer for the down payment and closing costs, and receive the keys. The entire signing typically takes 60-90 minutes.\n\nCongratulations -- you are a homeowner.',
      },
      {
        type: 'checklist',
        heading: 'First-Time Buyer Checklist',
        content: 'Keep this handy as you move through the process:',
        items: [
          'Check credit reports and scores',
          'Calculate your comfortable budget',
          'Save for down payment and closing costs',
          'Gather financial documents (W-2s, pay stubs, tax returns, bank statements)',
          'Get pre-approved with a lender',
          'Find a buyer\'s agent',
          'Tour homes and make an offer',
          'Complete home inspection',
          'Finalize your mortgage',
          'Review Closing Disclosure',
          'Close and get your keys',
        ],
      },
    ],
  },

  'how-much-house-can-i-afford': {
    slug: 'how-much-house-can-i-afford',
    keyTakeaways: [
      'Lenders use your debt-to-income ratio (DTI), not a simple income multiplier.',
      'The 28/36 rule is a good starting point: 28% of gross income for housing, 36% for all debts.',
      'What a lender will approve and what you should spend are two different numbers.',
      'Factor in property taxes, insurance, HOA, and maintenance -- not just the mortgage payment.',
      'Use your actual budget, not rules of thumb, for the most realistic picture.',
    ],
    relatedSlugs: ['first-time-homebuyer-guide', 'down-payment-strategies', 'closing-costs-explained'],
    sections: [
      {
        content: 'The question "how much house can I afford?" has two answers. The first is how much a lender will let you borrow. The second -- and more important -- is how much you should actually spend. These are often very different numbers. This guide explains both.',
      },
      {
        heading: 'How Lenders Calculate Your Buying Power',
        content: 'When you apply for a mortgage, lenders evaluate your application using the debt-to-income ratio (DTI). This compares your monthly debt obligations to your gross (pre-tax) monthly income.\n\nThere are two types of DTI. The front-end ratio looks at just your housing costs -- mortgage payment, property taxes, homeowner\'s insurance, and HOA fees -- as a percentage of your gross monthly income. Most conventional lenders want this at or below 28%.\n\nThe back-end ratio includes all your debts: housing costs plus car payments, student loans, minimum credit card payments, personal loans, and any other recurring obligations. Most lenders cap this at 43%, though some programs allow up to 50% with strong compensating factors like a high credit score or large savings.',
      },
      {
        heading: 'The 28/36 Rule in Practice',
        content: 'Let us walk through a real example. Say you earn $90,000 per year ($7,500/month gross).\n\nFront-end limit (28%): $7,500 x 0.28 = $2,100 for total housing costs.\n\nBack-end limit (36%): $7,500 x 0.36 = $2,700 for all debts combined.\n\nIf you have a $400/month car payment and $300/month in student loans, that leaves $2,700 - $700 = $2,000 available for housing under the back-end rule.\n\nSo your housing budget is capped at $2,000/month (the lower of the two calculations). After subtracting estimated taxes ($350), insurance ($100), and potential PMI ($100), you have about $1,450 for principal and interest. At a 6.5% rate over 30 years, that supports roughly a $230,000 loan -- or a $287,500 home with a 20% down payment.',
      },
      {
        type: 'callout',
        content: 'Just because a lender will approve you for a certain amount does not mean you should borrow that much. A lender does not account for your retirement savings goals, childcare costs, travel plans, or the fact that you like eating at restaurants. Build your budget based on your actual life, not a formula.',
      },
      {
        heading: 'The Hidden Costs of Homeownership',
        content: 'Your mortgage payment is just the beginning. Budget for these additional costs:\n\nProperty taxes vary wildly by location -- from 0.3% of home value in Hawaii to over 2.2% in New Jersey. Check your target area specifically.\n\nHomeowner\'s insurance typically runs $1,000-$3,000 per year depending on location, coverage, and the home itself.\n\nPMI (private mortgage insurance) applies if you put less than 20% down on a conventional loan. It typically costs 0.5-1% of the loan amount per year and goes away once you reach 20% equity.\n\nMaintenance and repairs average 1-2% of the home\'s value per year. That is $4,000-$8,000 annually on a $400,000 home. Roofs, HVAC systems, water heaters, and appliances do not last forever.\n\nHOA fees can range from $100 to $1,000+ per month depending on the community and amenities.',
      },
      {
        heading: 'Income Types and How Lenders View Them',
        content: 'Not all income is treated equally by mortgage lenders.\n\nSalaried/W-2 income is the most straightforward. Lenders typically use your current base salary and verify it with pay stubs and a verification of employment.\n\nBonuses and overtime must usually have a 2-year history to count, and lenders will average them.\n\nSelf-employment income requires 2 years of tax returns. Lenders use your net income (after business deductions), which is often much lower than your gross revenue.\n\nRental income is typically counted at 75% of the gross rent to account for vacancies and expenses.\n\nAlimony, child support, and Social Security income can all count if documented and likely to continue for at least 3 years.',
      },
      {
        heading: 'A Better Way to Calculate Your Budget',
        content: 'Instead of working from formulas, try this approach:\n\n1. Track your actual monthly spending for 2-3 months. Include everything.\n2. Identify what you are currently paying in rent.\n3. Determine how much more (or less) you are comfortable paying per month for housing.\n4. Factor in additional homeownership costs (taxes, insurance, maintenance, utilities if they will increase).\n5. The difference between your comfortable total housing budget and those additional costs is what you can put toward principal and interest.\n6. Use a mortgage calculator to translate that monthly payment into a loan amount at current rates.\n7. Add your down payment to get your maximum purchase price.\n\nThis bottom-up approach gives you a budget that fits your actual life, not a theoretical one.',
      },
      {
        heading: 'Down Payment and Its Impact',
        content: 'Your down payment directly affects how much house you can afford in two ways. First, it reduces the loan amount, which reduces your monthly payment. Second, a larger down payment can eliminate PMI and may qualify you for a better interest rate.\n\nHere is how different down payments affect the math on a $400,000 home at 6.5%:\n\n3% down ($12,000): $388,000 loan = $2,452/month P&I + ~$160 PMI\n10% down ($40,000): $360,000 loan = $2,275/month P&I + ~$150 PMI\n20% down ($80,000): $320,000 loan = $2,023/month P&I, no PMI\n\nThe 20% down payment saves about $590/month compared to 3% down. Over 30 years, that is over $210,000 in total payments.',
      },
    ],
  },

  'understanding-mortgage-rates': {
    slug: 'understanding-mortgage-rates',
    keyTakeaways: [
      'Mortgage rates are influenced by the Federal Reserve, bond markets, inflation, and economic conditions.',
      'Your individual rate depends on credit score, down payment, loan type, and property type.',
      'Locking your rate protects you from market fluctuations during the loan process.',
      'A 0.25% difference in rate can mean tens of thousands of dollars over the life of the loan.',
      'Shopping multiple lenders can save you thousands -- even small rate differences compound.',
    ],
    relatedSlugs: ['fixed-vs-adjustable', 'credit-score-mortgage', 'refinance-breakeven'],
    sections: [
      {
        content: 'Mortgage rates affect every homebuyer and homeowner, yet most people have only a vague understanding of how they work. This guide breaks down what drives rates, what determines your personal rate, and how to get the best one possible.',
      },
      {
        heading: 'What Determines Mortgage Rates?',
        content: 'Mortgage rates are not set by a single entity. They are the result of a complex interplay between global economics, government policy, and the bond market.\n\nThe Federal Reserve sets the federal funds rate, which influences short-term borrowing costs throughout the economy. While the Fed does not directly set mortgage rates, its actions heavily influence them. When the Fed raises rates to combat inflation, mortgage rates tend to rise too.\n\nThe 10-year Treasury yield is the most closely correlated benchmark for 30-year mortgage rates. Investors who buy mortgage-backed securities (MBS) compare their returns to Treasury bonds. When Treasury yields rise, mortgage rates typically follow.\n\nInflation expectations play a major role. Lenders need their returns to outpace inflation. When inflation is high or expected to rise, rates go up to compensate.\n\nThe overall economy matters too. In recessions, investors flock to the safety of bonds, driving yields (and mortgage rates) down. In strong economies, rates tend to be higher.',
      },
      {
        heading: 'What Determines YOUR Rate?',
        content: 'The rates you see advertised are not the rates everyone gets. Your personal rate depends on several factors:\n\nCredit score is the biggest individual factor. A borrower with a 760+ score might get a rate 0.5-0.75% lower than someone with a 660 score. On a $350,000 loan, that difference can mean $100-$150 per month.\n\nLoan-to-value ratio (LTV) is how much you are borrowing relative to the home\'s value. Lower LTV (bigger down payment) typically means a lower rate because the lender has less risk.\n\nLoan type matters. Conventional loans may have different rates than FHA, VA, or jumbo loans. Government-backed loans sometimes offer lower rates but come with additional costs like mortgage insurance.\n\nProperty type affects your rate. Single-family homes get the best rates. Condos, multi-unit properties, and investment properties carry slightly higher rates.\n\nLoan term also matters. 15-year mortgages typically have rates 0.5-0.75% lower than 30-year mortgages because the lender\'s money is at risk for a shorter period.',
      },
      {
        type: 'callout',
        content: 'A 0.25% difference in interest rate on a $350,000 loan over 30 years equals approximately $18,500 in total interest. It is worth shopping around and optimizing your credit score before applying.',
      },
      {
        heading: 'Rate vs. APR: Know the Difference',
        content: 'The interest rate is the cost of borrowing the principal. The APR (Annual Percentage Rate) includes the interest rate plus other loan costs like origination fees, discount points, and certain closing costs, expressed as a yearly rate.\n\nThe APR gives you a more complete picture of the total cost of the loan. Two lenders might offer the same interest rate but different APRs because one charges higher fees. Always compare APRs alongside interest rates when shopping.\n\nHowever, APR assumes you will keep the loan for the full term. If you plan to sell or refinance within a few years, a loan with a lower rate and higher fees (higher APR) might actually cost more than one with a slightly higher rate and lower fees.',
      },
      {
        heading: 'Points and Buydowns',
        content: 'Discount points let you pay upfront to reduce your interest rate. One point equals 1% of the loan amount and typically reduces the rate by 0.25%.\n\nOn a $350,000 loan, one point costs $3,500 and might reduce your rate from 6.5% to 6.25%. That saves about $62/month, meaning you break even in about 56 months (just under 5 years).\n\nBuying points makes sense if you plan to stay in the home longer than the break-even period. If you might sell or refinance sooner, the upfront cost is not worth it.\n\nSome sellers offer temporary buydowns (like a 2-1 buydown) as a concession. This reduces your rate for the first 1-2 years but reverts to the full rate afterward. It can be useful if you expect your income to increase, but make sure you can afford the full payment when it kicks in.',
      },
      {
        heading: 'Rate Locks: Protecting Yourself',
        content: 'A rate lock guarantees your interest rate for a specific period (usually 30-60 days) while your loan is processed. Without a lock, your rate could change between application and closing.\n\nMost lenders offer free rate locks for 30-45 days. Longer locks (60-90 days) may cost slightly more. If rates drop significantly after you lock, some lenders offer a one-time "float down" option.\n\nWhen to lock: If you are comfortable with the current rate and your closing timeline fits within the lock period, locking is generally smart. Trying to time rate movements is guesswork -- even economists get it wrong regularly.',
      },
      {
        heading: 'How to Get the Best Rate',
        content: 'Improve your credit score before applying. Even moving from 720 to 740 can make a difference. Pay down credit card balances, correct errors on your credit report, and avoid new credit inquiries.\n\nSave a larger down payment. Getting to 20% down eliminates PMI and often qualifies you for a better rate.\n\nShop at least 3 lenders. Rates can vary significantly between lenders, even on the same day. Get quotes from a mix of banks, credit unions, and mortgage companies.\n\nConsider the total cost, not just the rate. A lender offering a slightly higher rate but lower fees might be cheaper overall, depending on how long you keep the loan.\n\nAsk about relationship discounts. Some banks offer rate reductions if you have existing accounts or meet certain criteria.',
      },
    ],
  },

  'fixed-vs-adjustable': {
    slug: 'fixed-vs-adjustable',
    keyTakeaways: [
      'Fixed-rate mortgages offer payment predictability for the entire loan term.',
      'ARMs start with lower rates but can adjust upward after the initial period.',
      'If you plan to move or refinance within 5-7 years, an ARM might save you money.',
      'If you plan to stay long-term, a fixed rate provides certainty.',
      'Understand ARM caps -- they limit how much your rate can change per adjustment and over the loan\'s life.',
    ],
    relatedSlugs: ['understanding-mortgage-rates', 'refinance-breakeven', 'fha-va-conventional'],
    sections: [
      {
        content: 'Choosing between a fixed-rate and adjustable-rate mortgage is one of the most consequential decisions in the home buying process. Neither is universally better -- the right choice depends on your timeline, risk tolerance, and financial situation. This guide gives you the tools to decide.',
      },
      {
        heading: 'Fixed-Rate Mortgages: The Predictable Choice',
        content: 'With a fixed-rate mortgage, your interest rate stays the same for the entire loan term -- typically 15 or 30 years. Your principal and interest payment never changes.\n\nThis predictability is the primary advantage. You know exactly what you will pay every month for the next 15 or 30 years (property taxes and insurance can still change, but the loan payment itself is locked). This makes budgeting straightforward and eliminates the risk of rising rates.\n\n30-year fixed is the most popular mortgage in America for good reason. It provides the lowest monthly payment of any fixed-rate option, giving you flexibility in your monthly budget. The downside is you pay more interest over the life of the loan.\n\n15-year fixed offers a lower interest rate (typically 0.5-0.75% less) and dramatically reduces total interest paid. But the monthly payment is significantly higher. On a $350,000 loan at 6.5% (30-year) vs. 5.875% (15-year), the monthly P&I is $2,212 vs. $2,932 -- $720 more per month, but you save roughly $217,000 in total interest.',
      },
      {
        heading: 'Adjustable-Rate Mortgages (ARMs): The Calculated Bet',
        content: 'An ARM offers a lower initial rate for a fixed period (usually 5, 7, or 10 years), then adjusts periodically based on a market index.\n\nA "5/6 ARM" means the rate is fixed for 5 years, then adjusts every 6 months. A "7/1 ARM" is fixed for 7 years, adjusting annually. The initial rate is typically 0.5-1% lower than a comparable 30-year fixed rate.\n\nAfter the initial period, your rate adjusts based on an index (commonly SOFR -- the Secured Overnight Financing Rate) plus a margin (the lender\'s markup, usually 2-3%). If SOFR is 4.5% and your margin is 2.5%, your rate would adjust to 7.0%.\n\nARM caps protect you from extreme adjustments. A typical cap structure of 2/1/5 means: the rate can increase no more than 2% at the first adjustment, no more than 1% at subsequent adjustments, and no more than 5% over the life of the loan. So if your initial rate is 5.5%, it can never exceed 10.5%.',
      },
      {
        type: 'comparison',
        heading: 'Side-by-Side: $350,000 Loan',
        content: 'Comparing a 30-year fixed at 6.5% vs. a 7/1 ARM starting at 5.75%:\n\nMonthly P&I (Year 1-7): Fixed = $2,212 | ARM = $2,042 | ARM saves $170/month\nTotal paid in first 7 years: Fixed = $185,808 | ARM = $171,528 | ARM saves $14,280\n\nIf you sell or refinance within 7 years, the ARM clearly wins. But if you keep the ARM past year 7 and rates have risen, your payment could jump significantly. At the 2% initial cap, your rate could go to 7.75% in year 8, pushing your payment to $2,480 -- $268 more than the fixed option.\n\nThe key question: will you be in this home, with this mortgage, past the initial fixed period?',
      },
      {
        heading: 'When a Fixed Rate Makes More Sense',
        content: 'Choose fixed if you are buying your "forever home" or plan to stay at least 10+ years. Choose fixed if you value payment predictability and do not want to worry about rate movements. Choose fixed if current rates are historically reasonable and you want to lock them in. Choose fixed if your budget is tight and you cannot absorb potential payment increases.',
      },
      {
        heading: 'When an ARM Makes More Sense',
        content: 'Choose an ARM if you are confident you will sell or refinance before the fixed period ends (job relocation, growing family, etc.). Choose an ARM if you want to maximize purchasing power -- the lower initial rate qualifies you for a slightly larger loan. Choose an ARM if you have strong cash reserves and can handle potential payment increases. Choose an ARM if current fixed rates are unusually high and you expect them to decline.',
      },
      {
        type: 'warning',
        content: 'Never choose an ARM solely because you cannot afford the fixed-rate payment on the home you want. If you can only afford the home with an ARM\'s lower initial payment, you are taking on significant risk. Buy a less expensive home with a fixed rate instead.',
      },
    ],
  },

  'down-payment-strategies': {
    slug: 'down-payment-strategies',
    keyTakeaways: [
      '20% down is not required -- many programs accept 3-5% or even 0%.',
      'PMI is not permanent. It goes away once you reach 20% equity.',
      'Down payment assistance programs exist in every state -- check your eligibility.',
      'Gift funds from family are allowed for most loan types with proper documentation.',
      'The "right" down payment depends on your cash reserves, loan type, and monthly budget comfort.',
    ],
    relatedSlugs: ['first-time-homebuyer-guide', 'how-much-house-can-i-afford', 'fha-va-conventional'],
    sections: [
      {
        content: 'The idea that you need 20% down to buy a home is one of the most persistent myths in real estate. While putting 20% down has advantages, there are legitimate, well-established programs that require far less. This guide breaks down your real options.',
      },
      {
        heading: 'The 20% Myth: Where It Came From',
        content: 'The 20% figure became a benchmark because it is the threshold for avoiding private mortgage insurance (PMI) on conventional loans. Before the housing programs of the last several decades expanded, large down payments were standard.\n\nToday, the average first-time homebuyer puts down about 6-7%. Many put down 3% or less. The key is understanding the trade-offs, not chasing an arbitrary number.',
      },
      {
        heading: 'Low and No Down Payment Options',
        content: 'Conventional loans with 3% down are available through programs like Fannie Mae HomeReady and Freddie Mac Home Possible for borrowers earning at or below 80% of area median income. Standard conventional loans allow 5% down for most borrowers.\n\nFHA loans require just 3.5% down with a credit score of 580 or higher. FHA loans also have more flexible qualifying criteria, making them popular with first-time buyers. The trade-off is mandatory mortgage insurance for the life of the loan (unless you refinance to a conventional loan later).\n\nVA loans offer 0% down for eligible veterans, active-duty service members, and surviving spouses. VA loans have no monthly mortgage insurance, though there is an upfront funding fee (which can be rolled into the loan). This is often the best deal in mortgage lending.\n\nUSDA loans also offer 0% down for homes in designated rural and suburban areas. Income limits apply, but the geographic eligibility is broader than most people expect.',
      },
      {
        type: 'callout',
        content: 'PMI on a conventional loan typically costs $50-$200 per month per $100,000 borrowed. On a $300,000 loan with 5% down, expect to pay around $130-$175/month. But PMI is temporary -- it cancels automatically when your loan balance reaches 78% of the original home value, or you can request cancellation at 80%.',
      },
      {
        heading: 'Down Payment Assistance Programs',
        content: 'Every state has down payment assistance (DPA) programs, and many cities and counties offer additional help. These programs come in several forms:\n\nGrants are free money that does not need to be repaid. They are typically targeted at first-time buyers, low-to-moderate income households, or specific professions (teachers, first responders, healthcare workers).\n\nForgivable loans are second mortgages that are forgiven after you live in the home for a specified period (usually 5-10 years). If you sell before then, you repay the assistance.\n\nDeferred-payment loans require no monthly payments. They are repaid when you sell, refinance, or pay off the first mortgage.\n\nMatched savings programs (IDAs) match your savings deposits dollar-for-dollar or more, helping you build a down payment faster.\n\nYour loan officer can help you identify which programs you qualify for in your area.',
      },
      {
        heading: 'Using Gift Funds',
        content: 'Most loan types allow gift funds for the down payment, but the rules vary:\n\nConventional loans allow gifts from family members. If you are putting less than 20% down, some of the funds may need to come from your own savings (requirements vary by program).\n\nFHA loans allow 100% of the down payment to come from gifts. Gift donors can include family, employers, charitable organizations, or government agencies.\n\nVA loans allow gifts from essentially anyone.\n\nFor all loan types, you will need a gift letter stating the amount, the donor\'s relationship to you, and a statement that no repayment is expected. The lender may also need to see the donor\'s bank statements showing the source of funds.',
      },
      {
        heading: 'The Math: Bigger Down Payment vs. Keeping Cash',
        content: 'Putting more money down reduces your monthly payment and total interest. But draining your savings to maximize your down payment can leave you vulnerable.\n\nConsider this scenario on a $400,000 home:\n\n5% down ($20,000): Monthly P&I + PMI = $2,552. Cash remaining after closing: $30,000.\n\n20% down ($80,000): Monthly P&I = $2,023. Cash remaining after closing: $0.\n\nThe 20% option saves $529/month. But what happens when the water heater dies two months after closing? Or your car needs a major repair? Having $0 in reserves is dangerous.\n\nA better approach: put enough down to get a comfortable monthly payment, keep 3-6 months of expenses in reserve, and let equity build naturally. You can always make extra payments later or refinance to remove PMI.',
      },
    ],
  },

  'refinance-breakeven': {
    slug: 'refinance-breakeven',
    keyTakeaways: [
      'The break-even point is how long it takes for monthly savings to exceed closing costs.',
      'If you plan to stay beyond the break-even point, refinancing likely makes sense.',
      'Closing costs on a refinance typically run 2-3% of the loan amount.',
      'Rate-and-term refinancing is different from cash-out refinancing -- understand which fits your goal.',
      'Resetting to a new 30-year term means paying more total interest even at a lower rate.',
    ],
    relatedSlugs: ['understanding-mortgage-rates', 'home-equity-options', 'closing-costs-explained'],
    sections: [
      {
        content: 'Refinancing can save you a significant amount of money -- or it can cost you if the math does not work. The key is the break-even calculation: how long until the savings from your new, lower payment exceed the cost of refinancing. This guide shows you exactly how to run the numbers.',
      },
      {
        heading: 'The Break-Even Calculation',
        content: 'Refinancing is not free. You will pay closing costs similar to your original mortgage -- typically 2-3% of the new loan amount. The question is whether the monthly savings justify that upfront cost.\n\nHere is the basic formula:\n\nBreak-even months = Total closing costs / Monthly payment savings\n\nExample: Your current mortgage is $300,000 at 7.25% = $2,047/month P&I. A refinance to 6.25% would give you $1,847/month. That is $200/month in savings.\n\nIf closing costs are $6,000: $6,000 / $200 = 30 months to break even.\n\nIf you plan to stay in the home at least 30 more months, the refinance pays off. Every month after that is pure savings.',
      },
      {
        type: 'tip',
        content: 'A common guideline is that refinancing makes sense if you can lower your rate by at least 0.5-0.75%. But always run the actual break-even calculation -- a large loan with a small rate reduction might break even faster than a small loan with a large rate reduction.',
      },
      {
        heading: 'The Hidden Factor: Loan Term Reset',
        content: 'Most people refinance into a new 30-year mortgage. If you have already paid 5 years on your current 30-year loan, refinancing restarts the clock -- you will now pay for 35 total years instead of 30.\n\nThis matters because in the early years of a mortgage, most of your payment goes to interest. By restarting, you extend the period of heavy interest payments.\n\nHow to avoid this: Refinance into a shorter term (25-year or 20-year) that approximately matches your remaining term. Or refinance into a 30-year but make extra payments to keep your payoff date the same. Many lenders can run both scenarios for you.',
      },
      {
        heading: 'Rate-and-Term vs. Cash-Out Refinance',
        content: 'A rate-and-term refinance replaces your existing loan with a new one at better terms. The loan amount stays roughly the same (minus any principal you have paid). This is the straightforward option when rates have dropped.\n\nA cash-out refinance lets you borrow more than you currently owe and take the difference in cash. For example, if your home is worth $500,000 and you owe $300,000, you might refinance for $375,000 and receive $75,000 in cash.\n\nCash-out refinances typically have slightly higher rates (0.125-0.25%) and require more equity (usually at least 20% remaining after the cash-out). The cash is tax-free (it is a loan, not income), but your monthly payment will be higher because the loan is larger.\n\nCommon uses for cash-out proceeds: home improvements, debt consolidation, education expenses, or investment. The key question is whether the use of those funds generates more value than the cost of borrowing.',
      },
      {
        heading: 'When Refinancing Does NOT Make Sense',
        content: 'You are planning to move within the break-even period. The math does not work if you will not be there long enough to recoup the costs.\n\nYou have had your current mortgage for 20+ years. At this point, most of your payment is going to principal. Refinancing into a new 30-year restarts the interest-heavy early years, potentially costing you more even at a lower rate.\n\nYour current loan has a prepayment penalty. Some older or non-standard loans charge a fee for paying off the loan early. Factor this into your break-even calculation.\n\nYou cannot qualify for a meaningfully better rate. If your credit has declined, your home has lost value, or rates have not dropped enough, the savings might not justify the hassle and cost.\n\nYou would need to pay PMI on the new loan. If your home has decreased in value and you no longer have 20% equity, refinancing could trigger PMI that you did not have before.',
      },
      {
        heading: 'The Refinance Process',
        content: 'Refinancing follows a similar process to your original mortgage:\n\n1. Shop at least 3 lenders for rates and fees.\n2. Apply and provide financial documentation (income, assets, debts).\n3. The lender orders an appraisal of your home (you pay for this, typically $400-$600).\n4. Underwriting reviews and approves the loan.\n5. You receive and review the Closing Disclosure.\n6. You sign closing documents and the new loan pays off the old one.\n\nThe process typically takes 30-45 days. During this time, continue making payments on your existing mortgage.',
      },
    ],
  },

  'credit-score-mortgage': {
    slug: 'credit-score-mortgage',
    keyTakeaways: [
      'Most mortgage lenders use the middle of your three FICO scores.',
      'A score above 740 generally gets you the best rates; below 620 limits your options significantly.',
      'Payment history (35%) and credit utilization (30%) are the two biggest scoring factors.',
      'Quick wins: pay down credit cards and dispute errors. These can move your score in weeks.',
      'Multiple mortgage inquiries within a 14-45 day window count as a single inquiry.',
    ],
    relatedSlugs: ['understanding-mortgage-rates', 'first-time-homebuyer-guide', 'fha-va-conventional'],
    sections: [
      {
        content: 'Your credit score is the most influential factor in the mortgage rate you will be offered. Understanding how scores work and what you can do to improve yours before applying can save you tens of thousands of dollars. This guide explains the mechanics and gives you a practical action plan.',
      },
      {
        heading: 'How Mortgage Lenders Use Credit Scores',
        content: 'When you apply for a mortgage, the lender pulls your credit report from all three bureaus (Equifax, Experian, and TransUnion). Each bureau produces a FICO score, and lenders use the middle score. If your scores are 720, 735, and 710, the lender uses 720.\n\nFor joint applications, the lender uses the lower of the two applicants\' middle scores. This means if your scores are 750 and your co-borrower\'s are 680, the lender uses 680 for pricing. In some cases, it may be strategic for one person to apply alone if their score is significantly higher (assuming they qualify on their own income).\n\nImportant: mortgage lenders use older FICO scoring models (FICO 2, 4, and 5) that are different from the FICO 8 score you might see on credit monitoring apps. Your mortgage score may be 20-40 points different from what you see online.',
      },
      {
        heading: 'Score Ranges and What They Mean',
        content: '760+: Excellent. You will qualify for the best rates available. Every lender will want your business.\n\n740-759: Very Good. Rates may be a hair above the absolute best, but the difference is minimal.\n\n720-739: Good. Solid rates available. You are in good shape.\n\n700-719: Above Average. Most programs are available, rates slightly higher.\n\n680-699: Average. Conventional loans available but at higher rates. FHA may offer better terms.\n\n660-679: Below Average. Conventional options limited. FHA is typically the better path.\n\n620-659: Fair. FHA loans available. Conventional may require additional compensating factors. Rates will be notably higher.\n\nBelow 620: Limited Options. FHA (minimum 580 with 3.5% down, or 500-579 with 10% down). Some non-QM lenders specialize in lower credit scores but at significantly higher rates.',
      },
      {
        heading: 'The Five Factors in Your Credit Score',
        content: 'Payment history (35%): This is the single most important factor. Even one 30-day late payment can drop your score 50-100 points and stays on your report for 7 years. Pay everything on time, always.\n\nCredit utilization (30%): This is the percentage of your available credit that you are using. If you have $20,000 in total credit limits and carry $6,000 in balances, your utilization is 30%. Below 10% is ideal for the best scores. This applies to both individual cards and your total across all cards.\n\nLength of credit history (15%): Older accounts help your score. This is why closing old credit cards can hurt you -- it reduces the average age of your accounts.\n\nCredit mix (10%): Having different types of credit (credit cards, auto loans, student loans) shows you can manage various obligations.\n\nNew credit inquiries (10%): Each hard inquiry (like applying for a credit card) can temporarily reduce your score by 5-10 points. Multiple mortgage inquiries within a 14-45 day window (depending on the scoring model) count as a single inquiry -- so shop aggressively for rates in a short time frame.',
      },
      {
        type: 'tip',
        heading: 'Quick Wins to Boost Your Score',
        content: 'These actions can improve your score relatively quickly -- sometimes within a single billing cycle:\n\nPay down credit card balances. Getting below 30% utilization helps; below 10% is better. If you can only pay down one card, target the one with the highest utilization ratio.\n\nBecome an authorized user on a family member\'s old, well-managed card. Their positive history can boost your score.\n\nDispute errors on your credit report. About 25% of consumers have errors that could affect their scores. Check all three bureau reports.\n\nAsk for credit limit increases (without a hard pull). This reduces your utilization ratio without paying anything down.\n\nDo NOT close old accounts, open new accounts, or make large purchases in the months before applying.',
      },
      {
        heading: 'The Rate Impact: Real Numbers',
        content: 'Here is what different credit scores mean in dollars on a $350,000, 30-year fixed mortgage (rates are illustrative):\n\n760+ score: 6.25% rate = $2,155/month = $426,000 total interest\n720 score: 6.50% rate = $2,212/month = $446,000 total interest\n680 score: 6.875% rate = $2,299/month = $478,000 total interest\n640 score: 7.375% rate = $2,418/month = $520,000 total interest\n\nThe difference between a 760 and a 640 score is $263/month and nearly $95,000 in total interest. That is the cost of a poor credit score over the life of one loan.',
      },
      {
        heading: 'Timeline: When to Start Preparing',
        content: '12 months before: Pull your credit reports and identify issues. Start paying down balances. Dispute errors.\n\n6 months before: Aggressively reduce credit card balances. Avoid any new credit applications.\n\n3 months before: Check scores again. Make sure all disputes are resolved. Keep balances low.\n\n1 month before: Do not change anything. No new accounts, no large purchases, no balance transfers.\n\nThe day you apply: Your credit is pulled. After this, you are in the clear -- continue making payments on time, but your rate is determined.',
      },
    ],
  },

  'closing-costs-explained': {
    slug: 'closing-costs-explained',
    keyTakeaways: [
      'Closing costs typically run 2-5% of the purchase price.',
      'Some fees are negotiable; others are fixed by third parties.',
      'The Loan Estimate and Closing Disclosure show you every cost upfront.',
      'Seller concessions can help cover closing costs, especially in buyer\'s markets.',
      'No-closing-cost loans roll fees into a higher rate -- you still pay, just differently.',
    ],
    relatedSlugs: ['first-time-homebuyer-guide', 'how-much-house-can-i-afford', 'mortgage-process-timeline'],
    sections: [
      {
        content: 'Closing costs are the fees and expenses beyond the down payment that you pay to finalize a real estate transaction. They catch many first-time buyers off guard because they can add up to thousands of dollars. This guide walks through every line item so there are no surprises at the closing table.',
      },
      {
        heading: 'How Much Will You Pay?',
        content: 'On a purchase, closing costs typically range from 2-5% of the home\'s purchase price. On a $400,000 home, that is $8,000-$20,000. The actual amount depends on your location (some areas have higher transfer taxes or attorney fees), loan type, down payment, and negotiated terms.\n\nYou will see every anticipated cost on your Loan Estimate, which the lender must provide within 3 business days of receiving your application. This gives you a clear picture before you commit.',
      },
      {
        heading: 'Lender Fees',
        content: 'Origination fee: This is the lender\'s main fee for processing your loan. It can be a flat fee ($1,000-$2,000) or a percentage of the loan amount (0.5-1%). Some lenders advertise "no origination fee" but compensate with a higher rate.\n\nDiscount points: Optional. Each point costs 1% of the loan amount and reduces your rate by about 0.25%. Only buy points if you plan to keep the loan long enough to break even.\n\nUnderwriting fee: Covers the cost of reviewing and verifying your application. Typically $400-$900.\n\nCredit report fee: Usually $30-$60. Some lenders include this in the origination fee.\n\nRate lock fee: Some lenders charge for locking your rate, especially for longer lock periods. Many offer free 30-day locks.',
      },
      {
        heading: 'Third-Party Fees',
        content: 'Appraisal fee: The lender requires an independent property appraisal to confirm the home\'s value. Cost: $400-$700 depending on property type and location.\n\nHome inspection: Technically optional but strongly recommended. Cost: $300-$600. This is not always included in "closing costs" since it is usually paid upfront.\n\nTitle search and title insurance: The title company searches public records to confirm the seller legally owns the property and there are no outstanding claims. Title insurance protects you (and the lender) from future claims against the property. Lender\'s title insurance is required; owner\'s title insurance is optional but recommended. Combined cost: $1,000-$3,000.\n\nSurvey: Some states and lenders require a property survey. Cost: $300-$600.\n\nAttorney fees: In some states, an attorney must be present at closing. Cost: $500-$1,500.',
      },
      {
        heading: 'Government Fees',
        content: 'Recording fees: The county charges to record the new deed and mortgage. Typically $50-$250.\n\nTransfer taxes: Some states and municipalities charge a tax on the transfer of property. These vary dramatically -- from nothing in some states to over 2% in others. Check your specific location.\n\nFHA/VA fees: FHA loans have an upfront mortgage insurance premium (1.75% of the loan amount, usually rolled into the loan). VA loans have a funding fee (1.25-3.3% depending on down payment and usage, also typically rolled into the loan).',
      },
      {
        heading: 'Prepaid Items and Escrow',
        content: 'These are not really "fees" -- they are prepayments of ongoing costs, but they are collected at closing.\n\nPrepaid interest: Interest from your closing date through the end of that month. If you close on the 10th of a 30-day month, you prepay 20 days of interest.\n\nHomeowner\'s insurance: You typically prepay the first full year\'s premium at closing.\n\nProperty taxes: Your lender sets up an escrow account and collects several months of property taxes upfront to create a buffer.\n\nEscrow reserves: The lender may require 2-6 months of additional tax and insurance reserves in the escrow account.',
      },
      {
        heading: 'How to Reduce Closing Costs',
        content: 'Negotiate with the seller. In buyer\'s markets, sellers may agree to pay some or all of your closing costs as a concession (typically up to 3-6% of the purchase price depending on loan type).\n\nShop for third-party services. You can choose your own title company, insurance provider, and other services. The lender must provide a list of what you can shop for.\n\nAsk about lender credits. Many lenders will cover some closing costs in exchange for a slightly higher interest rate. This can make sense if you want to minimize upfront cash.\n\nChoose a "no-closing-cost" loan. The lender covers all fees by charging a higher rate. You pay more monthly, but nothing extra upfront. This makes sense if you plan to refinance or sell relatively soon.\n\nClose at the end of the month. This minimizes prepaid interest. Closing on the 28th means you prepay 2-3 days of interest instead of 20+.',
      },
      {
        type: 'checklist',
        heading: 'Closing Cost Review Checklist',
        content: 'Compare your Closing Disclosure to your original Loan Estimate:',
        items: [
          'Interest rate matches what was locked',
          'Loan amount is correct',
          'Monthly payment matches expectations',
          'Origination charges have not increased beyond legal tolerances',
          'Third-party fees are in the expected range',
          'Prepaid amounts are calculated correctly',
          'Cash to close figure is accurate',
          'No surprise fees or charges added',
        ],
      },
    ],
  },

  'home-equity-options': {
    slug: 'home-equity-options',
    keyTakeaways: [
      'HELOCs offer flexible access to equity with variable rates.',
      'Home equity loans provide a lump sum with a fixed rate.',
      'Cash-out refinances replace your existing mortgage entirely.',
      'Interest may be tax-deductible if funds are used for home improvements.',
      'You are borrowing against your home -- defaulting means foreclosure.',
    ],
    relatedSlugs: ['refinance-breakeven', 'understanding-mortgage-rates', 'credit-score-mortgage'],
    sections: [
      {
        content: 'If you have built equity in your home, you have three main ways to access it: a home equity line of credit (HELOC), a home equity loan, or a cash-out refinance. Each has distinct advantages, costs, and risks. This guide compares all three so you can choose the one that fits your situation.',
      },
      {
        heading: 'Understanding Home Equity',
        content: 'Equity is the difference between your home\'s current market value and what you owe on it. If your home is worth $500,000 and your mortgage balance is $300,000, you have $200,000 in equity.\n\nMost lenders allow you to borrow up to 80-85% of your home\'s value, minus your existing mortgage. In the example above: $500,000 x 0.80 = $400,000, minus $300,000 owed = up to $100,000 available.\n\nYour available equity depends on your home\'s current appraised value, not what you paid for it. If your home has appreciated significantly, you may have more borrowing power than you think.',
      },
      {
        heading: 'HELOC: The Flexible Option',
        content: 'A home equity line of credit works like a credit card secured by your home. You get a credit limit and can draw from it as needed during the "draw period" (usually 10 years). You only pay interest on what you borrow.\n\nRates are typically variable, based on the prime rate plus a margin. As of recent markets, HELOC rates tend to be 1-2% above the prime rate.\n\nAfter the draw period ends, you enter the repayment period (usually 10-20 years), during which you can no longer draw funds and must repay the outstanding balance.\n\nBest for: ongoing expenses like home renovations (where costs may vary), education expenses spread over time, or as an emergency fund backup. The flexibility to borrow only what you need and pay interest only on what you use makes it efficient for unpredictable costs.',
      },
      {
        heading: 'Home Equity Loan: The Lump Sum',
        content: 'A home equity loan gives you a fixed amount of money upfront, at a fixed interest rate, repaid in equal monthly installments over a set term (typically 5-30 years).\n\nThe predictability is the main advantage. You know exactly what you are borrowing, at what rate, and what you will pay each month. There are no surprises.\n\nRates are typically slightly higher than first mortgage rates but fixed, unlike a HELOC.\n\nBest for: one-time expenses where you know the exact amount -- debt consolidation, a major one-time renovation, a large purchase, or a financial event with a known cost.',
      },
      {
        heading: 'Cash-Out Refinance: The Full Replace',
        content: 'A cash-out refinance replaces your existing mortgage with a new, larger one. You receive the difference between the new loan and the old balance in cash.\n\nExample: You owe $300,000 on your current mortgage. You refinance for $375,000. After paying off the old loan, you receive $75,000 in cash (minus closing costs).\n\nCash-out refinances offer the lowest rates of the three options because it is a first mortgage (lower risk for the lender). But closing costs are highest (2-3% of the new loan amount), and you are resetting your mortgage term.\n\nBest for: situations where you also want to lower your mortgage rate, large amounts of equity to tap, or when the blended cost of a new first mortgage is better than adding a second lien.',
      },
      {
        type: 'comparison',
        heading: 'Side-by-Side Comparison',
        content: 'HELOC:\n- Rate: Variable, typically prime + margin\n- Access: Draw as needed, revolving line\n- Closing costs: Minimal ($0-$500 typically)\n- Monthly payment: Interest-only during draw period, then P&I\n- Best for: Flexible, ongoing needs\n\nHome Equity Loan:\n- Rate: Fixed\n- Access: Lump sum upfront\n- Closing costs: Low to moderate ($500-$2,000)\n- Monthly payment: Fixed P&I from day one\n- Best for: Known, one-time expenses\n\nCash-Out Refinance:\n- Rate: Fixed (lowest of the three)\n- Access: Lump sum, replaces your mortgage\n- Closing costs: Highest (2-3% of new loan amount)\n- Monthly payment: New fixed P&I (replaces old mortgage)\n- Best for: Large amounts + rate improvement',
      },
      {
        type: 'warning',
        content: 'All three options use your home as collateral. If you cannot make the payments, you risk foreclosure. Only borrow what you can comfortably repay, and avoid using home equity for consumable expenses (vacations, general spending) that do not build lasting value.',
      },
      {
        heading: 'Tax Considerations',
        content: 'Interest on home equity debt may be tax-deductible if the funds are used to "buy, build, or substantially improve" the home that secures the loan. If you use a HELOC to renovate your kitchen, the interest is likely deductible. If you use it to pay off credit cards, it is not.\n\nThis rule applies to combined mortgage and home equity debt up to $750,000 (for loans originated after December 2017). Consult a tax professional for your specific situation.',
      },
    ],
  },

  'fha-va-conventional': {
    slug: 'fha-va-conventional',
    keyTakeaways: [
      'Conventional loans offer the most flexibility and lowest costs for well-qualified borrowers.',
      'FHA loans are designed for buyers with lower credit scores or smaller down payments.',
      'VA loans are the best deal available -- if you qualify.',
      'Each loan type has different rules for down payment, mortgage insurance, and property requirements.',
      'Your loan officer can run scenarios on all three to show you the real cost comparison.',
    ],
    relatedSlugs: ['down-payment-strategies', 'credit-score-mortgage', 'first-time-homebuyer-guide'],
    sections: [
      {
        content: 'Choosing between FHA, VA, and conventional loans is one of the first big decisions in the mortgage process. Each has unique advantages and trade-offs. This guide gives you a clear comparison so you can pick the option that costs you the least over time.',
      },
      {
        heading: 'Conventional Loans',
        content: 'Conventional loans are not backed by a government agency. They are originated and guaranteed by private lenders and then typically sold to Fannie Mae or Freddie Mac. They are the most common loan type in America.\n\nDown payment: As low as 3% for first-time buyers (Fannie Mae HomeReady, Freddie Mac Home Possible) or 5% for standard conventional loans.\n\nCredit score: Minimum 620, but you will want 740+ for the best rates.\n\nMortgage insurance: Required if you put less than 20% down (PMI), but it cancels once you reach 20% equity. PMI costs depend on credit score and down payment but typically range from 0.3-1.5% of the loan amount per year.\n\nLoan limits: $766,550 in most areas for 2024, higher in high-cost markets. Above this limit, you need a "jumbo" loan.\n\nProperty requirements: The home must be habitable and structurally sound, but requirements are less strict than FHA.\n\nBest for: Borrowers with good credit (700+), at least 5% down, and stable income. Especially good if you can reach 20% down to avoid PMI entirely.',
      },
      {
        heading: 'FHA Loans',
        content: 'FHA loans are insured by the Federal Housing Administration. The government backing allows lenders to offer more lenient qualifying criteria.\n\nDown payment: 3.5% with a credit score of 580+. 10% with a score of 500-579.\n\nCredit score: Minimum 500 (with 10% down) or 580 (with 3.5% down). Much more forgiving than conventional.\n\nMortgage insurance: This is the biggest downside of FHA loans. You pay both an upfront mortgage insurance premium (UFMIP) of 1.75% of the loan amount (usually rolled into the loan) and an annual MIP of 0.55% for the life of the loan if you put less than 10% down. With 10%+ down, MIP drops off after 11 years.\n\nLoan limits: $498,257 in most areas, higher in high-cost markets.\n\nProperty requirements: Stricter than conventional. The home must meet HUD minimum property standards. Issues like peeling paint, structural concerns, or safety hazards must be addressed before closing.\n\nBest for: Buyers with credit scores below 700, limited down payment funds, or higher debt-to-income ratios. The lifetime MIP makes FHA more expensive long-term for well-qualified borrowers.',
      },
      {
        heading: 'VA Loans',
        content: 'VA loans are guaranteed by the Department of Veterans Affairs and available to eligible veterans, active-duty service members, National Guard/Reserve members, and surviving spouses.\n\nDown payment: 0%. This is the headline benefit -- no down payment required.\n\nCredit score: No VA-mandated minimum, but most lenders require 620+.\n\nMortgage insurance: None. Zero. VA loans have no monthly mortgage insurance, which is a massive advantage.\n\nFunding fee: A one-time fee (1.25-3.3% of the loan amount) is charged instead of monthly MI. It can be rolled into the loan. Disabled veterans and surviving spouses are exempt.\n\nLoan limits: No limit for borrowers with full VA entitlement.\n\nProperty requirements: Similar to FHA. The home must meet minimum property requirements (MPRs) including adequate heating, roofing, and safe drinking water.\n\nBest for: Any eligible veteran or service member. Between zero down payment, no PMI, competitive rates, and no loan limit, VA loans are arguably the best mortgage product available.',
      },
      {
        type: 'comparison',
        heading: 'Cost Comparison: $350,000 Home',
        content: 'Conventional (5% down, 720 credit score, 6.5% rate):\n- Down payment: $17,500\n- Loan: $332,500\n- Monthly P&I: $2,102\n- PMI: ~$130/month (cancels at 20% equity)\n- Total month 1: $2,232\n\nFHA (3.5% down, 660 credit score, 6.25% rate):\n- Down payment: $12,250\n- Loan: $343,653 (includes UFMIP)\n- Monthly P&I: $2,116\n- MIP: $158/month (for life of loan)\n- Total month 1: $2,274\n\nVA (0% down, 700 credit score, 6.0% rate):\n- Down payment: $0\n- Loan: $358,750 (includes funding fee)\n- Monthly P&I: $2,151\n- MI: $0\n- Total month 1: $2,151\n\nThe VA loan has the lowest monthly cost despite the largest loan amount because there is no monthly mortgage insurance.',
      },
      {
        heading: 'Switching Loan Types Later',
        content: 'You are not locked into your original loan type forever. A common strategy is to start with an FHA loan (easier to qualify) and refinance to a conventional loan once your credit improves and you have 20% equity. This eliminates the lifetime MIP.\n\nVA borrowers can refinance using the VA Interest Rate Reduction Refinance Loan (IRRRL), which has a streamlined process with minimal documentation.\n\nConventional borrowers can refinance to take advantage of lower rates or switch to a shorter term as their financial situation improves.',
      },
    ],
  },

  'mortgage-preapproval': {
    slug: 'mortgage-preapproval',
    keyTakeaways: [
      'Pre-qualification is a rough estimate; pre-approval is a verified commitment.',
      'Sellers and agents take pre-approved buyers more seriously.',
      'The pre-approval process typically takes 1-3 business days.',
      'Pre-approval letters are usually valid for 60-90 days.',
      'Getting pre-approved does not obligate you to use that lender.',
    ],
    relatedSlugs: ['first-time-homebuyer-guide', 'credit-score-mortgage', 'mortgage-process-timeline'],
    sections: [
      {
        content: 'In competitive housing markets, the difference between getting your dream home and losing it often comes down to one document: a pre-approval letter. Understanding the difference between pre-qualification and pre-approval -- and knowing how to get the strongest pre-approval possible -- gives you a real advantage.',
      },
      {
        heading: 'Pre-Qualification: The Quick Estimate',
        content: 'Pre-qualification is an informal assessment based on self-reported financial information. You tell a lender your income, debts, and assets, and they give you a rough estimate of what you might qualify for.\n\nNo documents are verified. No credit is pulled. It typically takes minutes and can often be done online or over the phone.\n\nPre-qualification is useful for getting a ballpark figure early in your home search, but it carries little weight with sellers or real estate agents. It is essentially a lender saying "based on what you told us, you could probably qualify for X" -- with no verification.',
      },
      {
        heading: 'Pre-Approval: The Verified Commitment',
        content: 'Pre-approval is a thorough evaluation of your financial situation. The lender pulls your credit, reviews your income documentation, verifies your assets, and runs your application through underwriting guidelines.\n\nThe result is a pre-approval letter stating the specific loan amount, loan type, and terms the lender is willing to offer. This letter tells sellers that a lender has vetted your finances and is prepared to fund the loan.\n\nIn competitive markets, many sellers will not even consider offers without a pre-approval letter. It signals that you are a serious, qualified buyer who can close the deal.',
      },
      {
        heading: 'What You Need for Pre-Approval',
        content: 'Gather these documents before you apply:\n\nIncome verification: Most recent 30 days of pay stubs, W-2s from the last 2 years, and federal tax returns from the last 2 years. Self-employed borrowers will also need profit-and-loss statements and possibly business tax returns.\n\nAsset verification: Bank statements from the last 2-3 months for all accounts (checking, savings, investment, retirement). The lender needs to see where your down payment and reserves are coming from.\n\nIdentification: Valid government-issued photo ID and Social Security number.\n\nDebt information: The lender will pull this from your credit report, but be prepared to explain any unusual items.\n\nRental history: Contact information for your current landlord (if renting) or mortgage payment history.',
      },
      {
        type: 'tip',
        content: 'Get pre-approved with 2-3 lenders. This lets you compare rates and terms. All mortgage credit inquiries within a 14-45 day window (depending on the scoring model) count as a single inquiry on your credit report.',
      },
      {
        heading: 'Strengthening Your Pre-Approval',
        content: 'Not all pre-approvals are created equal. Here is how to make yours as strong as possible:\n\nComplete underwriting upfront. Some lenders offer "fully underwritten" pre-approvals where your application goes through the full review process before you even find a home. This is the strongest form of pre-approval and can make your offer nearly as strong as cash.\n\nProvide more documentation than required. If a lender asks for 2 months of bank statements, provide 3. Excess documentation speeds up the process and shows thoroughness.\n\nGet a specific pre-approval for each property. A generic pre-approval letter is good, but a letter addressed to the specific property address and purchase price is better. Ask your lender to issue updated letters as you make offers.\n\nKnow your limits. Do not stretch to the maximum pre-approval amount. Sellers and agents can see the approved amount. Consider getting pre-approved for slightly more than you plan to offer, giving you negotiating room.',
      },
      {
        heading: 'Common Pre-Approval Mistakes',
        content: 'Changing jobs during the process. Lenders verify employment, and a job change can delay or derail your approval.\n\nMaking large deposits without documentation. A sudden $10,000 deposit requires a paper trail. Gift? Sale of property? Moving funds between accounts? The lender needs to know.\n\nOpening new credit accounts. A new credit card or auto loan changes your debt-to-income ratio and can reduce your approved amount.\n\nCo-signing for someone else. This debt counts as yours in the lender\'s calculation.\n\nAssuming pre-approval means final approval. Pre-approval is conditional. The final approval depends on the property appraisal, a satisfactory title search, and no material changes to your financial situation.',
      },
    ],
  },

  'mortgage-process-timeline': {
    slug: 'mortgage-process-timeline',
    keyTakeaways: [
      'The mortgage process typically takes 30-45 days from application to closing.',
      'Delays are usually caused by missing documents, appraisal issues, or title problems.',
      'Responsiveness to lender requests is the biggest thing within your control.',
      'Do not make major financial changes after applying.',
      'Your Closing Disclosure must be received 3 business days before closing.',
    ],
    relatedSlugs: ['first-time-homebuyer-guide', 'closing-costs-explained', 'mortgage-preapproval'],
    sections: [
      {
        content: 'After you submit your mortgage application, a lot happens behind the scenes. This week-by-week breakdown shows you exactly what to expect so nothing catches you off guard. Understanding the timeline also helps you be proactive -- the faster you respond to requests, the smoother the process.',
      },
      {
        heading: 'Week 1: Application and Disclosure',
        content: 'You submit your mortgage application (the Uniform Residential Loan Application, or Form 1003). This includes your personal information, employment history, income, assets, debts, and details about the property.\n\nWithin 3 business days, the lender must provide your Loan Estimate (LE). This standardized form shows your estimated interest rate, monthly payment, closing costs, and other key terms. Review it carefully and ask questions about anything unclear.\n\nThe lender will also request additional documents: updated pay stubs, bank statements, tax returns, and any other items specific to your situation. Respond to these requests immediately -- delays here push back the entire timeline.',
      },
      {
        heading: 'Week 1-2: Processing',
        content: 'Your loan processor compiles your file and verifies the information. They will order third-party services:\n\nAppraisal: An independent appraiser visits the property to determine its market value. This typically takes 1-2 weeks to schedule and complete.\n\nTitle search: A title company examines public records to confirm the seller owns the property and identify any liens, easements, or other issues.\n\nVerification of employment (VOE): The lender contacts your employer to confirm your job title, income, and employment status.\n\nVerification of deposit (VOD): If the lender needs additional confirmation of your assets beyond bank statements.\n\nDuring this time, you may receive "conditions" -- requests for additional documentation or clarification. Common conditions include letters of explanation for large deposits, updated documents, or proof of insurance.',
      },
      {
        heading: 'Week 2-3: Underwriting',
        content: 'The underwriter reviews your entire file to determine if the loan meets the lender\'s and the investor\'s guidelines. They evaluate:\n\nYour ability to repay (income, employment stability, DTI ratio). Your creditworthiness (credit score, payment history). The collateral (appraisal, property condition). Your assets and reserves.\n\nThe underwriter will issue one of three decisions:\n\nApproved: Your loan is approved as-is. This is rare without any conditions.\n\nApproved with conditions: The most common outcome. The underwriter approves the loan but needs a few more items before issuing final approval. These are called "prior to docs" (PTD) conditions.\n\nSuspended or denied: The loan cannot be approved as submitted. The lender will explain why and what (if anything) can be done.',
      },
      {
        heading: 'Week 3-4: Condition Clearing and Clear to Close',
        content: 'You and your loan team work to satisfy the underwriter\'s conditions. This might include providing an updated bank statement, a letter from your employer, additional insurance documentation, or proof that a debt has been paid.\n\nOnce all conditions are met, the underwriter issues a "clear to close" (CTC). This is the green light -- your loan is fully approved and ready to close.\n\nThe lender prepares your final closing documents, including the Closing Disclosure (CD). By law, you must receive the CD at least 3 business days before closing. This gives you time to review every number and compare it to your Loan Estimate.',
      },
      {
        heading: 'Week 4-5: Closing',
        content: 'Closing day is when ownership transfers. Here is what happens:\n\nFinal walkthrough: You (or your agent) inspect the property one last time to confirm it is in the agreed-upon condition and any negotiated repairs have been completed.\n\nSigning: At the closing table (or remotely in some states), you sign the mortgage note, deed of trust, and numerous other documents. Bring valid photo ID.\n\nFunding: Your down payment and closing costs are transferred (usually by cashier\'s check or wire). The lender funds the loan.\n\nRecording: The county records the deed and mortgage, making the transaction official.\n\nKeys: Once recording is confirmed, you receive the keys. Congratulations.\n\nThe entire closing appointment typically takes 60-90 minutes.',
      },
      {
        type: 'tip',
        heading: 'How to Avoid Delays',
        content: 'The most common causes of closing delays are within your control:\n\nRespond to document requests within 24 hours. Every day you wait adds a day to the timeline.\n\nProvide complete, legible documents. Blurry photos of pay stubs or bank statements missing pages create back-and-forth.\n\nDo not make financial changes. No new debt, no large deposits or withdrawals, no job changes. If something unavoidable happens, tell your loan officer immediately.\n\nStay in communication. Return calls and emails from your loan officer, processor, and real estate agent promptly.\n\nSchedule your homeowner\'s insurance early. You need proof of insurance before closing. Do not leave this to the last minute.',
      },
      {
        type: 'checklist',
        heading: 'Post-Application Checklist',
        content: 'Keep this timeline on track:',
        items: [
          'Review Loan Estimate within 3 days of application',
          'Provide all requested documents within 24 hours',
          'Schedule homeowner\'s insurance',
          'Respond to any appraisal-related requests promptly',
          'Clear underwriting conditions as quickly as possible',
          'Review Closing Disclosure 3+ days before closing',
          'Schedule final walkthrough',
          'Arrange cashier\'s check or wire for closing',
          'Bring valid photo ID to closing',
        ],
      },
    ],
  },
};
