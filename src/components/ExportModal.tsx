import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Check, Copy, Share2, Printer, Building2, ShieldCheck } from 'lucide-react';
import { copyShareLinkToClipboard } from '../utils/shareUrl';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculatorTitle: string;
  calculatorId: string;
  onConfirmPDF: (metadata: {
    projectName: string;
    engineerName: string;
    companyName: string;
    clientName: string;
    notes: string;
  }) => void;
  shareUrl?: string;
}

export function ExportModal({
  isOpen,
  onClose,
  calculatorTitle,
  calculatorId,
  onConfirmPDF,
  shareUrl
}: ExportModalProps) {
  const [projectName, setProjectName] = useState(() => localStorage.getItem('cm_export_project') || 'Structural Verification');
  const [engineerName, setEngineerName] = useState(() => localStorage.getItem('cm_export_engineer') || 'Site Engineer');
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('cm_export_company') || 'CivilMath Engineering');
  const [clientName, setClientName] = useState(() => localStorage.getItem('cm_export_client') || 'Standard Construction');
  const [notes, setNotes] = useState('Calculation verified according to standard structural assumptions and site conditions.');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    const ok = await copyShareLinkToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleGenerate = () => {
    try {
      localStorage.setItem('cm_export_project', projectName);
      localStorage.setItem('cm_export_engineer', engineerName);
      localStorage.setItem('cm_export_company', companyName);
      localStorage.setItem('cm_export_client', clientName);
    } catch {}

    onConfirmPDF({
      projectName,
      engineerName,
      companyName,
      clientName,
      notes
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#0B0D16] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 text-left"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-[#f97316] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Client-Ready Calculation Export
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {calculatorTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="p-5 space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. Skyline Residence Tower"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-[#f97316]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Prepared By (Engineer)
                </label>
                <input
                  type="text"
                  value={engineerName}
                  onChange={e => setEngineerName(e.target.value)}
                  placeholder="e.g. Eng. Alexander Smith"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-[#f97316]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Company / Engineering Firm
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. CivilMath Engineering"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-[#f97316]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Client / Contractor
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="e.g. Apex Builders Corp"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-[#f97316]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Engineering Notes & Assumptions
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-[#f97316] resize-none"
              />
            </div>

            {/* Quick Share Link Box */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#f97316] shrink-0" />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Share calculation with colleague:
                </span>
              </div>
              <button
                onClick={handleCopyLink}
                className={`w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#f97316]'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-orange-500/25"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Official PDF</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
