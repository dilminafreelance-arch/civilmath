import LegalLayout from './LegalLayout';
import { Cookie, Settings, Eye, ShieldCheck, Globe, Sliders } from 'lucide-react';

export default function CookiePolicyPage() {
  const cookieCategories = [
    {
      icon: ShieldCheck,
      name: 'Essential & Functional Technologies',
      purpose: 'Strictly necessary for CivilMath interface operation and state persistence.',
      examples: ' civilmath-theme (stores Light/Dark preference), unitSystem (Metric/Imperial preference), active calculator draft inputs in localStorage.',
      canOptOut: 'Required for core website layout and function. Cannot be disabled without breaking visual preferences.',
    },
    {
      icon: Eye,
      name: 'Performance & Analytics Cookies',
      purpose: 'Collect anonymous statistical metrics to help us understand which engineering calculators are most helpful.',
      examples: 'Google Analytics (_ga, _gid cookies) recording anonymized page views, session duration, and device screen dimensions.',
      canOptOut: 'Can be opted out via browser settings, ad blocker, or the Google Analytics Opt-Out add-on.',
    },
    {
      icon: Globe,
      name: 'Advertising & Measurement Cookies',
      purpose: 'Enable third-party advertising networks (including Google AdSense) to deliver relevant, non-intrusive advertisements that fund free engineering tools.',
      examples: 'Google DoubleClick, conversion tracking pixels, frequency capping cookies.',
      canOptOut: 'Can be controlled via Google Ads Settings, DAA, or NAI consumer choice portals.',
    },
  ];

  const toc = [
    { id: 'what-are-cookies', label: '1. What Are Cookies?' },
    { id: 'categories-used', label: '2. Categories of Cookies Used on CivilMath' },
    { id: 'local-storage-distinction', label: '3. Browser Local Storage vs. Cookies' },
    { id: 'google-advertising', label: '4. Google AdSense & Advertising Technologies' },
    { id: 'controlling-cookies', label: '5. How You Can Control & Delete Cookies' },
    { id: 'browser-controls', label: '6. Browser-Specific Cookie Management' },
    { id: 'policy-updates', label: '7. Updates to This Cookie Policy' },
    { id: 'cookie-contact', label: '8. Contact Information' },
  ];

  return (
    <LegalLayout
      title="Cookie Policy"
      badge="CivilMath Legal & Trust"
      lastUpdated="September 2026"
      summary="This Cookie Policy explains how CivilMath uses cookies, local browser storage, and related web technologies. We use essential storage for your visual theme and unit preferences, anonymous Google Analytics to refine our tools, and Google advertising technologies to maintain free access for engineers and students worldwide."
      toc={toc}
    >
      {/* 1. What Are Cookies */}
      <section id="what-are-cookies" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          1. What Are Cookies?
        </h2>
        <p>
          Cookies are small data files containing strings of letters and numbers that a website transmits to your browser when you visit. They are saved onto your computer, tablet, or smartphone hard drive to enable the website to recognize your browser, maintain stateful preferences, and provide analytical insights into site usage.
        </p>
        <p>
          Cookies can be "Session Cookies" (which are automatically erased when you close your browser) or "Persistent Cookies" (which remain stored until their designated expiry date or until you manually delete them).
        </p>
      </section>

      {/* 2. Categories of Cookies */}
      <section id="categories-used" className="space-y-4">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          2. Categories of Cookies Used on CivilMath
        </h2>
        <p>
          We categorize the storage technologies used across <a href="https://civilmath.com" className="text-[#657565] dark:text-[#9FB19F] underline">civilmath.com</a> into three distinct functional groups:
        </p>

        <div className="space-y-3">
          {cookieCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.name}
                className="p-5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#657565]/10 text-[#657565] dark:text-[#9FB19F] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0] m-0">
                    {cat.name}
                  </h3>
                </div>
                <div className="text-xs space-y-1.5 pl-9 text-[#555C55] dark:text-[#C5D0C5]">
                  <p className="m-0"><strong>Purpose:</strong> {cat.purpose}</p>
                  <p className="m-0"><strong>Identifiers &amp; Examples:</strong> <code className="text-[11px] font-mono bg-white dark:bg-[#252B25] px-1 py-0.5 rounded border border-[#D8D0C2] dark:border-[#384238]">{cat.examples}</code></p>
                  <p className="m-0 text-[#7B8978]"><strong>Opt-Out Options:</strong> {cat.canOptOut}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. LocalStorage Distinction */}
      <section id="local-storage-distinction" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          3. Browser Local Storage vs. Cookies
        </h2>
        <p>
          CivilMath heavily utilizes modern HTML5 <code className="text-xs font-mono bg-[#EAE7E0] dark:bg-[#2E362E] px-1.5 py-0.5 rounded">localStorage</code> instead of traditional tracking cookies for engineering workflows:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li>
            <strong>Privacy Advantage:</strong> Unlike cookies, data stored in <code className="text-xs font-mono">localStorage</code> is never automatically sent across the Internet with every HTTP request header. It remains sandboxed entirely inside your local device.
          </li>
          <li>
            <strong>No Server Logging:</strong> When you input footing dimensions, beam loads, or coordinate traverse points, that data is processed client-side by your CPU. CivilMath servers never see or log your design projects.
          </li>
        </ul>
      </section>

      {/* 4. Google Advertising */}
      <section id="google-advertising" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          4. Google AdSense &amp; Third-Party Advertising Technologies
        </h2>
        <p>
          CivilMath partners with Google AdSense and third-party advertising networks to display advertisements. These partners may use cookies, web beacons, and similar technologies to measure ad effectiveness and serve contextually relevant ads.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li>
            <strong>DoubleClick Cookie:</strong> Google uses advertising cookies (such as DoubleClick) to serve ads based on your visit to CivilMath and other sites on the web.
          </li>
          <li>
            <strong>Non-Personalized Ads Option:</strong> If you are located in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, or if you have opted out of interest-based ads, you will receive non-personalized advertisements that rely on contextual topic signals (such as "civil engineering" or "concrete") rather than personal cross-site tracking.
          </li>
          <li>
            <strong>Fraud Detection:</strong> Third-party ad cookies also assist in detecting and combating invalid traffic and fraudulent clicks to protect advertisers and publisher integrity.
          </li>
        </ul>
      </section>

      {/* 5. How Users Control Cookies */}
      <section id="controlling-cookies" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          5. How You Can Control &amp; Delete Cookies
        </h2>
        <p>
          You have multiple options to manage or opt out of advertising and analytics cookies:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-4 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] space-y-1.5">
            <h4 className="font-bold text-[#20231F] dark:text-[#EAE7E0] m-0">Google Ads Settings</h4>
            <p className="text-[#7B8978] leading-relaxed m-0">
              Customize the personalized advertisements you see from Google, or turn off ad personalization entirely.
            </p>
            <div className="pt-1">
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#657565] dark:text-[#9FB19F] font-semibold underline"
              >
                Google Ads Settings Dashboard →
              </a>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] space-y-1.5">
            <h4 className="font-bold text-[#20231F] dark:text-[#EAE7E0] m-0">Google Analytics Opt-Out</h4>
            <p className="text-[#7B8978] leading-relaxed m-0">
              Download and install the official browser add-on to prevent Google Analytics from collecting usage data.
            </p>
            <div className="pt-1">
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#657565] dark:text-[#9FB19F] font-semibold underline"
              >
                Get GA Opt-Out Add-on →
              </a>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] space-y-1.5">
            <h4 className="font-bold text-[#20231F] dark:text-[#EAE7E0] m-0">Digital Advertising Alliance (DAA)</h4>
            <p className="text-[#7B8978] leading-relaxed m-0">
              Consumer choice page allowing opt-out across participating multi-network ad companies.
            </p>
            <div className="pt-1">
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#657565] dark:text-[#9FB19F] font-semibold underline"
              >
                Visit AboutAds Portal →
              </a>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] space-y-1.5">
            <h4 className="font-bold text-[#20231F] dark:text-[#EAE7E0] m-0">Your Online Choices (Europe)</h4>
            <p className="text-[#7B8978] leading-relaxed m-0">
              European Interactive Digital Advertising Alliance interactive control panel for EU/UK residents.
            </p>
            <div className="pt-1">
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
        </div>
      </section>

      {/* 6. Browser-Specific Controls */}
      <section id="browser-controls" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          6. Browser-Specific Cookie Management
        </h2>
        <p>
          Most modern browsers allow you to refuse or delete cookies via their settings menus. Here are the official documentation guides for popular web browsers:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li><strong>Google Chrome:</strong> Settings → Privacy and Security → Third-party cookies.</li>
          <li><strong>Mozilla Firefox:</strong> Settings → Privacy &amp; Security → Enhanced Tracking Protection.</li>
          <li><strong>Apple Safari:</strong> Preferences → Privacy → Block all cookies or Prevent cross-site tracking.</li>
          <li><strong>Microsoft Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies and site data.</li>
        </ul>
        <p className="text-xs text-[#7B8978]">
          <em>Note:</em> Disabling all cookies may prevent your browser from remembering your chosen Light/Dark theme or active calculator input units between visits.
        </p>
      </section>

      {/* 7. Updates */}
      <section id="policy-updates" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          7. Updates to This Cookie Policy
        </h2>
        <p>
          We may update this Cookie Policy from time to time to account for updates to our web framework, analytics instrumentation, or changes in third-party advertising requirements. Any changes will be published here with an updated "Last Updated" timestamp.
        </p>
      </section>

      {/* 8. Contact */}
      <section id="cookie-contact" className="space-y-3">
        <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
          8. Contact Information
        </h2>
        <p>
          If you have any questions regarding our use of cookies or local storage technologies, please reach out to:
        </p>
        <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] space-y-1 font-mono text-xs">
          <div><strong>Platform:</strong> CivilMath (<a href="https://civilmath.com" className="text-[#657565] underline">civilmath.com</a>)</div>
          <div><strong>Email:</strong> <a href="mailto:support@civilmath.com" className="text-[#657565] underline">support@civilmath.com</a></div>
          <div><strong>Contact Desk:</strong> <a href="/contact" className="text-[#657565] underline font-sans">civilmath.com/contact</a></div>
        </div>
      </section>
    </LegalLayout>
  );
}
