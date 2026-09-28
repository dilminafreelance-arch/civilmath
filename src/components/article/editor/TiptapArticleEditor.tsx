import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  Bold, Italic, Underline as UnderlineIcon, Heading2, Heading3,
  Pilcrow, List, ListOrdered, Quote, Table as TableIcon,
  Link as LinkIcon, Minus, Undo, Redo, Sigma, Image as ImageIcon,
  Check, X
} from 'lucide-react';
import { cleanPastedHtml } from './pasteCleaner';
import { MathInline, MathBlock } from './mathExtension';
import FormulaModal from './FormulaModal';
import ImageModal, { ImageInsertData } from './ImageModal';
import { uploadArticleImage } from '../../../utils/articleStore';

export interface TiptapArticleEditorProps {
  content: string;
  onChange: (html: string) => void;
  articleSlug?: string;
  placeholder?: string;
}

export default function TiptapArticleEditor({
  content,
  onChange,
  articleSlug = 'article',
  placeholder = 'Write your civil engineering article with formulas, tables, and photos...',
}: TiptapArticleEditorProps) {
  // Modals state
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<{ latex: string; isBlock: boolean; pos?: number } | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isLinkPromptOpen, setIsLinkPromptOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Formula edit listener from NodeView clicks
  useEffect(() => {
    const handleEditMath = (e: CustomEvent) => {
      const { latex, isBlock, pos } = e.detail;
      setEditingFormula({ latex, isBlock, pos });
      setIsFormulaModalOpen(true);
    };
    window.addEventListener('edit-math-formula' as any, handleEditMath as EventListener);
    return () => window.removeEventListener('edit-math-formula' as any, handleEditMath as EventListener);
  }, []);

  const handlePastedImageFile = useCallback(async (file: File) => {
    try {
      const { url } = await uploadArticleImage(file, articleSlug);
      if (editor && url) {
        editor.chain().focus().setImage({ src: url, alt: file.name.replace(/\.[^/.]+$/, '') }).run();
      }
    } catch (err) {
      console.error('Failed to upload pasted image:', err);
    }
  }, [articleSlug]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        dropcursor: {
          color: '#059669',
          width: 2,
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:text-emerald-800 transition-colors',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-2xl max-w-full h-auto my-6 border border-stone-200 dark:border-stone-800 shadow-xs',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'w-full my-6 border-collapse border border-stone-300 dark:border-stone-700 rounded-xl overflow-hidden text-sm',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'p-3 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-bold text-left text-stone-900 dark:text-white',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'p-3 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200',
        },
      }),
      MathInline,
      MathBlock,
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'tiptap-content outline-none min-h-[460px] max-w-[720px] mx-auto text-[18px] leading-[1.7] text-stone-900 dark:text-stone-100 py-6 px-4 sm:px-6',
      },
      transformPastedHTML(rawHtml) {
        return cleanPastedHtml(rawHtml);
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
              const file = items[i].getAsFile();
              if (file) {
                event.preventDefault();
                handlePastedImageFile(file);
                return true;
              }
            }
          }
        }
        return false;
      },
      handleDrop(view, event, slice, moved) {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handlePastedImageFile(file);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Keep editor content in sync with external updates if changed
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Only set if different to avoid cursor jumps
      const current = editor.getHTML();
      if (content && current !== content) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [content, editor]);

  // Insert formula handler
  const handleInsertFormula = (latex: string, isBlock: boolean) => {
    if (!editor) return;

    if (editingFormula && typeof editingFormula.pos === 'number') {
      editor
        .chain()
        .focus()
        .setNodeSelection(editingFormula.pos)
        .deleteSelection()
        .run();
    }

    if (isBlock) {
      editor.chain().focus().insertContent({
        type: 'mathBlock',
        attrs: { latex },
      }).run();
    } else {
      editor.chain().focus().insertContent({
        type: 'mathInline',
        attrs: { latex },
      }).run();
    }

    setEditingFormula(null);
  };

  // Insert image handler
  const handleInsertImage = (data: ImageInsertData) => {
    if (!editor) return;

    if (data.caption) {
      const alignClass = data.alignment === 'center' ? 'max-w-xl mx-auto' : 'w-full';
      const figureHtml = `
        <figure class="my-6 ${alignClass} text-center">
          <img src="${data.url}" alt="${data.alt}" class="rounded-2xl w-full h-auto border border-stone-200 dark:border-stone-800 shadow-xs" />
          <figcaption class="mt-2 text-xs font-mono text-stone-500 text-center">${data.caption}</figcaption>
        </figure>
      `;
      editor.chain().focus().insertContent(figureHtml).run();
    } else {
      editor.chain().focus().setImage({ src: data.url, alt: data.alt }).run();
    }
  };

  // Link helper
  const handleSetLink = () => {
    if (!editor) return;
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run();
      setIsLinkPromptOpen(false);
      return;
    }
    const validUrl = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') || linkUrl.startsWith('/')
      ? linkUrl
      : `https://${linkUrl}`;
    editor.chain().focus().setLink({ href: validUrl }).run();
    setLinkUrl('');
    setIsLinkPromptOpen(false);
  };

  if (!editor) return null;

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      {/* Sticky Fixed Style Set Toolbar */}
      <div className="sticky top-0 z-20 bg-stone-100/95 dark:bg-stone-800/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-700/80 px-3 py-2 flex flex-wrap items-center gap-1">
        {/* Headings & Text */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
              : 'hover:bg-stone-200/80 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-300'
          }`}
          title="Heading 2"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
              : 'hover:bg-stone-200/80 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-300'
          }`}
          title="Heading 3"
        >
          H3
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
            editor.isActive('paragraph')
              ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
              : 'hover:bg-stone-200/80 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-300'
          }`}
          title="Paragraph"
        >
          <Pilcrow className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-stone-300 dark:bg-stone-600 mx-1" />

        {/* Formatting Marks */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('bold')
              ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
              : 'hover:bg-stone-200/80 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-300'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('italic')
              ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
              : 'hover:bg-stone-200/80 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-300'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('underline')
              ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
              : 'hover:bg-stone-200/80 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-300'
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-stone-300 dark:bg-stone-600 mx-1" />

        {/* Lists & Quotes */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
              : 'hover:bg-stone-200/80 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-300'
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
              : 'hover:bg-stone-200/80 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-300'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
              : 'hover:bg-stone-200/80 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-300'
          }`}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>

        {/* Table Insert */}
        <button
          type="button"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('table')
              ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
              : 'hover:bg-stone-200/80 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-300'
          }`}
          title="Insert Table (3x3)"
        >
          <TableIcon className="w-4 h-4" />
        </button>

        {/* Link Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();
              } else {
                setLinkUrl('');
                setIsLinkPromptOpen(true);
              }
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('link')
                ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                : 'hover:bg-stone-200/80 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-300'
            }`}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          {isLinkPromptOpen && (
            <div className="absolute left-0 top-full mt-1 z-30 p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg flex items-center gap-1.5 w-64 animate-in fade-in">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSetLink();
                  if (e.key === 'Escape') setIsLinkPromptOpen(false);
                }}
                className="w-full text-xs p-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg outline-none"
              />
              <button
                type="button"
                onClick={handleSetLink}
                className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsLinkPromptOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Horizontal Divider */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-lg hover:bg-stone-200/80 dark:hover:bg-stone-700/60 text-stone-700 dark:text-stone-300 transition-colors"
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-stone-300 dark:bg-stone-600 mx-1" />

        {/* Math Formula Button */}
        <button
          type="button"
          onClick={() => {
            setEditingFormula(null);
            setIsFormulaModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-200 dark:hover:bg-purple-900/60 text-xs font-bold transition-all"
          title="Insert KaTeX Math Formula"
        >
          <Sigma className="w-4 h-4" />
          <span>Formula</span>
        </button>

        {/* Image Upload Button */}
        <button
          type="button"
          onClick={() => setIsImageModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 text-xs font-bold transition-all"
          title="Insert or Upload Image (WebP auto-optimized)"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Photo</span>
        </button>

        <div className="flex-1" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg hover:bg-stone-200/80 dark:hover:bg-stone-700/60 disabled:opacity-30 text-stone-700 dark:text-stone-300 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg hover:bg-stone-200/80 dark:hover:bg-stone-700/60 disabled:opacity-30 text-stone-700 dark:text-stone-300 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Main Canvas with Fixed Styles */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-stone-900">
        <EditorContent editor={editor} />
      </div>

      {/* Formula Modal */}
      <FormulaModal
        isOpen={isFormulaModalOpen}
        onClose={() => {
          setIsFormulaModalOpen(false);
          setEditingFormula(null);
        }}
        onInsert={handleInsertFormula}
        initialLatex={editingFormula?.latex || ''}
        initialIsBlock={editingFormula ? editingFormula.isBlock : true}
      />

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onInsert={handleInsertImage}
        articleSlug={articleSlug}
      />
    </div>
  );
}
