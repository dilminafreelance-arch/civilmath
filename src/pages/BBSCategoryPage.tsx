import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, ChevronRight, Clipboard } from 'lucide-react';
import { useState } from 'react';
import { SEO } from '../utils/seo';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { STRUCTURES } from '../UniversalBBSCalculator/types';

const STRUCTURE_CARDS = STRUCTURES.map(s => ({
  id: s.id,
  name: s.label,
  description: `Professional bar bending schedule for ${s.label.toLowerCase()} reinforcement. Generates cutting lengths, bar marks, weight schedules, and shape codes.`,
  path: `/bbs/${s.id}`,
  icon: Clipboard,
}));

const BBS_FAQS: { question: string; answer: string }[] = [
  {
    question: 'What is a Bar Bending Schedule?',
    answer: 'A Bar Bending Schedule (BBS) is a detailed list of all reinforcement bars required for a concrete structure. It includes bar marks, diameters, lengths, shapes, bending details, and quantities needed for procurement and site execution.',
  },
  {
    question: 'Which design codes are supported?',
    answer: 'The BBS calculator supports ACI 318 (American), BS 8110 (British), Eurocode 2 (European), and IS 456 (Indian) standards. You can switch between codes to match your project requirements.',
  },
  {
    question: 'What shape codes are available?',
    answer: 'The calculator supports standard shape codes from 00 to 91, including straight bars, hooks, bends, U-bars, stirrups, ties, and complex shapes. Each shape code includes automatic cutting length formulas.',
  },
  {
    question: 'Can I export the BBS to PDF or Excel?',
    answer: 'Yes. Each BBS calculation includes export options for PDF (landscape professional format), Excel (XLSX with styled headers), and CSV. Multi-member projects have a built-in Project Summary with material totals.',
  },
];

export default function BBSCategoryPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = STRUCTURE_CARDS.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SEO
        title="Bar Bending Schedule Calculators | BBS Generator | CivilMath"
        description="Generate accurate bar bending schedules for footings, beams, columns, slabs, stairs, and retaining walls with cutting lengths, weights, and export options."
        canonicalUrl="https://civilmath.com/bbs"
        keywords={['bar bending schedule', 'bbs calculator', 'rebar schedule generator', 'rebar cutting length']}
        ogImage="https://civilmath.com/og-image.png"
        type="website"
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'BBS Calculators', url: '/bbs' }]}
        faqs={BBS_FAQS}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Bar Bending Schedule Calculators',
          description: 'Professional rebar bending schedule calculators for all RC structure types.',
        }}
      />

      {/* Hero */}
      <section className="relative pt-8 md:pt-12 text-center overflow-hidden border-b border-border-subtle/50 pb-10 mb-8">
        <div className="relative max-w-4xl mx-auto px-4 space-y-4 z-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex">
            <Badge variant="brand" size="md">
              <Clipboard className="w-3.5 h-3.5 mr-1.5" />Bar Bending Schedule
            </Badge>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold font-sans tracking-tight text-ink dark:text-ink-dark leading-tight">
            Rebar BBS Calculators
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="text-ink-muted dark:text-ink-muted-dark text-xs md:text-sm font-sans max-w-2xl mx-auto leading-relaxed">
            Generate professional bar bending schedules for any reinforced concrete structure. 
            Review assumptions and project detailing requirements before using results for fabrication or construction.
          </motion.p>
        </div>
      </section>

      {/* Search */}
      <div className="max-w-xl mx-auto mb-8 px-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted dark:text-ink-muted-dark" />
          <input type="text" aria-label="Search BBS structure types" placeholder="Search structure types..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-surface-1 dark:bg-surface-2 border border-border-subtle rounded-2xl py-3 pl-10 pr-4 text-xs text-ink dark:text-ink-dark outline-none focus:border-brand focus:ring-1 focus:ring-brand font-mono placeholder:text-ink-muted" />
        </div>
      </div>

      {/* Structure Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, idx) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: Math.min(0.15, idx * 0.02) }}>
              <Link to={item.path} className="group block no-underline text-left h-full">
                <Card elevation="interactive" className="h-full flex flex-col justify-between p-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-brand/10 text-brand rounded-lg">
                        <item.icon className="w-4 h-4" />
                      </span>
                      <h2 className="text-sm font-bold text-ink dark:text-ink-dark group-hover:text-brand transition-all font-sans">
                        {item.name}
                      </h2>
                    </div>
                    <p className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-mono leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border-subtle/50 flex justify-between items-center text-[10px] font-mono text-brand font-medium">
                    <span>Open BBS Calculator</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform text-ink-muted" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="text-center space-y-2 mb-10">
          <span className="text-[10px] font-mono text-ink-muted uppercase tracking-widest block font-bold">Frequently Asked Questions</span>
          <h2 className="text-2xl font-bold text-ink dark:text-ink-dark font-sans tracking-tight">About BBS Calculators</h2>
        </div>
        <div className="space-y-4">
          {BBS_FAQS.map((faq, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: idx * 0.05 }}>
              <Card elevation="flat" className="p-5">
                <h3 className="text-xs font-bold text-ink dark:text-ink-dark font-sans mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                  {faq.question}
                </h3>
                <p className="text-[11px] font-mono text-ink-muted dark:text-ink-muted-dark leading-relaxed pl-3.5">
                  {faq.answer}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
