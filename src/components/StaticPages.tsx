import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface StaticPageProps {
  onBack: () => void;
}

export function AboutPage({ onBack }: StaticPageProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-4xl mx-auto space-y-6 text-left"
    >
      <button onClick={onBack} className="inline-flex items-center text-xs text-[#0A84FF] hover:underline font-mono mb-4 cursor-pointer">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
      </button>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-sans tracking-tight mb-6">About CivilMath</h1>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4 text-slate-700 dark:text-slate-300 font-sans text-sm leading-relaxed">
        <p>
          CivilMath is a civil engineering calculation suite for structural engineers, site contractors, and surveying professionals. It provides transparent educational and planning tools that users must check against their project documentation and applicable requirements.
        </p>
        <p>
          We provide tools ranging from Bar Bending Schedules (BBS) to Geotechnical Bearing Capacity limits, ensuring that every design parameter is safely evaluated and easily adjustable. 
        </p>
        <p>
          Developed with a focus on modern aesthetics and robust engineering safety parameters, CivilMath aims to replace manual spreadsheet estimations with an integrated, intelligent analytics platform.
        </p>
      </div>
    </motion.div>
  );
}

export function ContactPage({ onBack }: StaticPageProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-4xl mx-auto space-y-6 text-left"
    >
      <button onClick={onBack} className="inline-flex items-center text-xs text-[#0A84FF] hover:underline font-mono mb-4 cursor-pointer">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
      </button>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-sans tracking-tight mb-6">Contact Us</h1>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6 text-slate-700 dark:text-slate-300 font-sans text-sm">
        <p>
          We value feedback from the engineering community. If you have questions regarding formula implementations, feature requests, or partnership opportunities, please reach out to us.
        </p>
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Developer Contact</h4>
            <p className="mt-1 font-mono text-xs text-[#0A84FF]">
              <a href="https://lk.linkedin.com/in/sithum-d-edirisingha" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Sithum D. Edirisingha (LinkedIn)
              </a>
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">General Inquiries</h4>
            <p className="mt-1 font-mono text-xs">support@civilmath.com</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function PrivacyPolicyPage({ onBack }: StaticPageProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-4xl mx-auto space-y-6 text-left"
    >
      <button onClick={onBack} className="inline-flex items-center text-xs text-[#0A84FF] hover:underline font-mono mb-4 cursor-pointer">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
      </button>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-sans tracking-tight mb-6">Privacy Policy</h1>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4 text-slate-700 dark:text-slate-300 font-sans text-sm leading-relaxed">
        <p><strong>Effective Date:</strong> July 2026</p>
        <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">1. Information Collection</h3>
        <p>
          CivilMath utilizes Google Analytics to collect anonymous usage data to improve our engineering tools. 
          Saved calculations are stored strictly in your browser's local storage; we do not transmit or store your proprietary engineering data on our servers.
        </p>
        <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">2. Local Storage</h3>
        <p>
          By using CivilMath, you agree that your active projects, material parameters, and drafting notes will be kept offline on your device using HTML5 LocalStorage.
        </p>
        <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">3. Third-party Services</h3>
        <p>
          Our AI Assistant operates via OpenRouter. Any text you input into the AI chat is processed securely by the model API but does not persist in our databases.
        </p>
      </div>
    </motion.div>
  );
}
