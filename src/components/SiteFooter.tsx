import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowUpRight, Calculator, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[#D8D0C2] dark:border-[#2D352D] bg-[#EAE7E0]/40 dark:bg-[#151815] text-[#20231F] dark:text-[#EAE7E0] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-[#D8D0C2]/70 dark:border-[#2D352D]">
          {/* Brand & Purpose (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 text-base font-bold text-[#20231F] dark:text-white no-underline tracking-tight">
              <div className="w-8 h-8 rounded-xl bg-[#657565] text-white flex items-center justify-center font-mono font-black text-sm shadow-xs">
                CM
              </div>
              <span className="font-sans">Civil<span className="text-[#657565] dark:text-[#9FB19F]">Math</span></span>
            </Link>

            <p className="text-xs text-[#555C55] dark:text-[#A4B2A4] leading-relaxed max-w-sm">
              Making practical civil engineering knowledge easier to understand, calculate, and apply.
              Transparent formulas, structural methods, and interactive calculation tools built for engineers, estimators, and construction professionals.
            </p>

            <div className="pt-1 flex items-center gap-3 text-xs text-[#7B8978]">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#657565]" />
                Client-Side Processing
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#657565]" />
                Open Reference Codes
              </span>
            </div>

            <div className="pt-2">
              <a
                href="mailto:support@civilmath.com"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#657565] dark:text-[#9FB19F] hover:underline"
              >
                <Mail className="w-3.5 h-3.5" />
                support@civilmath.com
              </a>
            </div>
          </div>

          {/* Col 1: Platform & Navigation */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#20231F] dark:text-[#EAE7E0]">
              Platform
            </h3>
            <ul className="space-y-2 text-xs list-none p-0 m-0">
              <li>
                <Link to="/about" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
                  About
                </Link>
              </li>
              <li>
                <Link to="/articles" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline flex items-center gap-1">
                  Articles
                  <span className="text-[9px] px-1 py-0.2 rounded bg-[#657565]/10 text-[#657565] font-mono">Guide</span>
                </Link>
              </li>
              <li>
                <Link to="/calculators" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
                  Calculators
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
                  FAQ & Help
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Engineering Suites */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#20231F] dark:text-[#EAE7E0]">
              Calculators
            </h3>
            <ul className="space-y-2 text-xs list-none p-0 m-0">
              <li>
                <Link to="/concrete" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
                  Concrete & Materials
                </Link>
              </li>
              <li>
                <Link to="/structural" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
                  Structural Analysis
                </Link>
              </li>
              <li>
                <Link to="/bbs" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
                  Bar Bending Schedule (BBS)
                </Link>
              </li>
              <li>
                <Link to="/geotechnical" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
                  Geotechnical Engineering
                </Link>
              </li>
              <li>
                <Link to="/surveying" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
                  Surveying & Leveling
                </Link>
              </li>
              <li>
                <Link to="/utilities/unit-converter" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
                  Unit Converter
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Trust Center */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#20231F] dark:text-[#EAE7E0]">
              Legal & Trust
            </h3>
            <ul className="space-y-2 text-xs list-none p-0 m-0">
              <li>
                <Link to="/privacy" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-[#555C55] dark:text-[#A4B2A4] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Engineering Notice Card */}
        <div className="my-6 p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#2D352D] flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs text-[#7B8978]">
          <ShieldCheck className="w-5 h-5 text-[#657565] shrink-0 mt-0.5 sm:mt-0" />
          <p className="m-0 leading-relaxed text-[11px]">
            <strong className="text-[#20231F] dark:text-[#EAE7E0]">Professional Engineering Notice:</strong> All calculators, formulas, diagrams, and material takeoffs provided by CivilMath are intended strictly for educational study, preliminary estimation, and technical planning. Calculations must be verified against project specifications and certified by a licensed Professional Engineer (PE/CEng).
          </p>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#7B8978] font-mono">
          <div>
            © {new Date().getFullYear()} CivilMath. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:underline text-[#7B8978]">Privacy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:underline text-[#7B8978]">Terms</Link>
            <span>·</span>
            <Link to="/disclaimer" className="hover:underline text-[#7B8978]">Disclaimer</Link>
            <span>·</span>
            <Link to="/cookie-policy" className="hover:underline text-[#7B8978]">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
