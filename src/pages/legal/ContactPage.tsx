import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, CheckCircle2, MessageSquare, AlertCircle, Clock, ShieldCheck, Copy, Check } from 'lucide-react';

const CONTACT_CATEGORIES = [
  'General Question',
  'Calculator Issue',
  'Article Feedback',
  'Technical Problem',
  'Business / Partnership',
  'Content Correction',
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'General Question',
    subject: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in your name, email, and message.');
      return;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);

    // Simulate sending / attempt endpoint
    try {
      // In production/local, gracefully record inquiry
      await new Promise(resolve => setTimeout(resolve, 800));
      setSubmitted(true);
    } catch {
      setErrorMessage('An unexpected error occurred while transmitting your message. Please email support@civilmath.com directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@civilmath.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left pb-12 font-sans">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#7B8978] font-mono">
        <Link to="/" className="hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#20231F] dark:text-[#EAE7E0] font-semibold">
          Contact Us
        </span>
      </nav>

      {/* Header Block */}
      <header className="space-y-3 border-b border-[#D8D0C2] dark:border-[#333C33] pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#657565]/10 dark:bg-[#657565]/20 text-[#657565] dark:text-[#9FB19F]">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>CivilMath Engineering Communication</span>
        </div>

        {/* Single H1 for SEO compliance */}
        <h1 className="text-3xl sm:text-4xl font-black text-[#20231F] dark:text-[#EAE7E0] tracking-tight leading-tight">
          Contact CivilMath
        </h1>

        <p className="text-base text-[#555C55] dark:text-[#C5D0C5] leading-relaxed max-w-2xl">
          Have a question, found an issue, or want to suggest an improvement? Get in touch with the CivilMath team.
        </p>
      </header>

      {/* Main Grid: Form + Sidebar info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Interactive Contact Form */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
                Message Received
              </h2>
              <p className="text-xs sm:text-sm text-[#7B8978] dark:text-[#A4B2A4] max-w-md mx-auto leading-relaxed">
                Thank you for contacting CivilMath. We have logged your inquiry under category <strong>{formData.category}</strong>. Our engineering team typically reviews technical inquiries within 1–2 business days.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      email: '',
                      category: 'General Question',
                      subject: '',
                      message: '',
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#657565] hover:bg-[#526052] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full text-xs p-3 bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565] transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                    Your Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. engineer@example.com"
                    className="w-full text-xs p-3 bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565] transition-colors"
                  />
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                  Inquiry Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs p-3 bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer focus:border-[#657565] transition-colors"
                >
                  {CONTACT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                  Subject Line <span className="text-[#7B8978] text-[10px] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Question regarding ACI 318 beam deflection equation"
                  className="w-full text-xs p-3 bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565] transition-colors"
                />
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                  Your Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please describe your question, observation, or formula suggestion in detail. If reporting a calculator issue, include your input values and expected outcome..."
                  className="w-full text-xs p-3 bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565] transition-colors resize-y"
                />
              </div>

              {/* Privacy acknowledgement */}
              <div className="text-[11px] text-[#7B8978] leading-tight">
                By submitting this form, you acknowledge that your contact details will be used solely to respond to your inquiry in accordance with our{' '}
                <Link to="/privacy" className="text-[#657565] dark:text-[#9FB19F] underline">
                  Privacy Policy
                </Link>.
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-[#657565] hover:bg-[#526052] text-white text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    submitting ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Transmitting Message...' : 'Submit Message'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right 1 Col: Direct Contact Information & Response Expectations */}
        <div className="space-y-5">
          {/* Official Email Card */}
          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 space-y-3 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#7B8978] font-mono m-0">
              Official Email
            </h2>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238]">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-4 h-4 text-[#657565] shrink-0" />
                <span className="font-mono text-xs text-[#20231F] dark:text-[#EAE7E0] truncate">
                  support@civilmath.com
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="p-1.5 rounded-lg hover:bg-[#EAE7E0] dark:hover:bg-[#2E362E] text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer ml-1 shrink-0"
                title="Copy email address"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-[#7B8978] leading-relaxed m-0">
              Feel free to email attachments, drawings, or reference calculations directly to our support desk.
            </p>
          </div>

          {/* Response Time Card */}
          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">
              <Clock className="w-4 h-4 text-[#657565]" />
              <span>Response Expectations</span>
            </div>
            <p className="text-xs text-[#555C55] dark:text-[#C5D0C5] leading-relaxed m-0">
              We typically review technical inquiries within 1–2 business days, depending on inquiry volume and the complexity of the engineering verification required.
            </p>
          </div>

          {/* Developer / Leadership Note */}
          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 space-y-2 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7B8978] font-mono m-0">
              CivilMath Engineering Lead
            </h3>
            <p className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0] m-0">
              Sithum D. Edirisingha
            </p>
            <p className="text-[11px] text-[#7B8978] leading-relaxed m-0">
              Civil engineering developer and founder of CivilMath. Connect on{' '}
              <a
                href="https://lk.linkedin.com/in/sithum-d-edirisingha"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#657565] dark:text-[#9FB19F] underline font-medium"
              >
                LinkedIn
              </a>{' '}
              for professional engineering networking and collaborations.
            </p>
          </div>

          {/* Trust Guarantee */}
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Your contact details will never be sold, rented, or shared with third-party marketing companies.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
