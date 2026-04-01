const LICENSED_STATES = 'AL, AZ, AR, CA, CO, FL, GA, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI, MN, MS, MO, NE, NV, NH, NJ, NM, NC, ND, OH, OK, OR, PA, SC, SD, TN, TX, VA, WA, WI';

const LAST_UPDATED = 'April 1, 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-20 bg-white">
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 md:py-20">
        <div className="container-wide">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-300 max-w-3xl">
            This Privacy Policy explains how United Fidelity Funding Corp. ("UFF", "we", "us", or "our")
            collects, uses, shares, and protects personal information when you use our website and services.
          </p>
          <p className="text-sm text-gray-400 mt-4">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wide max-w-4xl space-y-10 text-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Who We Are</h2>
            <p>
              United Fidelity Funding Corp., NMLS #34381, is an independent mortgage banker licensed in the
              following states: {LICENSED_STATES}. Our principal office is 1300 NW Briarcliff Pkwy #275,
              Kansas City, MO 64116.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Information We Collect</h2>
            <p className="mb-3">We may collect the following categories of personal information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Identifiers and contact details (name, address, phone number, email).</li>
              <li>Loan and financial data (income, assets, debts, credit-related information).</li>
              <li>Property and transaction information for mortgage-related products and services.</li>
              <li>Government-issued identifiers where permitted or required by law.</li>
              <li>Internet and device activity (IP address, browser type, pages visited, cookies).</li>
              <li>Communications and support records.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">How We Use Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Process applications and provide mortgage products and related services.</li>
              <li>Verify identity, evaluate eligibility, underwrite, fund, and service loans.</li>
              <li>Communicate with you about your account, application, and requested services.</li>
              <li>Improve website performance, user experience, and fraud prevention controls.</li>
              <li>Comply with legal, regulatory, licensing, audit, and reporting obligations.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">How We Share Information</h2>
            <p className="mb-3">We may disclose personal information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Service providers and vendors that support operations and loan processing.</li>
              <li>Credit bureaus, investors, warehouse lenders, and settlement participants.</li>
              <li>Regulators, examiners, law enforcement, and agencies when required by law.</li>
              <li>Professional advisors and auditors under confidentiality obligations.</li>
              <li>Successors in connection with mergers, acquisitions, or asset transfers.</li>
            </ul>
            <p className="mt-3">
              We do not disclose nonpublic personal information except as permitted or required by applicable law.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Financial Privacy (GLBA) Notice</h2>
            <p>
              As a financial institution, we provide privacy notices and information-sharing practices consistent
              with the Gramm-Leach-Bliley Act (GLBA) and Regulation P. Where required, we provide initial and/or
              annual notices and honor applicable limitations on sharing nonpublic personal information.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Cookies and Online Tracking</h2>
            <p>
              We and our service providers may use cookies and similar technologies for authentication, analytics,
              security, and website functionality. You can control cookies through your browser settings, but some
              features may not function properly if cookies are disabled.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Data Security and Retention</h2>
            <p>
              We maintain administrative, technical, and physical safeguards designed to protect personal
              information, including safeguards consistent with applicable federal standards for financial
              institutions. We retain information only as long as reasonably necessary for business, legal,
              regulatory, and recordkeeping purposes.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Privacy Choices and Rights</h2>
            <p className="mb-3">
              Depending on where you live and subject to applicable law and exemptions, you may have rights to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access, correct, or delete certain personal information.</li>
              <li>Request portability of certain personal information.</li>
              <li>Opt out of certain data uses, including targeted advertising where applicable.</li>
              <li>Appeal a rights request decision where state law provides that right.</li>
              <li>Receive equal service and pricing without unlawful discrimination.</li>
            </ul>
            <p className="mt-3">
              Some information may be exempt from state privacy rights, including data processed under GLBA or
              retained to comply with legal and regulatory requirements.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">How to Exercise Rights</h2>
            <p>
              To submit a privacy request, call (855) 95-EAGLE or email{' '}
              <a href="mailto:compliance@uff.loans" className="text-brand-600 hover:text-brand-700 underline">
                compliance@uff.loans
              </a>.
              We may verify your identity before processing your request.
            </p>
            <p className="mt-3">
              You may also review consumer-rights resources from relevant regulators, including the{' '}
              <a
                href="https://oag.ca.gov/privacy/ccpa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:text-brand-700 underline"
              >
                California Attorney General (CCPA)
              </a>{' '}
              and the{' '}
              <a
                href="https://coag.gov/resources/colorado-privacy-act"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:text-brand-700 underline"
              >
                Colorado Attorney General (CPA)
              </a>.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Children's Privacy</h2>
            <p>
              Our services are not directed to children under 13, and we do not knowingly collect personal
              information from children under 13 through this website.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be posted on this page
              with a revised "Last updated" date.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Contact Us</h2>
            <p>
              United Fidelity Funding Corp.<br />
              1300 NW Briarcliff Pkwy #275, Kansas City, MO 64116<br />
              Phone: (855) 95-EAGLE<br />
              Email:{' '}
              <a href="mailto:compliance@uff.loans" className="text-brand-600 hover:text-brand-700 underline">
                compliance@uff.loans
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
