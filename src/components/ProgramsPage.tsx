import { Home, Shield, Award, Users, Building, CheckCircle } from 'lucide-react';

interface ProgramsPageProps {
  onNavigate: (page: string) => void;
}

export default function ProgramsPage({ onNavigate }: ProgramsPageProps) {
  const programs = [
    {
      icon: Home,
      name: 'Conventional Loans',
      subtitle: 'Traditional financing with competitive rates and flexible terms',
      downPayment: '3%+',
      maxLoan: '$806,500 conforming / $1,209,750 high-cost areas',
      creditScore: '620+',
      description:
        'Traditional financing not backed by government agencies. Ideal for borrowers with strong credit and stable income. Available for purchase and refinance transactions on primary, secondary, and investment properties.',
      features: [
        'Minimum down payment: 3%',
        'Fixed and adjustable rate options available',
        'Eligible for primary, secondary, and investment properties',
        'Supports both purchase and refinance transactions',
        'Debt-to-income ratio: up to 50%',
        'Two years of tax returns and W-2s required',
      ],
      bestFor: 'Borrowers with strong credit (typically 620+) and steady income; suitable for first-time and repeat homebuyers',
      color: 'from-red-600 to-red-700',
      programType: 'conventional',
    },
    {
      icon: Shield,
      name: 'FHA Loans',
      subtitle: 'Government-backed loans with flexible credit and down payment requirements',
      downPayment: '3.5%+',
      maxLoan: 'Varies by county',
      creditScore: '580+',
      description:
        'Government-insured loans designed for first-time buyers and those with lower credit scores or limited savings. FHA loans offer competitive rates and more lenient qualification requirements.',
      features: [
        'Low down payment requirements (as low as 3.5%)',
        'More lenient credit requirements',
        'Gift funds allowed for down payment',
        'Competitive interest rates',
        'Great for first-time homebuyers',
        'Upfront and annual mortgage insurance required',
      ],
      bestFor: 'First-time buyers, those with limited savings, or borrowers rebuilding credit',
      color: 'from-gray-700 to-gray-800',
      programType: 'fha',
    },
    {
      icon: Award,
      name: 'VA Loans',
      subtitle: 'Zero down payment benefit for those who served our country',
      downPayment: '0%',
      maxLoan: 'No limit with full entitlement',
      creditScore: '580+',
      description:
        'Exclusive benefit for veterans, active military, and eligible spouses. No down payment or monthly mortgage insurance required. VA loans can be used multiple times and offer some of the best terms available.',
      features: [
        'Zero down payment required',
        'No private mortgage insurance',
        'Competitive interest rates',
        'Limited closing costs (seller can pay)',
        'Can be used multiple times',
        'Funding fee may apply (can be financed)',
      ],
      bestFor: 'Veterans, active duty military members, and eligible surviving spouses',
      color: 'from-red-600 to-red-700',
      programType: 'va',
    },
    {
      icon: Users,
      name: 'USDA Loans',
      subtitle: 'Zero down financing for eligible rural and suburban properties',
      downPayment: '0%',
      maxLoan: 'Based on income limits',
      creditScore: '640+',
      description:
        'Zero down payment loans for rural and suburban homebuyers. USDA loans offer below-market interest rates and low mortgage insurance costs. Income limits apply based on location and household size.',
      features: [
        'No down payment needed',
        'Low mortgage insurance costs',
        'Below-market interest rates',
        'Flexible credit requirements',
        'Available in eligible rural and suburban areas',
        'Income limits based on location and household size',
      ],
      bestFor: 'Rural and suburban homebuyers meeting income and location eligibility',
      color: 'from-gray-700 to-gray-800',
      programType: 'usda',
    },
    {
      icon: Building,
      name: 'Non-QM Loans',
      subtitle: 'Alternative financing solutions for unique borrower situations',
      downPayment: '10% - 20%',
      maxLoan: 'Varies by program',
      creditScore: 'Varies',
      description:
        'Non-Qualified Mortgage (Non-QM) loans provide flexible financing options for borrowers who don\'t fit traditional lending criteria. Perfect for self-employed borrowers, those with unique income sources, or complex financial situations.',
      features: [
        'Alternative income documentation',
        'Bank statement programs available',
        'Asset depletion options',
        'Interest-only payment options',
        'Flexible debt-to-income requirements',
        'Solutions for unique financial situations',
      ],
      bestFor: 'Self-employed borrowers, investors, or those with non-traditional income',
      color: 'from-red-600 to-red-700',
      programType: 'non-qm',
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Loan Programs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            United Fidelity Funding offers comprehensive mortgage solutions tailored to your unique situation.
            We provide competitive pricing, fast turnaround decisions, and dedicated underwriting support.
          </p>
        </div>

        <div className="space-y-8 mb-16">
          {programs.map((program, index) => {
            const Icon = program.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all"
              >
                <div className={`bg-gradient-to-r ${program.color} p-8 text-white`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-9 h-9" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold mb-1">{program.name}</h2>
                        <p className="text-white/90 text-lg">{program.subtitle}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-gray-200">
                    <div>
                      <div className="text-sm text-gray-600 mb-1 font-semibold">Down Payment</div>
                      <div className="text-2xl font-bold text-gray-900">{program.downPayment}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1 font-semibold">Min. Credit Score</div>
                      <div className="text-2xl font-bold text-gray-900">{program.creditScore}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1 font-semibold">Max Loan Amount</div>
                      <div className="text-xl font-bold text-gray-900">{program.maxLoan}</div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-8 leading-relaxed text-lg">{program.description}</p>

                  <div className="mb-8">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2 text-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span>Key Features & Requirements</span>
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {program.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start space-x-3 text-gray-700">
                          <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="font-semibold text-gray-900">Best For:</span>{' '}
                      <span className="text-gray-700">{program.bestFor}</span>
                    </div>
                    <button
                      onClick={() => onNavigate('apply')}
                      className="w-full md:w-auto px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 hover:shadow-lg transition-all"
                    >
                      Get Started with {program.name}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 md:p-12 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Why Choose United Fidelity Funding?</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 mb-2">Competitive Pricing</div>
                <p className="text-gray-300">Access to wholesale rates and flexible programs</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 mb-2">Fast Decisions</div>
                <p className="text-gray-300">Quick turnaround times on underwriting</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 mb-2">Dedicated Support</div>
                <p className="text-gray-300">Expert guidance throughout the process</p>
              </div>
            </div>
            <p className="text-xl text-gray-200 mb-8">
              Our experienced mortgage professionals are here to guide you through every step. Start your
              application online or connect with our team to discuss your specific situation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('apply-new')}
                className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all"
              >
                Start Your Application
              </button>
              <button
                onClick={() => onNavigate('education')}
                className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-lg hover:bg-white/20 transition-all border-2 border-white/30"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
