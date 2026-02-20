export default function Footer() {
  const currentYear = new Date().getFullYear();

  const statesLicensed = [
    'Alabama', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Florida', 'Georgia',
    'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
    'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
    'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'North Carolina',
    'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Virginia', 'Washington', 'Wisconsin'
  ];

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="mb-4">
              <img src="/uff_logo.svg" alt="United Fidelity Funding Corp" className="h-12 brightness-0 invert" />
            </div>
            <p className="text-sm mb-4">
              Unwavering commitment to excellence in mortgage lending
            </p>
            <div className="text-sm space-y-1">
              <p className="text-white font-semibold">NMLS #34381</p>
              <p>1300 NW Briarcliff Pkwy #275</p>
              <p>Kansas City, MO 64116</p>
              <p className="mt-2">
                <a href="tel:855-95-32453" className="hover:text-white transition-colors">
                  (855) 95-EAGLE
                </a>
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Loan Programs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Calculators</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Resources</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Apply Now</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Compliance & Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.nmlsconsumeraccess.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  NMLS Consumer Access
                </a>
              </li>
              <li>
                <a
                  href="https://www.consumerfinance.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Consumer Financial Protection Bureau
                </a>
              </li>
              <li>
                <span className="text-gray-400">CFPB Complaints: (855) 411-2372</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="space-y-4 text-xs leading-relaxed">
            <div className="flex items-start space-x-4 mb-6">
              <svg className="h-12 w-12 flex-shrink-0 opacity-75" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="5" width="90" height="90" stroke="currentColor" strokeWidth="2.5" fill="none"/>
                <path d="M50 20 L75 45 L68 45 L68 70 L32 70 L32 45 L25 45 Z" fill="currentColor"/>
                <rect x="42" y="52" width="16" height="18" fill="rgb(31, 41, 55)"/>
                <line x1="20" y1="85" x2="80" y2="85" stroke="currentColor" strokeWidth="3"/>
              </svg>
              <div>
                <p className="text-white font-semibold mb-2">Equal Housing Opportunity</p>
                <p className="text-gray-400">
                  United Fidelity Funding Corp is committed to providing equal housing opportunities.
                  We do not discriminate on the basis of race, color, religion, national origin, sex,
                  handicap, familial status, or age in our lending practices.
                </p>
              </div>
            </div>

            <p className="text-white font-semibold">
              © {currentYear} United Fidelity Funding Corp. All rights reserved.
            </p>

            <p>
              <span className="text-white font-semibold">Corporate Information:</span> United Fidelity Funding Corp,
              NMLS #34381, operates as a licensed mortgage lender. Licensed in 39 states: {statesLicensed.join(', ')}.
            </p>

            <p>
              <span className="text-white font-semibold">Important Disclosures:</span> This is not an offer to enter
              into an agreement. Not all customers will qualify. Information, rates, and programs are subject to change
              without prior notice. All products are subject to credit and property approval. Not all products are available
              in all states or for all dollar amounts. Other restrictions and limitations may apply.
            </p>

            <p>
              <span className="text-white font-semibold">Licensing Information:</span> United Fidelity Funding Corp
              maintains active licenses in accordance with state and federal requirements. For detailed licensing
              information specific to your state, please visit{' '}
              <a
                href="https://www.nmlsconsumeraccess.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 underline"
              >
                NMLS Consumer Access
              </a>.
            </p>

            <p>
              <span className="text-white font-semibold">Consumer Protection:</span> United Fidelity Funding Corp complies
              with all federal regulations including the Truth in Lending Act (TILA), Real Estate Settlement Procedures Act
              (RESPA), Equal Credit Opportunity Act (ECOA), Fair Credit Reporting Act (FCRA), and the Dodd-Frank Act
              Ability-to-Repay Rule.
            </p>

            <p>
              <span className="text-white font-semibold">California:</span> Licensed by the Department of Financial Protection
              and Innovation under the California Residential Mortgage Lending Act. Loans made or arranged pursuant to a
              California Residential Mortgage Lending Act license.
            </p>

            <p>
              <span className="text-white font-semibold">Texas:</span> This loan is being made by a Supervised Mortgage Lender
              as defined by the Texas Finance Code and is subject to regulatory oversight by the Texas Department of Savings
              and Mortgage Lending.
            </p>

            <p>
              <span className="text-white font-semibold">Consumer Complaints:</span> If you have a complaint, first contact us at
              (855) 95-EAGLE. You may also contact the Consumer Financial Protection Bureau at{' '}
              <a
                href="https://www.consumerfinance.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 underline"
              >
                www.consumerfinance.gov
              </a>{' '}
              or (855) 411-2372.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
