import { useState } from 'react';
import { MailCheck, Send } from 'lucide-react';

/**
 * Reusable newsletter signup. POSTs to /api/newsletter (service-role, RLS-safe).
 * Shows inline on calculator pages / footer.
 */
export default function NewsletterSignup({ source = 'website', compact = false }: { source?: string; compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setMessage('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('done');
      } else {
        setStatus('error');
        setMessage(data.error || 'Signup failed. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (status === 'done') {
    return (
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400" role="status">
        <MailCheck className="h-4 w-4 shrink-0" />
        <p className="text-xs font-semibold">You're in! Watch your inbox for engineering tips.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={compact ? '' : 'max-w-md'}>
      {!compact && (
        <p className="mb-2 text-xs font-bold text-ink">Get construction cost tips & new calculators</p>
      )}
      <div className="flex gap-2">
        <label htmlFor={`newsletter-email-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`newsletter-email-${source}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={status === 'sending'}
          className="min-w-0 flex-1 rounded-xl border border-border-subtle bg-surface-1 px-3 py-2 text-xs text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          <Send className="h-3.5 w-3.5" />
          {status === 'sending' ? 'Joining…' : 'Join'}
        </button>
      </div>
      {status === 'error' && (
        <p role="alert" className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
      {!compact && (
        <p className="mt-1.5 text-[10px] text-ink-muted">Free forever. Unsubscribe anytime.</p>
      )}
    </form>
  );
}
