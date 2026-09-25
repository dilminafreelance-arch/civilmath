import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[#E2E6E2] dark:border-white/8 bg-[#F7F8F7] dark:bg-[#090B0A] text-[#141A16] dark:text-[#ECF2EE] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-[#E2E6E2] dark:border-white/8">
          {/* Brand & Purpose (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 text-base font-bold text-[#141A16] dark:text-[#ECF2EE] no-underline tracking-tight">
              <div className="w-7 h-7 rounded-lg bg-[#18221D] border border-[#34D399]/30 text-[#34D399] flex items-center justify-center font-mono font-bold text-xs shadow-2xs">
                CM
              </div>
              <span className="font-sans">Civil<span className="text-[#2E6B56] dark:text-[#34D399]">Math</span></span>
            </Link>

            <p className="text-xs text-[#526058] dark:text-[#97A69E] leading-relaxed max-w-sm">
              Making practical civil engineering knowledge easier to understand, calculate, and apply.
              Transparent formulas, structural methods, and interactive calculation tools built for engineers, estimators, and construction professionals.
            </p>

            <div className="pt-1 flex items-center gap-3 text-xs text-[#7A8981]">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6B56] dark:text-[#34D399]" />
                Client-Side Processing
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6B56] dark:text-[#34D399]" />
                Open Reference Codes
              </span>
            </div>

            <div className="pt-2">
              <a
                href="mailto:support@civilmath.com"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#2E6B56] dark:text-[#34D399] hover:underline"
              >
                <Mail className="w-3.5 h-3.5" />
                support@civilmath.com
              </a>
            </div>
          </div>

          {/* Col 1: Platform & Navigation */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#141A16] dark:text-[#ECF2EE]">
              Platform
            </h3>
            <ul className="space-y-2 text-xs list-none p-0 m-0">
              <li>
                <Link to="/about" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline">
                  About
                </Link>
              </li>
              <li>
                <Link to="/articles" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline flex items-center gap-1">
                  Articles
                  <span className="text-[9px] px-1 rounded bg-[#2E6B56]/10 text-[#2E6B56] dark:text-[#34D399] font-mono">Guide</span>
                </Link>
              </li>
              <li>
                <Link to="/calculators" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline">
                  Calculators
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline">
                  FAQ &amp; Help
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Engineering Suites */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#141A16] dark:text-[#ECF2EE]">
              Calculators
            </h3>
            <ul className="space-y-2 text-xs list-none p-0 m-0">
              <li>
                <Link to="/concrete" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline">
                  Concrete &amp; Materials
                </Link>
              </li>
              <li>
                <Link to="/structural" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline">
                  Structural Analysis
                </Link>
              </li>
              <li>
                <Link to="/bbs" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline">
                  Bar Bending Schedule (BBS)
                </Link>
              </li>
              <li>
                <Link to="/geotechnical" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline">
                  Geotechnical Engineering
                </Link>
              </li>
              <li>
                <Link to="/surveying" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline">
                  Surveying &amp; Leveling
                </Link>
              </li>
              <li>
                <Link to="/utilities/unit-converter" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline">
                  Unit Converter
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Trust Center */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#141A16] dark:text-[#ECF2EE]">
              Legal &amp; Trust
            </h3>
            <ul className="space-y-2 text-xs list-none p-0 m-0">
              <li>
                <Link to="/privacy" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-white transition-colors no-underline">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Engineering Notice Card */}
        <div className="my-6 p-4 rounded-xl bg-white dark:bg-[#131715] border border-[#E2E6E2] dark:border-white/8 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs text-[#526058] dark:text-[#97A69E] shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-[#2E6B56] dark:text-[#34D399] shrink-0 mt-0.5 sm:mt-0" />
          <p className="m-0 leading-relaxed text-[11px]">
            <strong className="text-[#141A16] dark:text-[#ECF2EE]">Professional Engineering Notice:</strong> All calculators, formulas, diagrams, and material takeoffs provided by CivilMath are intended strictly for educational study, preliminary estimation, and technical planning. Calculations must be verified against project specifications and certified by a licensed Professional Engineer (PE/CEng).
          </p>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#7A8981] font-mono">
          <div>
            &copy; {new Date().getFullYear()} CivilMath. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:underline text-[#7A8981] hover:text-[#141A16] dark:hover:text-[#ECF2EE]">Privacy</Link>
            <span aria-hidden="true">&middot;</span>
            <Link to="/terms" className="hover:underline text-[#7A8981] hover:text-[#141A16] dark:hover:text-[#ECF2EE]">Terms</Link>
            <span aria-hidden="true">&middot;</span>
            <Link to="/disclaimer" className="hover:underline text-[#7A8981] hover:text-[#141A16] dark:hover:text-[#ECF2EE]">Disclaimer</Link>
            <span aria-hidden="true">&middot;</span>
            <Link to="/cookie-policy" className="hover:underline text-[#7A8981] hover:text-[#141A16] dark:hover:text-[#ECF2EE]">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
