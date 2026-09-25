import LegalLayout from './LegalLayout';

export default function TermsPage() {
  const toc = [
    { id: 'acceptance', label: '1. Acceptance of Terms' },
    { id: 'purpose', label: '2. Educational & Informational Purpose' },
    { id: 'calculators-limitations', label: '3. Engineering Calculators & Calculation Limitations' },
    { id: 'user-responsibilities', label: '4. User Responsibilities & Verification' },
    { id: 'no-guarantee', label: '5. No Professional Engineering Guarantee' },
    { id: 'intellectual-property', label: '6. Intellectual Property & Copyright' },
    { id: 'acceptable-use', label: '7. Acceptable Use & Prohibited Activities' },
    { id: 'external-links', label: '8. External Links & Third-Party Content' },
    { id: 'advertising', label: '9. Advertising & Third-Party Vendors' },
    { id: 'limitation-liability', label: '10. Limitation of Liability & Indemnity' },
    { id: 'modifications', label: '11. Changes to Website & Terms' },
    { id: 'governing-law', label: '12. Governing Law & Dispute Resolution' },
    { id: 'contact-terms', label: '13. Contact Information' },
  ];

  return (
    <LegalLayout
      title="Terms & Conditions"
      badge="CivilMath Legal & Trust"
      lastUpdated="September 2026"
      summary="These Terms govern your use of the CivilMath website, calculators, formulas, and technical guides. By using this service, you acknowledge that all tools are provided solely for educational reference and preliminary estimation, and do not constitute certified engineering advice or signed construction documents. Independent verification by a licensed Professional Engineer (PE/CEng) is required for all construction projects."
      toc={toc}
    >
      {/* 1. Acceptance */}
      <section id="acceptance" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          1. Acceptance of Terms
        </h2>
        <p>
          Welcome to CivilMath (<a href="https://civilmath.com" className="text-[#657565] dark:text-[#9FB19F] underline">civilmath.com</a>). By browsing, accessing, or using any calculator, tool, table, guide, or content provided on this website, you confirm that you have read, understood, and agreed to be legally bound by these Terms and Conditions ("Terms"), as well as our <a href="/privacy" className="text-[#657565] dark:text-[#9FB19F] underline">Privacy Policy</a> and <a href="/disclaimer" className="text-[#657565] dark:text-[#9FB19F] underline">Disclaimer</a>.
        </p>
        <p>
          If you do not agree with any part of these Terms, you must immediately discontinue your use of CivilMath.
        </p>
      </section>

      {/* 2. Educational & Informational Purpose */}
      <section id="purpose" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          2. Educational &amp; Informational Purpose
        </h2>
        <p>
          CivilMath is designed and operated as an educational and technical reference resource. Its primary purpose is to make civil engineering theory, practical site methods, bar bending concepts, structural analysis formulas, and quantity estimation principles easier to understand and apply.
        </p>
        <p>
          The tools, formulas, diagrams, and numerical models available on CivilMath are intended to support academic study, preliminary sizing, rough order-of-magnitude planning, and independent verification. They are <strong>not</strong> intended for direct, unverified execution on construction sites or for submittal as stamped building permit designs.
        </p>
      </section>

      {/* 3. Engineering Calculators & Limitations */}
      <section id="calculators-limitations" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          3. Civil Engineering Calculators &amp; Calculation Limitations
        </h2>
        <p>
          While we strive for high precision and adhere to recognized technical literature and codes (such as ACI 318, Eurocode 2, IS 456, and BS 8666), engineering calculations inherently rely on assumptions that may not match your specific site condition:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li>
            <strong>Nominal Methods &amp; Material Assumptions:</strong> Concrete densities, rebar unit weights, mortar bulking factors, and soil friction angles embedded as defaults in our calculators represent nominal or standard values. Actual materials procured on site may vary in density, moisture content, yield strength, or aggregate grading.
          </li>
          <li>
            <strong>Empirical Formulas:</strong> Certain geotechnical formulas (e.g., Terzaghi, Meyerhof, Hansen bearing capacity) and structural deflection estimates are empirical approximations governed by boundary conditions and specific safety factors.
          </li>
          <li>
            <strong>Numerical Rounding:</strong> Digital computation involves floating-point arithmetic and display rounding (e.g., rounding rebar counts to integer numbers or rounding concrete volume to two decimal places). Users must account for construction tolerances, cut wastage, and lap length minimums.
          </li>
        </ul>
      </section>

      {/* 4. User Responsibilities */}
      <section id="user-responsibilities" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          4. User Responsibilities &amp; Independent Verification
        </h2>
        <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#657565] dark:text-[#9FB19F] font-mono">
            Professional Verification Requirement
          </h4>
          <p className="text-xs leading-relaxed m-0">
            You, as the user or practicing professional, bear sole responsibility for verifying any output, dimension, reinforcement tonnage, or concrete quantity obtained from CivilMath prior to material procurement, fabrication, or concrete casting.
          </p>
        </div>
        <p className="mt-2">
          When using CivilMath, you agree that you will:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li>Ensure all input dimensions, load values, soil properties, and units (metric vs. imperial) match your project drawings and geotechnical investigation reports.</li>
          <li>Verify calculations against current local building regulations, municipal bylaws, and applicable design codes.</li>
          <li>Account for field tolerances, construction joints, thermal expansion, bar lap requirements, and actual site wastage.</li>
          <li>Obtain formal review, stamping, and certification by a licensed Professional Engineer (PE) or Chartered Engineer (CEng) where required by law.</li>
        </ul>
      </section>

      {/* 5. No Professional Guarantee */}
      <section id="no-guarantee" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          5. No Professional Engineering Guarantee
        </h2>
        <p>
          CivilMath does not offer professional engineering consulting, architectural design, surveying certification, or quantity surveying advisory services through this website.
        </p>
        <p>
          No engineer-client, confidential, or fiduciary relationship is established between you and CivilMath, its creators, or contributors by virtue of using this website or exchanging emails with our team.
        </p>
      </section>

      {/* 6. Intellectual Property */}
      <section id="intellectual-property" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          6. Intellectual Property &amp; Copyright
        </h2>
        <p>
          All content on CivilMath—including but not limited to calculator user interfaces, visual charts, source code, interactive widgets, brand graphics, editorial articles, and documentation—is the property of CivilMath or its content creators and is protected by international copyright, trademark, and intellectual property laws.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li>
            <strong>Permitted Use:</strong> You are granted a personal, non-exclusive, non-transferable license to access CivilMath, use calculators for project computations, and export PDF/Excel schedules for your personal or professional engineering practice.
          </li>
          <li>
            <strong>Restricted Use:</strong> You may not scrape, frame, mirror, reverse engineer, decompile, or republish CivilMath calculators or substantial text excerpts without prior written permission from CivilMath.
          </li>
          <li>
            <strong>Standards Attribution:</strong> References to engineering codes (e.g., ACI, ASTM, BS, ISO, Eurocode) are made strictly for educational identification and attribution purposes. All respective code trademarks belong to their respective standard-setting organizations.
          </li>
        </ul>
      </section>

      {/* 7. Acceptable Use */}
      <section id="acceptable-use" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          7. Acceptable Use &amp; Prohibited Activities
        </h2>
        <p>
          You agree to use CivilMath only for lawful purposes in accordance with these Terms. You agree not to:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li>Engage in automated crawling, scraping, or data extraction that imposes unreasonable load on our servers.</li>
          <li>Attempt to bypass rate limiting, security controls, or authentication barriers on administrative routes.</li>
          <li>Transmit malicious code, viruses, trojans, or automated scripts.</li>
          <li>Misrepresent yourself or falsely claim an affiliation with CivilMath.</li>
          <li>Use CivilMath outputs as an unverified foundation for life-critical or hazardous civil works without certified engineer approval.</li>
        </ul>
      </section>

      {/* 8. External Links */}
      <section id="external-links" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          8. External Links &amp; Third-Party Services
        </h2>
        <p>
          CivilMath may contain links to third-party websites, engineering documentation, technical databases, or partner services. These links are provided solely as a convenience to our readers.
        </p>
        <p>
          We do not endorse, guarantee, or assume responsibility for the accuracy, legality, or practices of any external website. Accessing third-party sites is at your own risk.
        </p>
      </section>

      {/* 9. Advertising */}
      <section id="advertising" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          9. Advertising &amp; Third-Party Vendors
        </h2>
        <p>
          CivilMath may display advertising provided by third-party advertising partners, including Google AdSense. Advertising enables us to maintain and develop free engineering tools.
        </p>
        <p>
          Advertisements are clearly separated from our calculation workspaces and editorial guides. The presence of an advertisement does not constitute an endorsement by CivilMath of the advertised construction product, engineering software, or service.
        </p>
      </section>

      {/* 10. Limitation of Liability */}
      <section id="limitation-liability" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          10. Limitation of Liability &amp; Indemnity
        </h2>
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs sm:text-sm space-y-2">
          <p className="font-bold m-0 uppercase font-mono text-[11px] tracking-wider">
            Disclaimer of Warranties &amp; Damages
          </p>
          <p className="m-0 leading-relaxed">
            TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, CIVILMATH, ITS AUTHORS, DEVELOPERS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES (INCLUDING LOSS OF PROFITS, PROJECT DELAYS, CONSTRUCTION REWORK, MATERIAL DEFICITS, STRUCTURAL DEFICIENCIES, OR PERSONAL INJURY) ARISING OUT OF OR IN CONNECTION WITH YOUR ACCESS TO OR USE OF—OR INABILITY TO USE—THIS WEBSITE, CALCULATORS, OR CONTENT.
          </p>
        </div>
        <p className="text-xs sm:text-sm mt-3">
          All tools, calculators, and articles are provided on an <strong>"as is"</strong> and <strong>"as available"</strong> basis, without warranties of any kind, whether express, statutory, or implied, including warranties of merchantability, fitness for a particular civil engineering purpose, or non-infringement.
        </p>
        <p className="text-xs sm:text-sm">
          You agree to indemnify, defend, and hold harmless CivilMath and its operators from any claims, liabilities, damages, and expenses (including reasonable legal fees) resulting from your violation of these Terms or your use of calculator outputs on unverified construction works.
        </p>
      </section>

      {/* 11. Changes to Website & Terms */}
      <section id="modifications" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          11. Changes to the Website &amp; Terms
        </h2>
        <p>
          We reserve the right to modify, update, enhance, or discontinue any calculator, article, or feature of CivilMath at any time without prior notice.
        </p>
        <p>
          We may also update these Terms periodically. Any modifications become effective immediately upon posting. Your continued use of CivilMath following the posting of revised Terms signifies your acceptance of those updates.
        </p>
      </section>

      {/* 12. Governing Law */}
      <section id="governing-law" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          12. Governing Law &amp; Jurisdiction
        </h2>
        <p>
          These Terms and any disputes arising out of or related to your use of CivilMath shall be governed by and construed in accordance with the applicable laws, without giving effect to any conflict of law principles.
        </p>
        <p>
          Any legal action or proceeding arising under these Terms shall be brought exclusively before the courts of competent jurisdiction.
        </p>
      </section>

      {/* 13. Contact Information */}
      <section id="contact-terms" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          13. Contact Information
        </h2>
        <p>
          For inquiries regarding these Terms and Conditions or licensing permissions, please contact our team:
        </p>
        <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] space-y-1 font-mono text-xs">
          <div><strong>Platform:</strong> CivilMath (<a href="https://civilmath.com" className="text-[#657565] underline">civilmath.com</a>)</div>
          <div><strong>Email:</strong> <a href="mailto:support@civilmath.com" className="text-[#657565] underline">support@civilmath.com</a></div>
          <div><strong>Support Desk:</strong> <a href="/contact" className="text-[#657565] underline font-sans">civilmath.com/contact</a></div>
        </div>
      </section>
    </LegalLayout>
  );
}
