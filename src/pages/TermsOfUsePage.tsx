const LAST_UPDATED = 'April 1, 2026';

export default function TermsOfUsePage() {
  return (
    <div className="pt-20 bg-white">
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 md:py-20">
        <div className="container-wide">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Terms of Use</h1>
          <p className="text-lg text-gray-300 max-w-3xl">
            These Terms of Use govern your access to and use of this website and related online services provided
            by United Fidelity Funding Corp. ("UFF", "we", "us", or "our").
          </p>
          <p className="text-sm text-gray-400 mt-4">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wide max-w-4xl space-y-10 text-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Acceptance of Terms</h2>
            <p>
              By accessing or using this website, you agree to be bound by these Terms of Use and our Privacy
              Policy. If you do not agree, do not use this website.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Eligibility and Permitted Use</h2>
            <p>
              You may use this website only for lawful purposes related to evaluating or obtaining mortgage-related
              products and services. You agree not to use the website in any way that could disable, damage, or
              impair the site or interfere with any other party's use.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No Loan Commitment; Informational Content</h2>
            <p>
              Content, tools, calculators, and examples are provided for informational purposes only and are not a
              commitment to lend, extension of credit, or guarantee of rates, terms, approval, or eligibility.
              All mortgage products are subject to underwriting, borrower and property qualifications, and
              applicable law.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Rates, Terms, and Availability</h2>
            <p>
              Rates, APRs, fees, programs, and product availability may change without notice and may vary based on
              credit profile, loan scenario, property type, occupancy, and state licensing restrictions. Not all
              products are available in all states.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Account Credentials and Security</h2>
            <p>
              If you create an account or receive portal credentials, you are responsible for maintaining
              confidentiality and for all activity under your credentials. Notify us promptly of any unauthorized
              access or suspected security incident.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Electronic Communications and E-Sign Consent</h2>
            <p>
              By providing an email address or using electronic workflows, you consent to receive communications
              electronically, subject to applicable law, including the Electronic Signatures in Global and National
              Commerce Act (E-SIGN). Where required, additional disclosures and consent steps will be provided
              before electronic records replace paper copies.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Intellectual Property</h2>
            <p>
              This website and its contents (including text, graphics, logos, design, and software) are owned by
              UFF or its licensors and protected by applicable intellectual property laws. You may not copy,
              reproduce, modify, distribute, or create derivative works without prior written permission, except as
              otherwise permitted by law.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Third-Party Sites and Services</h2>
            <p>
              This website may contain links to third-party sites (including regulatory resources). We do not
              control and are not responsible for third-party content, policies, security, or practices.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Disclaimer of Warranties</h2>
            <p>
              This website is provided on an "as is" and "as available" basis. To the fullest extent permitted by
              law, UFF disclaims all warranties, express or implied, including merchantability, fitness for a
              particular purpose, and non-infringement.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, UFF and its affiliates, officers, employees, and agents will
              not be liable for indirect, incidental, special, consequential, or punitive damages, or for loss of
              profits, revenue, data, or use arising out of or related to your use of this website.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless UFF and its affiliates from claims, liabilities,
              losses, and expenses (including reasonable attorneys' fees) arising out of your misuse of this
              website or your violation of these Terms of Use.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Regulatory and Licensing Disclosures</h2>
            <p>
              UFF is a licensed mortgage lender, NMLS #34381. For company licensing details and public record
              information, visit{' '}
              <a
                href="https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/34381"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:text-brand-700 underline"
              >
                NMLS Consumer Access
              </a>.
              State-specific disclosures and notices are incorporated as part of these Terms where required by law.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Governing Law</h2>
            <p>
              Except where preempted or otherwise required by federal or state law, these Terms of Use are governed
              by the laws of the State of Missouri, without regard to conflict-of-law principles.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Changes to These Terms</h2>
            <p>
              We may revise these Terms of Use at any time by posting an updated version on this page and updating
              the "Last updated" date. Continued use of the website after changes are posted constitutes acceptance
              of the revised Terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Contact Information</h2>
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
