import { BookOpen, TrendingUp, FileText, HelpCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function EducationPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('process');

  const sections = [
    {
      id: 'process',
      title: 'The Mortgage Process',
      icon: FileText,
      content: [
        {
          title: 'Pre-Qualification',
          description:
            'Get an estimate of how much you can borrow based on your income, assets, and debts. This is a quick, informal assessment that helps you understand your budget.',
        },
        {
          title: 'Pre-Approval',
          description:
            'A more formal process where lenders verify your financial information and provide a conditional commitment for a specific loan amount. This strengthens your offer when buying.',
        },
        {
          title: 'Home Shopping',
          description:
            'Armed with your pre-approval, you can confidently search for homes within your budget. Your real estate agent will help you find properties that meet your needs.',
        },
        {
          title: 'Making an Offer',
          description:
            'When you find the right home, submit an offer with your pre-approval letter. This shows sellers you\'re a serious buyer with financing already arranged.',
        },
        {
          title: 'Home Appraisal',
          description:
            'The lender orders an appraisal to ensure the home\'s value supports the loan amount. This protects both you and the lender from overpaying for the property.',
        },
        {
          title: 'Underwriting',
          description:
            'Your loan application goes through a detailed review process where underwriters verify all information and assess the risk of lending to you.',
        },
        {
          title: 'Closing',
          description:
            'The final step where you sign all documents, pay closing costs, and receive the keys to your new home. Congratulations, you\'re a homeowner!',
        },
      ],
    },
    {
      id: 'terms',
      title: 'Common Mortgage Terms',
      icon: BookOpen,
      content: [
        {
          title: 'APR (Annual Percentage Rate)',
          description:
            'The total cost of borrowing money, including interest rate and fees, expressed as a yearly percentage. APR helps you compare loans from different lenders.',
        },
        {
          title: 'Amortization',
          description:
            'The process of paying off a loan over time through regular payments. Each payment includes both principal and interest, with more going to principal over time.',
        },
        {
          title: 'Closing Costs',
          description:
            'Fees paid at closing, typically 2-5% of the loan amount. These include appraisal fees, title insurance, origination fees, and other charges.',
        },
        {
          title: 'Down Payment',
          description:
            'The upfront cash you pay toward the home purchase. Conventional loans typically require 3-20%, while FHA loans may require as little as 3.5%.',
        },
        {
          title: 'Equity',
          description:
            'The difference between your home\'s value and what you owe on the mortgage. Equity builds as you pay down the loan and as your home appreciates in value.',
        },
        {
          title: 'Escrow',
          description:
            'An account where funds for property taxes and insurance are held. Your monthly payment includes these costs, and the lender pays them on your behalf.',
        },
        {
          title: 'Fixed-Rate Mortgage',
          description:
            'A loan with an interest rate that stays the same for the entire term. This provides predictable monthly payments and protection from rate increases.',
        },
        {
          title: 'Adjustable-Rate Mortgage (ARM)',
          description:
            'A loan with an interest rate that can change periodically. ARMs typically start with lower rates but can increase or decrease based on market conditions.',
        },
        {
          title: 'LTV (Loan-to-Value Ratio)',
          description:
            'The loan amount divided by the property value, expressed as a percentage. Higher LTV means less equity and may require mortgage insurance.',
        },
        {
          title: 'PMI (Private Mortgage Insurance)',
          description:
            'Insurance required on conventional loans when you put down less than 20%. PMI protects the lender if you default but can be removed once you reach 20% equity.',
        },
        {
          title: 'Points',
          description:
            'Prepaid interest paid at closing to reduce your interest rate. One point equals 1% of the loan amount. Buying points can save money over time.',
        },
        {
          title: 'Principal',
          description:
            'The amount borrowed or the remaining balance on a loan. Each monthly payment reduces the principal, building equity in your home.',
        },
      ],
    },
    {
      id: 'tips',
      title: 'First-Time Buyer Tips',
      icon: TrendingUp,
      content: [
        {
          title: 'Check Your Credit Score',
          description:
            'Your credit score significantly impacts your interest rate. Review your credit report for errors and work on improving your score before applying. Aim for at least 620, though 740+ gets the best rates.',
        },
        {
          title: 'Save for Down Payment & Closing Costs',
          description:
            'While some programs allow low down payments, saving 10-20% provides better rates and lower monthly payments. Don\'t forget to budget for closing costs (2-5% of purchase price).',
        },
        {
          title: 'Get Pre-Approved First',
          description:
            'Pre-approval shows sellers you\'re a serious buyer and helps you understand your budget. It also speeds up the closing process once you find the right home.',
        },
        {
          title: 'Consider All Costs',
          description:
            'Beyond the mortgage payment, budget for property taxes, insurance, HOA fees, utilities, and maintenance. A good rule is to budget 1-2% of the home\'s value annually for maintenance.',
        },
        {
          title: 'Explore First-Time Buyer Programs',
          description:
            'Many states and localities offer programs with down payment assistance, lower interest rates, or reduced fees for first-time buyers. Ask us about available programs in your area.',
        },
        {
          title: 'Don\'t Skip the Home Inspection',
          description:
            'A professional inspection can reveal costly issues before you buy. This small investment can save you thousands and provides leverage to negotiate repairs or price reductions.',
        },
        {
          title: 'Avoid Major Financial Changes',
          description:
            'During the mortgage process, avoid opening new credit accounts, making large purchases, or changing jobs. These actions can affect your loan approval.',
        },
        {
          title: 'Shop Around for Rates',
          description:
            'Compare offers from multiple lenders. Even a small difference in interest rates can save thousands over the life of your loan. We help you compare multiple options easily.',
        },
      ],
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      icon: HelpCircle,
      content: [
        {
          title: 'How much do I need for a down payment?',
          description:
            'It depends on the loan type. Conventional loans can require as little as 3% down, FHA loans 3.5%, VA and USDA loans may require 0% down. However, putting 20% down eliminates PMI and reduces your monthly payment.',
        },
        {
          title: 'What credit score do I need?',
          description:
            'Minimum scores vary by loan type: FHA loans allow scores as low as 580, conventional loans typically require 620+, and VA loans may accept 580+. Higher scores qualify for better interest rates.',
        },
        {
          title: 'How long does the mortgage process take?',
          description:
            'From application to closing typically takes 30-45 days. Pre-approval can happen in minutes to days. Having your documents organized and responding quickly to requests speeds up the process.',
        },
        {
          title: 'Can I buy a home with student loan debt?',
          description:
            'Yes! Lenders consider your debt-to-income ratio, which includes student loans. As long as your total monthly debts (including the new mortgage) don\'t exceed 43-50% of your income, you can qualify.',
        },
        {
          title: 'Should I choose a 15-year or 30-year mortgage?',
          description:
            '30-year mortgages have lower monthly payments but higher total interest. 15-year mortgages build equity faster and save on interest but require higher monthly payments. Choose based on your budget and financial goals.',
        },
        {
          title: 'What is mortgage insurance and do I need it?',
          description:
            'PMI is required on conventional loans with less than 20% down. FHA loans require mortgage insurance regardless of down payment. This protects the lender and typically costs 0.3-1.5% of the loan amount annually.',
        },
        {
          title: 'Can I get a mortgage if I\'m self-employed?',
          description:
            'Yes! Self-employed buyers need to provide additional documentation, including 2 years of tax returns and profit/loss statements. Consistent income and strong credit make the process smoother.',
        },
        {
          title: 'What happens if I\'m denied for a mortgage?',
          description:
            'The lender must explain why you were denied. Common reasons include low credit score, high debt-to-income ratio, or insufficient income. You can work on these issues and reapply after 3-6 months of improvement.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Homebuyer Resources
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Clear, helpful information to guide your home financing journey. United Fidelity Funding
            is committed to empowering you with the knowledge you need.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  <div
                    className={`transform transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 space-y-6">
                    {section.content.map((item, index) => (
                      <div key={index} className="border-l-4 border-red-600 pl-6 py-3 bg-red-50/30">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                            <p className="text-gray-700 leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Take the Next Step?</h2>
          <p className="text-xl text-gray-200 mb-6 max-w-2xl mx-auto">
            Our experienced mortgage professionals are here to answer your questions and guide you
            through every step of the home financing process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all">
              Start Your Application
            </button>
            <button className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-lg hover:bg-white/20 transition-all border-2 border-white/30">
              Contact Our Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
