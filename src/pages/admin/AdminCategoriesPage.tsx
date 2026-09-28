import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Edit3, Trash2, Save, X, Image as ImageIcon,
  Tag, FileText, ArrowLeft, CheckCircle2, AlertCircle,
  Layers, Globe, Cpu, Building2, Ruler, Wrench, Calculator
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { SEOHead } from '../../utils/seo';

// ── Category Data Types ──────────────────────────────────────────────────────

interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  coverImage?: string;
  seoTitle: string;
  metaDescription: string;
  articleCount?: number;
  color: string;
}

// ── Default Built-in Categories ───────────────────────────────────────────────

const DEFAULT_CATEGORIES: ArticleCategory[] = [
  {
    id: 'concrete',
    name: 'Concrete & Materials',
    slug: 'concrete',
    description: 'Concrete volume, mix design, reinforcement, material estimation and quality control guides.',
    icon: 'Building2',
    color: '#64748B',
    seoTitle: 'Concrete Engineering Guides | CivilMath',
    metaDescription: 'In-depth civil engineering guides on concrete volume calculation, mix ratios, reinforcement, and material estimation.',
    articleCount: 18,
  },
  {
    id: 'structural',
    name: 'Structural Analysis',
    slug: 'structural',
    description: 'Beam design, column capacity, slab deflection, steel section weights, and structural code references.',
    icon: 'Layers',
    color: '#2563EB',
    seoTitle: 'Structural Engineering Guides | CivilMath',
    metaDescription: 'Structural engineering guides covering beam analysis, column design, slab deflection and IS/BS/ACI code compliance.',
    articleCount: 14,
  },
  {
    id: 'bbs',
    name: 'Rebar BBS',
    slug: 'bbs',
    description: 'Bar bending schedules for footings, beams, columns, slabs, and raft foundations.',
    icon: 'Calculator',
    color: '#D97706',
    seoTitle: 'Bar Bending Schedule (BBS) Guides | CivilMath',
    metaDescription: 'Complete BBS guides for isolated footings, beams, columns, slabs, and raft foundations with worked examples.',
    articleCount: 9,
  },
  {
    id: 'geotech',
    name: 'Geotechnical',
    slug: 'geotech',
    description: 'Soil bearing capacity, retaining wall design, earth pressure calculations, and foundation sizing.',
    icon: 'Globe',
    color: '#059669',
    seoTitle: 'Geotechnical Engineering Guides | CivilMath',
    metaDescription: 'Geotechnical engineering guides on bearing capacity, retaining walls, and earth pressure using Terzaghi and Rankine methods.',
    articleCount: 7,
  },
  {
    id: 'survey',
    name: 'Surveying',
    slug: 'survey',
    description: 'Height of instrument, coordinate traversing, leveling, and setting-out guides.',
    icon: 'Ruler',
    color: '#7C3AED',
    seoTitle: 'Surveying Engineering Guides | CivilMath',
    metaDescription: 'Civil engineering surveying guides covering HI method, coordinate traverse, and Bowditch adjustment.',
    articleCount: 6,
  },
  {
    id: 'utility',
    name: 'Engineering Utilities',
    slug: 'utility',
    description: 'Unit conversion, material property tables, and engineering reference guides.',
    icon: 'Wrench',
    color: '#DC2626',
    seoTitle: 'Engineering Utilities & Reference Guides | CivilMath',
    metaDescription: 'Civil engineering utility guides including unit conversion, material properties, and construction reference tables.',
    articleCount: 4,
  },
  {
    id: 'general',
    name: 'General Engineering',
    slug: 'general',
    description: 'General civil engineering concepts, site management, BOQ, estimation, and professional practice.',
    icon: 'Cpu',
    color: '#0891B2',
    seoTitle: 'General Civil Engineering Guides | CivilMath',
    metaDescription: 'General civil engineering articles covering site management, BOQ preparation, cost estimation, and construction practice.',
    articleCount: 12,
  },
];

// ── Icon Map ──────────────────────────────────────────────────────────────────

const ICON_OPTIONS = [
  { id: 'Building2', label: 'Building', component: Building2 },
  { id: 'Layers', label: 'Layers', component: Layers },
  { id: 'Calculator', label: 'Calculator', component: Calculator },
  { id: 'Globe', label: 'Globe', component: Globe },
  { id: 'Ruler', label: 'Ruler', component: Ruler },
  { id: 'Wrench', label: 'Wrench', component: Wrench },
  { id: 'Cpu', label: 'Cpu', component: Cpu },
  { id: 'FileText', label: 'Document', component: FileText },
  { id: 'Tag', label: 'Tag', component: Tag },
];

const COLOR_OPTIONS = [
  '#64748B', '#2563EB', '#D97706', '#059669',
  '#7C3AED', '#DC2626', '#0891B2', '#EC4899',
  '#0D9488', '#4F46E5', '#EA580C', '#16A34A',
];

function IconComponent({ name, className }: { name: string; className?: string }) {
  const found = ICON_OPTIONS.find(i => i.id === name);
  if (!found) return <FileText className={className} />;
  const Comp = found.component;
  return <Comp className={className} />;
}

// ── Category Form ─────────────────────────────────────────────────────────────

interface CategoryFormProps {
  initial?: Partial<ArticleCategory>;
  onSave: (cat: ArticleCategory) => void;
  onCancel: () => void;
}

function CategoryForm({ initial, onSave, onCancel }: CategoryFormProps) {
  const [form, setForm] = useState<Partial<ArticleCategory>>({
    id: '',
    name: '',
    slug: '',
    description: '',
    icon: 'Building2',
    color: '#64748B',
    seoTitle: '',
    metaDescription: '',
    ...initial,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const slugify = (str: string) =>
    str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = 'Category name is required';
    if (!form.slug?.trim()) e.slug = 'Slug is required';
    if (!form.description?.trim()) e.description = 'Description is required';
    if (!form.seoTitle?.trim()) e.seoTitle = 'SEO title is required';
    if (!form.metaDescription?.trim()) e.metaDescription = 'Meta description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(form as ArticleCategory);
  };

  const update = (field: keyof ArticleCategory, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !initial?.slug) {
        next.slug = slugify(value);
        if (!next.seoTitle) {
          next.seoTitle = `${value} Engineering Guides | CivilMath`;
        }
      }
      return next;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const inputClass = (field: string) =>
    `w-full text-xs px-3.5 py-2.5 rounded-xl border ${
      errors[field]
        ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20'
        : 'border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#252B25]'
    } text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565] transition-colors`;

  return (
    <div className="space-y-5">
      {/* Name + Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">
            Category Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.name || ''}
            onChange={e => update('name', e.target.value)}
            placeholder="e.g. Concrete & Materials"
            className={inputClass('name')}
          />
          {errors.name && (
            <p className="text-[10px] text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{errors.name}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">
            URL Slug <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={form.slug || ''}
              onChange={e => update('slug', slugify(e.target.value))}
              placeholder="concrete-materials"
              className={inputClass('slug')}
            />
          </div>
          {errors.slug && (
            <p className="text-[10px] text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{errors.slug}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">
          Description <span className="text-rose-500">*</span>
        </label>
        <textarea
          value={form.description || ''}
          onChange={e => update('description', e.target.value)}
          rows={2}
          placeholder="Brief description of this category..."
          className={`${inputClass('description')} resize-none`}
        />
        {errors.description && (
          <p className="text-[10px] text-rose-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{errors.description}
          </p>
        )}
      </div>

      {/* Icon + Color */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">Icon</label>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {ICON_OPTIONS.map(ic => (
              <button
                key={ic.id}
                type="button"
                onClick={() => update('icon', ic.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  form.icon === ic.id
                    ? 'border-[#657565] bg-[#657565]/10'
                    : 'border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565]'
                }`}
                title={ic.label}
              >
                <ic.component className="w-4 h-4 text-[#657565]" />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">Color</label>
          <div className="grid grid-cols-6 gap-2">
            {COLOR_OPTIONS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => update('color', color)}
                className={`w-8 h-8 rounded-lg border-2 transition-all cursor-pointer ${
                  form.color === color ? 'border-[#20231F] dark:border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg border border-[#D8D0C2]" style={{ backgroundColor: form.color }} />
            <input
              type="text"
              value={form.color || ''}
              onChange={e => update('color', e.target.value)}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#252B25] text-[#20231F] dark:text-[#EAE7E0] outline-none font-mono"
              placeholder="#657565"
            />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="space-y-3 p-4 bg-[#FAF9F6] dark:bg-[#252B25]/50 border border-[#D8D0C2] dark:border-[#384238] rounded-xl">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#7B8978] font-mono">SEO Settings</h4>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
              SEO Title <span className="text-rose-500">*</span>
            </label>
            <span className="text-[10px] font-mono text-[#7B8978]">{(form.seoTitle || '').length}/60</span>
          </div>
          <input
            type="text"
            value={form.seoTitle || ''}
            onChange={e => update('seoTitle', e.target.value)}
            placeholder="e.g. Concrete Engineering Guides | CivilMath"
            className={inputClass('seoTitle')}
          />
          {errors.seoTitle && (
            <p className="text-[10px] text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{errors.seoTitle}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
              Meta Description <span className="text-rose-500">*</span>
            </label>
            <span className="text-[10px] font-mono text-[#7B8978]">{(form.metaDescription || '').length}/160</span>
          </div>
          <textarea
            value={form.metaDescription || ''}
            onChange={e => update('metaDescription', e.target.value)}
            rows={2}
            placeholder="Brief SEO-optimized description (145-160 characters)..."
            className={`${inputClass('metaDescription')} resize-none`}
          />
          {errors.metaDescription && (
            <p className="text-[10px] text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{errors.metaDescription}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#657565] hover:bg-[#536153] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          {initial?.id ? 'Update Category' : 'Create Category'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#20231F] dark:text-[#EAE7E0] rounded-xl text-xs font-semibold transition-all cursor-pointer hover:border-[#657565]"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ArticleCategory[]>(DEFAULT_CATEGORIES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const handleSaveNew = (cat: ArticleCategory) => {
    const newId = cat.slug || `cat_${Date.now()}`;
    setCategories(prev => [...prev, { ...cat, id: newId, articleCount: 0 }]);
    setShowNewForm(false);
    setSavedId(newId);
    setTimeout(() => setSavedId(null), 3000);
  };

  const handleSaveEdit = (updated: ArticleCategory) => {
    setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
    setEditingId(null);
    setSavedId(updated.id);
    setTimeout(() => setSavedId(null), 3000);
  };

  const handleDelete = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setDeleteConfirmId(null);
  };

  return (
    <AdminLayout>
      <SEOHead
        meta={{
          title: 'Article Categories | CivilMath Admin',
          description: 'Manage CivilMath article categories.',
          path: '/admin/categories',
          noindex: true,
        }}
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="p-2 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#252B25] text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#20231F] dark:text-[#EAE7E0]">
                Article Categories
              </h1>
              <p className="text-xs text-[#7B8978] mt-0.5">
                Manage categories, icons, SEO settings, and descriptions for article organization.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setShowNewForm(true); setEditingId(null); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#657565] hover:bg-[#536153] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Category
          </button>
        </div>

        {/* New Category Form */}
        {showNewForm && (
          <div className="bg-white dark:bg-[#1E221E] border-2 border-[#657565]/30 rounded-2xl p-6 shadow-lg">
            <h3 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] mb-5 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#657565]" />
              Create New Category
            </h3>
            <CategoryForm
              onSave={handleSaveNew}
              onCancel={() => setShowNewForm(false)}
            />
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`bg-[#FAF9F6] dark:bg-[#1E221E] border rounded-2xl shadow-2xs transition-all ${
                savedId === cat.id
                  ? 'border-emerald-400 dark:border-emerald-600'
                  : 'border-[#D8D0C2] dark:border-[#333C33]'
              }`}
            >
              {editingId === cat.id ? (
                /* Edit Form */
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-[#657565]" />
                      Edit: {cat.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg text-[#7B8978] hover:text-[#20231F] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <CategoryForm
                    initial={cat}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                /* View Mode */
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Icon */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cat.color + '18', color: cat.color }}
                      >
                        <IconComponent name={cat.icon} className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0]">
                            {cat.name}
                          </h3>
                          {savedId === cat.id && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" /> Saved
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-[#7B8978]">
                            /articles?category={cat.slug}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAE7E0] dark:bg-[#2A312A] text-[#657565] font-mono font-bold">
                            {cat.articleCount || 0} articles
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7B8978] mt-1.5 leading-relaxed line-clamp-2">
                          {cat.description}
                        </p>

                        {/* SEO Preview */}
                        <div className="mt-3 p-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl space-y-1">
                          <p className="text-[10px] font-mono text-[#7B8978] uppercase tracking-wider">SEO</p>
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 line-clamp-1">
                            {cat.seoTitle}
                          </p>
                          <p className="text-[11px] text-[#7B8978] line-clamp-2">
                            {cat.metaDescription}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => { setEditingId(cat.id); setShowNewForm(false); }}
                        className="p-1.5 rounded-lg text-[#657565] hover:bg-[#657565]/10 cursor-pointer transition-colors"
                        title="Edit category"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirmId === cat.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id)}
                            className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-1 text-[10px] text-[#7B8978] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(cat.id)}
                          className="p-1.5 rounded-lg text-[#7B8978] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#EAF2ED] dark:bg-[#1A2A1E] border border-[#657565]/20">
          <div className="w-8 h-8 rounded-xl bg-[#657565]/15 text-[#657565] flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">
              Category Management Notes
            </p>
            <p className="text-[11px] text-[#7B8978] leading-relaxed mt-0.5">
              Category changes are applied to new and edited articles. The built-in categories (concrete, structural, bbs, geotech, survey, utility, general) 
              map directly to calculator sections and cannot be deleted. Custom categories can be freely managed. 
              SEO titles and meta descriptions are used for category landing pages.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
