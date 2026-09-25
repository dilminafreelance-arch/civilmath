import { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download, Sparkles } from 'lucide-react';
import { Article } from '../../types/article';
import { parseUploadedJson, parseUploadedMarkdown, bulkUploadArticles } from '../../utils/articleStore';
import { autoGenerateSeo } from '../../utils/autoSeo';

interface AdminUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export default function AdminUploadModal({ isOpen, onClose, onSuccess }: AdminUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileList, setFileList] = useState<File[]>([]);
  const [autoSeoEnabled, setAutoSeoEnabled] = useState(true);
  const [rawText, setRawText] = useState('');
  const [activeTab, setActiveTab] = useState<'files' | 'paste'>('files');
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [resultStats, setResultStats] = useState<{ added: number; updated: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.name.endsWith('.json') || f.name.endsWith('.md') || f.name.endsWith('.txt')) {
        validFiles.push(f);
      }
    }
    setFileList(prev => [...prev, ...validFiles]);
  };

  const removeFile = (idx: number) => {
    setFileList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleProcessUpload = async () => {
    setStatus('processing');
    setMessage('Processing and validating articles...');
    try {
      const articlesToSave: Article[] = [];

      if (activeTab === 'files') {
        for (const file of fileList) {
          const text = await file.text();
          if (file.name.endsWith('.json')) {
            const parsed = parseUploadedJson(text);
            articlesToSave.push(...parsed);
          } else {
            const parsed = parseUploadedMarkdown(text, file.name);
            articlesToSave.push(parsed);
          }
        }
      } else {
        if (!rawText.trim()) {
          setStatus('error');
          setMessage('Please paste valid JSON or Markdown content.');
          return;
        }
        if (rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
          const parsed = parseUploadedJson(rawText);
          articlesToSave.push(...parsed);
        } else {
          const parsed = parseUploadedMarkdown(rawText, 'pasted-article.md');
          articlesToSave.push(parsed);
        }
      }

      if (articlesToSave.length === 0) {
        setStatus('error');
        setMessage('No valid articles were found in the uploaded data.');
        return;
      }

      // Auto SEO enhancement if toggled
      if (autoSeoEnabled) {
        articlesToSave.forEach(art => {
          if (!art.seo || !art.seo.seoTitle || !art.seo.primaryKeyword) {
            const seo = autoGenerateSeo(art);
            art.seo = {
              seoTitle: seo.seoTitle,
              metaDescription: seo.metaDescription,
              primaryKeyword: seo.primaryKeyword,
              secondaryKeywords: seo.secondaryKeywords,
              lsiKeywords: seo.lsiKeywords,
              canonicalUrl: seo.canonicalUrl,
            };
          }
        });
      }

      const stats = await bulkUploadArticles(articlesToSave);
      setResultStats(stats);
      setStatus('done');
      setMessage(`Successfully imported ${articlesToSave.length} article(s)!`);
      setTimeout(() => {
        onSuccess(articlesToSave.length);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'Failed to parse and upload articles.');
    }
  };

  const downloadSampleTemplate = () => {
    const sampleArticle: Partial<Article> = {
      title: "Reinforced Concrete Cantilever Retaining Wall Design Guide",
      slug: "retaining-wall-design-guide",
      category: "geotech",
      excerpt: "Step-by-step engineering principles for sizing stem, toe, and heel in cantilever retaining walls under Rankine lateral soil pressures.",
      author: "Civil Engineering Lead",
      status: "published",
      tags: ["geotechnical", "retaining-wall", "earth-pressure"],
      content: "Detailed markdown content discussing Rankine earth pressure theory, stability against overturning, sliding factor of safety, and reinforcement detailing.",
      introduction: "Cantilever retaining walls are the most prevalent earth retention systems in highway, residential, and infrastructure construction.",
      theory: "Lateral earth pressure is evaluated using Rankine active coefficient Ka = (1 - sinφ) / (1 + sinφ).",
      formulas: [
        {
          name: "Active Earth Pressure Force",
          equation: "Pa = 0.5 × Ka × γ × H²",
          variables: [
            { symbol: "Ka", meaning: "Active earth pressure coefficient", unit: "dimensionless" },
            { symbol: "γ", meaning: "Soil unit weight", unit: "kN/m³" },
            { symbol: "H", meaning: "Wall height", unit: "m" }
          ]
        }
      ],
      faqs: [
        {
          question: "What is the recommended factor of safety against overturning?",
          answer: "Most structural codes recommend a minimum factor of safety of 1.5 to 2.0 against overturning."
        }
      ],
      seo: {
        seoTitle: "Cantilever Retaining Wall Design Guide & Earth Pressure | CivilMath",
        metaDescription: "Master cantilever retaining wall design: Rankine earth pressure formulas, stability checks, and reinforcement detailing with CivilMath.",
        primaryKeyword: "cantilever retaining wall design",
        secondaryKeywords: ["rankine earth pressure", "retaining wall stability", "sliding factor of safety"],
        lsiKeywords: ["active earth pressure", "heel slab reinforcement", "stem rebar detailing"]
      }
    };

    const blob = new Blob([JSON.stringify([sampleArticle], null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'civilmath-article-sample.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D8D0C2] dark:border-[#333C33] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#657565]/15 text-[#657565] flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#20231F] dark:text-[#EAE7E0]">Upload & Import Articles</h2>
              <p className="text-[11px] text-[#7B8978]">Upload single or bulk articles via JSON or Markdown (.md)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7B8978] hover:text-[#20231F] dark:hover:text-white hover:bg-[#EAE7E0] dark:hover:bg-[#2A312A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-[#D8D0C2] dark:border-[#333C33] pb-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('files')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'files'
                    ? 'bg-[#657565] text-white'
                    : 'text-[#7B8978] hover:text-[#20231F] dark:hover:text-white'
                }`}
              >
                Upload Files (.json, .md)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-[#657565] text-white'
                    : 'text-[#7B8978] hover:text-[#20231F] dark:hover:text-white'
                }`}
              >
                Direct Paste JSON / Text
              </button>
            </div>

            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="flex items-center gap-1.5 text-[11px] text-[#657565] dark:text-[#8FA18F] hover:underline cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Download Sample JSON
            </button>
          </div>

          {activeTab === 'files' ? (
            <div>
              {/* Drag and Drop Box */}
              <div
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragActive(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-[#657565] bg-[#657565]/10'
                    : 'border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565] bg-white/50 dark:bg-[#252B25]/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".json,.md,.txt,.markdown"
                  className="hidden"
                  onChange={e => handleFiles(e.target.files)}
                />
                <div className="w-12 h-12 rounded-2xl bg-[#657565]/10 text-[#657565] flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0]">
                  Click or drag files here to upload
                </p>
                <p className="text-[11px] text-[#7B8978] mt-1">
                  Supports multiple JSON files or Markdown (.md) documents
                </p>
              </div>

              {/* File list */}
              {fileList.length > 0 && (
                <div className="mt-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#7B8978]">
                    Selected Files ({fileList.length})
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {fileList.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-[#657565] shrink-0" />
                          <span className="truncate font-medium text-[#20231F] dark:text-[#EAE7E0]">{file.name}</span>
                          <span className="text-[10px] text-[#7B8978] font-mono shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removeFile(i); }}
                          className="text-[#94A094] hover:text-[#B56F50] p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0] mb-1.5">
                Paste JSON Array or Markdown text
              </label>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Paste [ { &quot;title&quot;: &quot;...&quot;, &quot;slug&quot;: &quot;...&quot;, ... } ] or # Markdown article..."
                rows={10}
                className="w-full text-xs font-mono p-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565] resize-none"
              />
            </div>
          )}

          {/* Auto SEO Option */}
          <div className="p-4 rounded-xl bg-[#657565]/8 border border-[#657565]/20 flex items-start gap-3">
            <input
              type="checkbox"
              id="auto-seo-upload"
              checked={autoSeoEnabled}
              onChange={e => setAutoSeoEnabled(e.target.checked)}
              className="mt-0.5 rounded text-[#657565] focus:ring-[#657565] cursor-pointer"
            />
            <label htmlFor="auto-seo-upload" className="text-xs cursor-pointer">
              <span className="font-bold text-[#20231F] dark:text-[#EAE7E0] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#657565]" />
                Auto-generate & Optimize SEO during import
              </span>
              <p className="text-[11px] text-[#7B8978] mt-0.5">
                Automatically analyzes content to generate optimal 50-60 character SEO titles, meta descriptions, primary & secondary keywords, and clean URL slugs for any uploaded article missing SEO metadata.
              </p>
            </label>
          </div>

          {/* Feedback messages */}
          {status === 'done' && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{message} (Added: {resultStats?.added}, Updated: {resultStats?.updated})</span>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#D8D0C2] dark:border-[#333C33] bg-white/40 dark:bg-[#1E221E]/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={status === 'processing' || (activeTab === 'files' && fileList.length === 0 && !rawText)}
            onClick={handleProcessUpload}
            className="px-5 py-2.5 bg-[#657565] hover:bg-[#536153] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
          >
            {status === 'processing' ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Import All Articles
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
