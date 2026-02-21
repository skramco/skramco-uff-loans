/**
 * Compact compliance footer for pages that don't use the full PublicLayout Footer.
 * Used on /start, /login, /register, /apply, /dashboard, etc.
 * Contains all required multi-state mortgage banker disclosures in a condensed format.
 */
export default function ComplianceFooter({ className = '' }: { className?: string }) {
  return (
    <div className={`border-t border-gray-200 bg-gray-50/80 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        <div className="text-[10px] leading-relaxed text-gray-400 space-y-2.5">
          <p>
            United Fidelity Funding Corp., NMLS #34381. Principal office: 1300 NW Briarcliff Pkwy #275,
            Kansas City, MO 64116. Phone: (855) 95-EAGLE. For licensing information, go to{' '}
            <a
              href="https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/34381"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-500"
            >
              www.nmlsconsumeraccess.org
            </a>.
          </p>

          <p>
            This is not a commitment to lend or an offer to enter into an agreement. Not all customers will
            qualify. Rates, terms, programs, and conditions are subject to change without notice. All loan
            programs are subject to borrower and property qualifications, including credit, income, property
            appraisal, and other applicable criteria. Not all products are available in all states or for all
            dollar amounts. Monthly payment estimates include principal, interest, estimated taxes, and estimated
            homeowner's insurance. Actual amounts may differ. PMI may be required for down payments below 20%.
          </p>

          <p>
            <span className="font-medium text-gray-500">California:</span> Licensed by the Department of
            Financial Protection and Innovation (DFPI) under the California Financing Law, License #603J733.
            Loans made or arranged pursuant to a California Financing Law license.{' '}
            <span className="font-medium text-gray-500">Colorado:</span> Mortgage Company Registration,
            NMLS #34381. Regulated by the Division of Real Estate.
          </p>

          <p className="uppercase">
            <span className="normal-case font-medium text-gray-500">Texas:</span>{' '}
            CONSUMERS WISHING TO FILE A COMPLAINT AGAINST A COMPANY OR A RESIDENTIAL MORTGAGE LOAN ORIGINATOR
            SHOULD COMPLETE AND SEND A COMPLAINT FORM TO THE TEXAS DEPARTMENT OF SAVINGS AND MORTGAGE LENDING,
            2601 NORTH LAMAR, SUITE 201, AUSTIN, TEXAS 78705. COMPLAINT FORMS AND INSTRUCTIONS MAY BE OBTAINED
            FROM THE DEPARTMENT'S WEBSITE AT{' '}
            <a
              href="https://www.sml.texas.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-500"
            >
              WWW.SML.TEXAS.GOV
            </a>.
            A TOLL-FREE CONSUMER HOTLINE IS AVAILABLE AT 1-877-276-5550. THE DEPARTMENT MAINTAINS A RECOVERY
            FUND TO MAKE PAYMENTS OF CERTAIN ACTUAL OUT OF POCKET DAMAGES SUSTAINED BY BORROWERS CAUSED BY ACTS
            OF LICENSED RESIDENTIAL MORTGAGE LOAN ORIGINATORS. A WRITTEN APPLICATION FOR REIMBURSEMENT FROM THE
            RECOVERY FUND MUST BE FILED WITH AND INVESTIGATED BY THE DEPARTMENT PRIOR TO THE PAYMENT OF A CLAIM.
            FOR MORE INFORMATION ABOUT THE RECOVERY FUND, PLEASE CONSULT THE DEPARTMENT'S WEBSITE AT{' '}
            <a
              href="https://www.sml.texas.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-500"
            >
              WWW.SML.TEXAS.GOV
            </a>.
          </p>

          <p>
            Licensed in 39 states: AL, AZ, AR, CA, CO, FL, GA, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI,
            MN, MS, MO, NE, NV, NH, NJ, NM, NC, ND, OH, OK, OR, PA, SC, SD, TN, TX, VA, WA, WI. For
            state-specific licensing details, visit{' '}
            <a
              href="https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/34381"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-500"
            >
              NMLS Consumer Access
            </a>.
          </p>

          <p>
            Equal Housing Lender. This is not a government agency. United Fidelity Funding Corp. complies with
            all applicable fair lending laws including the Equal Credit Opportunity Act (ECOA) and the Fair
            Housing Act (FHA).
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-400">
          <span>&copy; {new Date().getFullYear()} United Fidelity Funding Corp. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="/about" className="hover:text-gray-500 underline">Privacy Policy</a>
            <a href="/about" className="hover:text-gray-500 underline">Terms of Use</a>
            <a
              href="https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/34381"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-500 underline"
            >
              Licensing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
