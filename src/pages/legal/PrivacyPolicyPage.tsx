import LegalLayout from './LegalLayout';

export default function PrivacyPolicyPage() {
  const toc = [
    { id: 'about-civilmath', label: '1. What CivilMath Is' },
    { id: 'information-collected', label: '2. Information We Collect' },
    { id: 'local-storage', label: '3. Browser Local Storage & Offline Privacy' },
    { id: 'cookies-analytics', label: '4. Cookies & Analytics Services' },
    { id: 'google-adsense', label: '5. Google AdSense & Third-Party Advertising' },
    { id: 'managing-ads', label: '6. Opting Out of Personalized Advertising' },
    { id: 'third-party-links', label: '7. External Engineering Links' },
    { id: 'data-security', label: '8. Data Security & Storage' },
    { id: 'data-retention', label: '9. Data Retention' },
    { id: 'user-rights', label: '10. Your Privacy Rights (GDPR / CCPA)' },
    { id: 'children-privacy', label: '11. Children’s Privacy' },
    { id: 'policy-changes', label: '12. Updates to This Policy' },
    { id: 'contact-privacy', label: '13. Privacy Contact Information' },
  ];

  return (
    <LegalLayout
      title="Privacy Policy"
      badge="CivilMath Legal & Trust"
      lastUpdated="September 2026"
      summary="CivilMath is designed with privacy-first engineering principles. Your structural calculations and project parameters are processed client-side and saved strictly in your browser's Local Storage. We never sell your personal information. This policy clearly explains our minimal data collection, use of Google Analytics, Google AdSense disclosures, and how you control your privacy."
      toc={toc}
    >
      {/* 1. What CivilMath Is */}
      <section id="about-civilmath" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          1. What CivilMath Is
        </h2>
        <p>
          CivilMath (<a href="https://civilmath.com" className="text-[#657565] dark:text-[#9FB19F] underline">civilmath.com</a>) is an independent civil engineering knowledge and calculation platform. We provide interactive calculators, structural analysis tools, concrete mix calculators, bar bending schedules (BBS), surveying algorithms, formulas, and technical articles to assist civil engineers, site managers, estimators, and engineering students worldwide.
        </p>
        <p>
          We are committed to operating transparently, safeguarding visitor privacy, and collecting only the minimal information required to deliver, secure, and continuously improve our calculation tools.
        </p>
      </section>

      {/* 2. Information We Collect */}
      <section id="information-collected" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          2. Information We Collect
        </h2>
        <p>
          We collect information in two distinct ways: information you voluntarily provide to us, and technical information collected automatically when you visit our website.
        </p>

        <h3 className="text-base font-bold text-[#20231F] dark:text-[#EAE7E0] mt-4">
          A. Information You Voluntarily Provide
        </h3>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li>
            <strong>Contact Form Inquiries:</strong> When you send a message through our Contact Us page or email us directly at <code className="text-xs bg-[#EAE7E0] dark:bg-[#2E362E] px-1.5 py-0.5 rounded">support@civilmath.com</code>, we collect your name, email address, topic category, subject line, and the message content you provide.
          </li>
          <li>
            <strong>Feature Feedback & Calculator Error Reports:</strong> If you submit feedback regarding a structural formula, dimension discrepancy, or code interpretation, we retain your communication history to investigate and apply technical fixes.
          </li>
          <li>
            <strong>Newsletter / Updates:</strong> If you choose to subscribe to technical updates or release notes, we collect your email address solely to deliver requested updates. You can unsubscribe at any time with a single click.
          </li>
        </ul>

        <h3 className="text-base font-bold text-[#20231F] dark:text-[#EAE7E0] mt-4">
          B. Basic Technical & Diagnostic Information
        </h3>
        <p>
          Like most web services, when you access CivilMath, our web servers and performance monitoring systems automatically log standard technical data transmitted by your browser:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li>Internet Protocol (IP) address (anonymized for analytics).</li>
          <li>Browser type, version, and rendering engine.</li>
          <li>Device operating system (e.g., Windows, macOS, Android, iOS).</li>
          <li>Screen resolution and device category (desktop, tablet, mobile).</li>
          <li>Referring URL, timestamp of request, and pages visited within our domain.</li>
        </ul>
      </section>

      {/* 3. Browser Local Storage */}
      <section id="local-storage" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          3. Browser Local Storage &amp; Offline Privacy
        </h2>
        <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#657565] dark:text-[#9FB19F] font-mono">
            Client-Side Computation Guarantee
          </h4>
          <p className="text-xs leading-relaxed m-0">
            Unlike cloud-based CAD or server-side estimation software, CivilMath runs its core mathematical models, reinforcement calculations, and unit conversions directly in your browser using client-side JavaScript.
          </p>
        </div>
        <p>
          To ensure seamless user experience, we use your browser's built-in <code className="text-xs bg-[#EAE7E0] dark:bg-[#2E362E] px-1.5 py-0.5 rounded">localStorage</code> to remember:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li>Your preferred theme (Light or Dark mode).</li>
          <li>Your selected unit system (Metric mm/m or Imperial in/ft).</li>
          <li>Your active input values in calculator workspaces, preventing accidental data loss on refresh.</li>
        </ul>
        <p>
          This calculation data <strong>never leaves your device</strong> and is never transmitted to or stored on CivilMath backend servers. You can erase this data at any moment simply by clearing your browser cache or site storage.
        </p>
      </section>

      {/* 4. Cookies & Analytics Services */}
      <section id="cookies-analytics" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          4. Cookies &amp; Analytics Services
        </h2>
        <p>
          Cookies are small text files placed on your computer or mobile device when you visit a website. CivilMath uses cookies to maintain essential interface states, understand how visitors interact with our calculators, and optimize loading performance.
        </p>
        <p>
          We employ <strong>Google Analytics</strong> to aggregate anonymized visitor metrics, such as popular calculation modules, average reading time on articles, and bounce rates. Google Analytics collects information anonymously and reports trends without identifying individual visitors.
        </p>
        <p>
          For more details on cookie categories and settings, please consult our separate <a href="/cookie-policy" className="text-[#657565] dark:text-[#9FB19F] underline font-semibold">Cookie Policy</a>.
        </p>
      </section>

      {/* 5. Google AdSense & Third-Party Advertising */}
      <section id="google-adsense" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          5. Google AdSense &amp; Third-Party Advertising Disclosures
        </h2>
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs sm:text-sm space-y-2">
          <p className="font-bold m-0">
            Important Disclosure Regarding Advertising on CivilMath:
          </p>
          <p className="m-0 leading-relaxed">
            To provide our extensive civil engineering calculators and technical articles free of charge to students, engineers, and site contractors worldwide, CivilMath may display advertisements served by third-party advertising networks, including <strong>Google AdSense</strong>.
          </p>
        </div>

        <p>In compliance with Google publisher guidelines and international advertising standards:</p>

        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
          <li>
            <strong>Third-Party Vendor Technology:</strong> Third-party vendors, including Google, use cookies, web beacons, IP addresses, or similar tracking technologies to serve and measure advertisements displayed on CivilMath.
          </li>
          <li>
            <strong>Advertising Cookies &amp; Prior Visits:</strong> Google’s use of advertising cookies (such as the DoubleClick cookie) enables it and its partners to serve advertisements to our users based on their visit to CivilMath and/or other websites on the Internet.
          </li>
          <li>
            <strong>Personalized vs. Non-Personalized Ads:</strong> Depending on your location and cookie consent choices, advertisements may be personalized (targeted based on inferred interests) or non-personalized (targeted based on contextual page content only, without tracking individual user history across sites).
          </li>
          <li>
            <strong>EEA, UK &amp; Switzerland Compliance:</strong> For visitors accessing CivilMath from the European Economic Area (EEA), United Kingdom (UK), or Switzerland, ad serving complies with applicable consent frameworks (such as the IAB Europe Transparency and Consent Framework).
          </li>
        </ul>
      </section>

      {/* 6. Opting Out of Personalized Advertising */}
      <section id="managing-ads" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          6. How Users Can Manage or Opt Out of Personalized Advertising
        </h2>
        <p>
          You have full control over whether third parties use your data for interest-based advertising. You can opt out or customize your preferences through the following official tools:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238]">
            <h4 className="font-bold text-[#20231F] dark:text-[#EAE7E0] mb-1">Google Ads Settings</h4>
            <p className="text-[#7B8978] leading-relaxed mb-2">
              Manage the ads you see across Google and third-party sites using Google's official privacy dashboard.
            </p>
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#657565] dark:text-[#9FB19F] font-semibold underline"
            >
              Visit Google Ads Settings →
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238]">
            <h4 className="font-bold text-[#20231F] dark:text-[#EAE7E0] mb-1">Digital Advertising Alliance (DAA)</h4>
            <p className="text-[#7B8978] leading-relaxed mb-2">
              Opt out of interest-based advertising from dozens of participating ad networks simultaneously.
            </p>
            <a
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#657565] dark:text-[#9FB19F] font-semibold underline"
            >
              Visit AboutAds Choices →
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238]">
            <h4 className="font-bold text-[#20231F] dark:text-[#EAE7E0] mb-1">Network Advertising Initiative (NAI)</h4>
            <p className="text-[#7B8978] leading-relaxed mb-2">
              Multi-industry opt-out mechanism for behavioral advertising.
            </p>
            <a
              href="https://optout.networkadvertising.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#657565] dark:text-[#9FB19F] font-semibold underline"
            >
              Visit NAI Opt-Out Tool →
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238]">
            <h4 className="font-bold text-[#20231F] dark:text-[#EAE7E0] mb-1">Your Online Choices (Europe / UK)</h4>
            <p className="text-[#7B8978] leading-relaxed mb-2">
              European Interactive Digital Advertising Alliance consumer guide and opt-out portal.
            </p>
            <a
              href="https://www.youronlinechoices.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#657565] dark:text-[#9FB19F] font-semibold underline"
            >
              Visit Your Online Choices →
            </a>
          </div>
        </div>
      </section>

      {/* 7. External Engineering Links */}
      <section id="third-party-links" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          7. External Engineering Links &amp; Standards Bodies
        </h2>
        <p>
          Our technical guides and formula pages may contain hyperlinks to external reference sites, including the American Concrete Institute (ACI), ASTM International, British Standards (BS/BSI), European Standards (CEN/Eurocodes), and professional civil engineering institutes.
        </p>
        <p>
          CivilMath has no control over the privacy practices, content, or cookie policies of third-party websites. When following an external link, we encourage you to review that destination site's individual privacy disclosures.
        </p>
      </section>

      {/* 8. Data Security */}
      <section id="data-security" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          8. Data Security &amp; Storage
        </h2>
        <p>
          We employ industry-standard administrative, physical, and technical safeguards to protect all data transmitted through CivilMath:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li>
            <strong>SSL/TLS Encryption:</strong> All communications between your web browser and CivilMath are encrypted using modern Transport Layer Security (HTTPS).
          </li>
          <li>
            <strong>No Central Storage of User Calculations:</strong> Because project dimensions and structural parameters are kept strictly in your local device storage, your engineering project data is not exposed to remote server breaches or database vulnerabilities.
          </li>
          <li>
            <strong>Server Security:</strong> Administrative endpoints and server functions are guarded by authenticated sessions and rate limiting.
          </li>
        </ul>
      </section>

      {/* 9. Data Retention */}
      <section id="data-retention" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          9. Data Retention
        </h2>
        <p>
          We retain personal data only for as long as strictly necessary to fulfill the purposes outlined in this policy:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li>Contact form inquiries are retained for up to 12 months to provide consistent follow-up support, after which they are archived or deleted.</li>
          <li>Technical log files (such as IP addresses and server access logs) are automatically purged within 30 to 90 days.</li>
          <li>Client-side browser storage remains on your device until manually cleared by you or cleared by your browser configuration.</li>
        </ul>
      </section>

      {/* 10. User Rights */}
      <section id="user-rights" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          10. Your Privacy Rights (GDPR, CCPA &amp; International)
        </h2>
        <p>
          Depending on your jurisdiction, you may have specific statutory rights regarding your personal information:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li><strong>Right to Access:</strong> Request confirmation of whether we process any personal data concerning you and obtain a copy.</li>
          <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete contact records.</li>
          <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request deletion of contact correspondence or submitted feedback.</li>
          <li><strong>Right to Restriction or Objection:</strong> Object to specific processing activities, including direct marketing.</li>
          <li><strong>Non-Discrimination:</strong> We do not discriminate against any user who exercises their privacy rights.</li>
        </ul>
        <p>
          To exercise any of these rights, please email us at <a href="mailto:support@civilmath.com" className="text-[#657565] dark:text-[#9FB19F] underline font-mono">support@civilmath.com</a>. We will respond without undue delay and in accordance with applicable legal deadlines.
        </p>
      </section>

      {/* 11. Children's Privacy */}
      <section id="children-privacy" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          11. Children’s Privacy
        </h2>
        <p>
          CivilMath is a professional and academic civil engineering utility intended for practitioners, university students, and adult learners. We do not knowingly solicit or collect personal information from children under the age of 13 (or under 16 in the European Union).
        </p>
        <p>
          If you believe a minor has submitted personal information to CivilMath, please contact us immediately, and we will promptly remove such records from our systems.
        </p>
      </section>

      {/* 12. Updates to This Policy */}
      <section id="policy-changes" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          12. Updates to This Privacy Policy
        </h2>
        <p>
          We may update this Privacy Policy periodically to reflect enhancements to our calculation tools, changes in regulatory requirements, or adjustments to our advertising partnerships. When changes are made, the "Last Updated" date at the top of this document will be updated accordingly.
        </p>
        <p>
          We recommend reviewing this page periodically to remain informed about how CivilMath protects your privacy.
        </p>
      </section>

      {/* 13. Contact Information */}
      <section id="contact-privacy" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          13. Privacy Contact Information
        </h2>
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please contact our team:
        </p>
        <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] space-y-1 font-mono text-xs">
          <div><strong>Platform:</strong> CivilMath (<a href="https://civilmath.com" className="text-[#657565] underline">civilmath.com</a>)</div>
          <div><strong>General Support &amp; Privacy Desk:</strong> <a href="mailto:support@civilmath.com" className="text-[#657565] underline">support@civilmath.com</a></div>
          <div><strong>Engineering Lead:</strong> Sithum D. Edirisingha</div>
          <div><strong>Contact Page:</strong> <a href="/contact" className="text-[#657565] underline font-sans">civilmath.com/contact</a></div>
        </div>
      </section>
    </LegalLayout>
  );
}
