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

const stateLicenses = [
  { state: 'Alabama', license: 'Consumer Credit License #23184', tradeName: 'UFF Express' },
  { state: 'Arizona', license: 'Mortgage Banker License #BK-1027005', tradeName: 'UFF Express' },
  { state: 'Arkansas', license: 'Combination Mortgage Banker-Broker-Servicer License #43004', tradeName: 'UFF Express' },
  { state: 'California', license: 'DFPI Financing Law License #603J733', tradeName: 'UFF CORP.' },
  { state: 'Colorado', license: 'Mortgage Company Registration', tradeName: 'UFF Express' },
  { state: 'Florida', license: 'Mortgage Lender License #MLD506', tradeName: 'UFF Express; UFFC Mortgage' },
  { state: 'Georgia', license: 'Mortgage Lender License #66436', tradeName: 'UFF Express' },
  { state: 'Idaho', license: 'Mortgage Broker/Lender License #MBL-2080034381', tradeName: 'UFF; UFF Express; UFF West; UFFC Mortgage' },
  { state: 'Illinois', license: 'Residential Mortgage License #MB.6760568', tradeName: 'UFF Express' },
  { state: 'Indiana', license: 'Mortgage Lending License (DFI) #11139', tradeName: 'UFF Express' },
  { state: 'Iowa', license: 'Mortgage Banker License #2008-0093' },
  { state: 'Kansas', license: 'Mortgage Company License #MC.0025426', tradeName: 'UFF Express; UFFC Mortgage; United Fidelity Funding' },
  { state: 'Kentucky', license: 'Mortgage Company License #MC23287' },
  { state: 'Louisiana', license: 'Residential Mortgage Lending License' },
  { state: 'Maine', license: 'Supervised Lender License #34381' },
  { state: 'Maryland', license: 'Mortgage Lender License #34381' },
  { state: 'Massachusetts', license: 'Mortgage Lender License #ML34381', tradeName: 'UFF Express' },
  { state: 'Michigan', license: '1st Mortgage Broker/Lender/Servicer Registrant #FR0020432' },
  { state: 'Minnesota', license: 'Residential Mortgage Originator License #MN-MO-40134678' },
  { state: 'Mississippi', license: 'Mortgage Lender License #34381' },
  { state: 'Missouri', license: 'Mortgage Company License #34381', tradeName: 'UFF Express; United Fidelity Funding' },
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
            <p className="text-white font-semibold text-sm mb-1">Equal Housing Lender</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              It is the policy of United Fidelity Funding Corp. to treat all consumers and prospective consumers
              consistently and equally without regard to race, color, religion, national origin, sex, marital status,
              age (provided the applicant has the capacity to enter into a binding contract), receipt of income from
              any public assistance program, familial status, disability, or the exercise of any right under the
              Consumer Credit Protection Act. United Fidelity Funding Corp. complies with all applicable fair lending
              laws and regulations, including the Equal Credit Opportunity Act (ECOA) and the Fair Housing Act (FHA).
            </p>
          </div>
        </div>

        <div className="text-xs leading-relaxed space-y-3 text-gray-500">
          <p className="text-gray-300 font-semibold">
            &copy; {new Date().getFullYear()} United Fidelity Funding Corp. All rights reserved.
          </p>

          <p>
            <span className="text-gray-300 font-semibold">Corporate Information:</span> United Fidelity Funding Corp.,
            NMLS #34381. Principal office: 1300 NW Briarcliff Pkwy #275, Kansas City, MO 64116. Phone: (855) 95-EAGLE.
            For licensing information, go to{' '}
            <a
              href="https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/34381"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 underline"
            >
              www.nmlsconsumeraccess.org
            </a>.
            Not all products are available in all states. A United Fidelity Funding Corp. loan originator may only
            originate mortgage loans on real property located in a state where both the company and the originator
            are licensed to transact mortgage business.
          </p>

          <p>
            <span className="text-gray-300 font-semibold">Important Disclosures:</span> This is not a commitment to lend
            or an offer to enter into an agreement. Not all customers will qualify. Rates, terms, programs, information,
            and conditions are subject to change without notice. All loan programs are subject to borrower and property
            qualifications, including credit, income, property appraisal, and other applicable criteria. Not all products
            are available in all states or for all dollar amounts. Monthly payment estimates include principal, interest,
            estimated taxes, and estimated homeowner's insurance. Actual amounts may differ. PMI may be required for down
            payments below 20%. While refinancing may reduce your monthly payment, total finance charges may be higher
            over the life of the loan. Other restrictions and limitations may apply.
          </p>

          <p>
            <span className="text-gray-300 font-semibold">Consumer Protection:</span> United Fidelity Funding Corp.
            complies with all applicable federal regulations including the Truth in Lending Act (TILA), Real Estate
            Settlement Procedures Act (RESPA), Equal Credit Opportunity Act (ECOA), Fair Credit Reporting Act (FCRA),
            Home Mortgage Disclosure Act (HMDA), and the Dodd-Frank Act Ability-to-Repay/Qualified Mortgage Rule.
            This is not a government agency.
          </p>

          <hr className="border-gray-800 my-4" />

          <p className="text-gray-300 font-semibold">State-Specific Disclosures</p>

          <p>
            <span className="text-gray-300 font-semibold">California:</span> Licensed by the Department of Financial
            Protection and Innovation (DFPI) under the California Financing Law, License #603J733. Loans made or
            arranged pursuant to a California Financing Law license.
          </p>

          <p>
            <span className="text-gray-300 font-semibold">Colorado:</span> United Fidelity Funding Corp., Mortgage
            Company Registration, NMLS #34381. Regulated by the Division of Real Estate.
          </p>

          <p>
            <span className="text-gray-300 font-semibold">Georgia:</span> Georgia Residential Mortgage Licensee,
            License #66436. Licensed by the Georgia Department of Banking and Finance.
          </p>

          <p>
            <span className="text-gray-300 font-semibold">Illinois:</span> Illinois Residential Mortgage License
            #MB.6760568. For licensing information, go to{' '}
            <a
              href="https://www.nmlsconsumeraccess.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 underline"
            >
              www.nmlsconsumeraccess.org
            </a>.
          </p>

          <p>
            <span className="text-gray-300 font-semibold">Kansas:</span> Licensed Mortgage Company, License
            #MC.0025426. Licensed by the Kansas Office of the State Bank Commissioner.
          </p>

          <div>
            <p className="mb-2">
              <span className="text-gray-300 font-semibold">Texas:</span> United Fidelity Funding Corp., NMLS #34381.
              1300 NW Briarcliff Pkwy #275, Kansas City, MO 64116.
            </p>
            <p className="uppercase mb-2">
              CONSUMERS WISHING TO FILE A COMPLAINT AGAINST A COMPANY OR A RESIDENTIAL MORTGAGE LOAN ORIGINATOR SHOULD
              COMPLETE AND SEND A COMPLAINT FORM TO THE TEXAS DEPARTMENT OF SAVINGS AND MORTGAGE LENDING, 2601 NORTH
              LAMAR, SUITE 201, AUSTIN, TEXAS 78705. COMPLAINT FORMS AND INSTRUCTIONS MAY BE OBTAINED FROM THE
              DEPARTMENT'S WEBSITE AT{' '}
              <a
                href="https://www.sml.texas.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 underline"
              >
                WWW.SML.TEXAS.GOV
              </a>.
              A TOLL-FREE CONSUMER HOTLINE IS AVAILABLE AT 1-877-276-5550.
            </p>
            <p className="uppercase">
              THE DEPARTMENT MAINTAINS A RECOVERY FUND TO MAKE PAYMENTS OF CERTAIN ACTUAL OUT OF POCKET DAMAGES
              SUSTAINED BY BORROWERS CAUSED BY ACTS OF LICENSED RESIDENTIAL MORTGAGE LOAN ORIGINATORS. A WRITTEN
              APPLICATION FOR REIMBURSEMENT FROM THE RECOVERY FUND MUST BE FILED WITH AND INVESTIGATED BY THE
              DEPARTMENT PRIOR TO THE PAYMENT OF A CLAIM. FOR MORE INFORMATION ABOUT THE RECOVERY FUND, PLEASE
              CONSULT THE DEPARTMENT'S WEBSITE AT{' '}
              <a
                href="https://www.sml.texas.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 underline"
              >
                WWW.SML.TEXAS.GOV
              </a>.
            </p>
          </div>

          <p>
            <span className="text-gray-300 font-semibold">Washington:</span> United Fidelity Funding Corp. d/b/a
            UFF West Funding Corp. Consumer Loan Company License #CL-34381. Licensed by the Washington Department
            of Financial Institutions.
          </p>

          <hr className="border-gray-800 my-4" />

          <p>
            <span className="text-gray-300 font-semibold">State Licensing ({stateLicenses.length} states):</span> United
            Fidelity Funding Corp., NMLS #34381, is licensed in the following states:{' '}
            {stateLicenses.map((s, i) => (
              <span key={s.state}>
                <span className="text-gray-400">{s.state}</span>{' '}
                <span className="text-gray-600">({s.license})</span>
                {i < stateLicenses.length - 1 ? '; ' : '.'}
              </span>
            ))}
          </p>

          <p>
            <span className="text-gray-300 font-semibold">Consumer Complaints:</span> If you have a complaint, first
            contact United Fidelity Funding Corp. at (855) 95-EAGLE or{' '}
            <a
              href="mailto:compliance@unitedfidelityfunding.com"
              className="text-brand-400 hover:text-brand-300 underline"
            >
              compliance@unitedfidelityfunding.com
            </a>.
            You may also contact the Consumer Financial Protection Bureau at{' '}
            <a
              href="https://www.consumerfinance.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 underline"
            >
              www.consumerfinance.gov
            </a>{' '}
            or (855) 411-2372, or your state's regulatory agency. For state-specific licensing and regulatory
            information, visit{' '}
            <a
              href="https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/34381"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 underline"
            >
              NMLS Consumer Access
            </a>.
          </p>

          <p>
            Mortgage rates shown are for illustrative purposes only and may not reflect current market conditions.
            Your actual rate will depend on your specific financial situation, credit profile, property details, and
            other factors. APR and payment examples are estimates and may vary. Contact us for a personalized quote.
          </p>
        </div>
      </div>
    </footer>
  );
}
