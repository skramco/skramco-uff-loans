import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

const footerLinks = {
  'Mortgage': [
    { label: 'Buy a Home', href: '/buy' },
    { label: 'Refinance', href: '/refinance' },
    { label: 'Home Equity', href: '/equity' },
    { label: 'Current Rates', href: '/rates' },
    { label: 'Calculators', href: '/calculators' },
  ],
  'Company': [
    { label: 'About Us', href: '/about' },
    { label: 'Reviews', href: '/reviews' },
    { label: 'Contact', href: '/contact' },
    { label: 'Careers', href: '/about' },
  ],
  'Resources': [
    { label: 'Learning Center', href: '/learn' },
    { label: 'Mortgage Glossary', href: '/learn' },
    { label: 'FAQ', href: '/learn' },
    { label: 'Blog', href: '/learn' },
  ],
  'Legal': [
    { label: 'Privacy Policy', href: '/about' },
    { label: 'Terms of Use', href: '/about' },
    { label: 'Licensing', href: '/about' },
    { label: 'NMLS Consumer Access', href: 'https://www.nmlsconsumeraccess.org', external: true },
  ],
};

const statesLicensed = [
  'Alabama', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Florida', 'Georgia',
  'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
  'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'North Carolina',
  'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Virginia', 'Washington', 'Wisconsin',
];

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="container-wide py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6">
          <div className="col-span-2">
            <div className="mb-4">
              <img src="/uff_logo_darkbg.svg" alt="United Fidelity Funding Corp." className="h-10 w-auto" />
            </div>
            <p className="text-sm leading-relaxed mb-4 max-w-xs">
              Unwavering commitment to excellence in mortgage lending.
            </p>
            <p className="text-white font-semibold text-sm mb-2">NMLS #34381</p>
            <div className="space-y-2 text-sm">
              <a href="tel:855-95-32453" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-brand-400" />
                (855) 95-EAGLE
              </a>
              <a href="mailto:info@unitedfidelityfunding.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-brand-400" />
                info@unitedfidelityfunding.com
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-400 mt-0.5" />
                <span>1300 NW Briarcliff Pkwy #275<br />Kansas City, MO 64116</span>
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white font-semibold text-sm mb-4">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="border-gray-800 my-10" />

        <div className="flex items-start gap-4 mb-8">
          <svg className="h-12 w-12 flex-shrink-0 opacity-75" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="5" width="90" height="90" stroke="currentColor" strokeWidth="2.5" fill="none"/>
            <path d="M50 20 L75 45 L68 45 L68 70 L32 70 L32 45 L25 45 Z" fill="currentColor"/>
            <rect x="42" y="52" width="16" height="18" fill="rgb(3, 7, 18)"/>
            <line x1="20" y1="85" x2="80" y2="85" stroke="currentColor" strokeWidth="3"/>
          </svg>
          <div>
            <p className="text-white font-semibold text-sm mb-1">Equal Housing Opportunity</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              United Fidelity Funding Corp is committed to providing equal housing opportunities.
              We do not discriminate on the basis of race, color, religion, national origin, sex,
              handicap, familial status, or age in our lending practices.
            </p>
          </div>
        </div>

        <div className="text-xs leading-relaxed space-y-3 text-gray-500">
          <p className="text-gray-300 font-semibold">
            &copy; {new Date().getFullYear()} United Fidelity Funding Corp. All rights reserved.
          </p>

          <p>
            <span className="text-gray-300 font-semibold">Corporate Information:</span> United Fidelity Funding Corp,
            NMLS #34381, operates as a licensed mortgage lender. Licensed in {statesLicensed.length} states: {statesLicensed.join(', ')}.
          </p>

          <p>
            <span className="text-gray-300 font-semibold">Important Disclosures:</span> This is not an offer to enter
            into an agreement. Not all customers will qualify. Information, rates, and programs are subject to change
            without prior notice. All products are subject to credit and property approval. Not all products are available
            in all states or for all dollar amounts. Other restrictions and limitations may apply.
          </p>

          <p>
            <span className="text-gray-300 font-semibold">Licensing Information:</span> United Fidelity Funding Corp
            maintains active licenses in accordance with state and federal requirements. For detailed licensing
            information specific to your state, please visit{' '}
            <a
              href="https://www.nmlsconsumeraccess.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 underline"
            >
              NMLS Consumer Access
            </a>.
          </p>

          <p>
            <span className="text-gray-300 font-semibold">Consumer Protection:</span> United Fidelity Funding Corp complies
            with all federal regulations including the Truth in Lending Act (TILA), Real Estate Settlement Procedures Act
            (RESPA), Equal Credit Opportunity Act (ECOA), Fair Credit Reporting Act (FCRA), and the Dodd-Frank Act
            Ability-to-Repay Rule.
          </p>

          <p>
            <span className="text-gray-300 font-semibold">California:</span> Licensed by the Department of Financial Protection
            and Innovation under the California Residential Mortgage Lending Act. Loans made or arranged pursuant to a
            California Residential Mortgage Lending Act license.
          </p>

          <p>
            <span className="text-gray-300 font-semibold">Texas:</span> This loan is being made by a Supervised Mortgage Lender
            as defined by the Texas Finance Code and is subject to regulatory oversight by the Texas Department of Savings
            and Mortgage Lending.
          </p>

          <p>
            <span className="text-gray-300 font-semibold">Consumer Complaints:</span> If you have a complaint, first contact us at
            (855) 95-EAGLE. You may also contact the Consumer Financial Protection Bureau at{' '}
            <a
              href="https://www.consumerfinance.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 underline"
            >
              www.consumerfinance.gov
            </a>{' '}
            or (855) 411-2372.
          </p>

          <p>
            Mortgage rates shown are for illustrative purposes only and may not reflect current market conditions.
            Your actual rate will depend on your specific financial situation, credit profile, property details, and other factors.
            APR and payment examples are estimates and may vary. Contact us for a personalized quote.
          </p>
        </div>
      </div>
    </footer>
  );
}
