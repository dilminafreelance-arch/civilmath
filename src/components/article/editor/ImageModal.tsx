import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { X, Upload, Check, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { uploadArticleImage } from '../../../utils/articleStore';

export interface ImageInsertData {
  url: string;
  alt: string;
  caption?: string;
  alignment: 'full' | 'center';
}

export interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (data: ImageInsertData) => void;
  articleSlug?: string;
}

export default function ImageModal({
  isOpen,
  onClose,
  onInsert,
  articleSlug = 'article',
}: ImageModalProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [alignment, setAlignment] = useState<'full' | 'center'>('full');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setImageUrl('');
      setAltText('');
      setCaption('');
      setAlignment('full');
      setIsUploading(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Handle direct paste inside modal
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileUpload(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, articleSlug]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);

    try {
      const { url } = await uploadArticleImage(file, articleSlug);
      setImageUrl(url);
      if (!altText) {
        const cleanedName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setAltText(cleanedName);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to upload and optimize image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Insert Article Image
              </h3>
              <p className="text-xs text-stone-500">Auto-converts to WebP, optimizes &lt;1600px</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload Dropzone or Thumbnail */}
          {!imageUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-stone-300 dark:border-stone-700 hover:border-emerald-500/80 bg-stone-50/60 dark:bg-stone-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />

              {isUploading ? (
                <div className="space-y-2 py-4">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                    Optimizing to WebP & uploading...
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                      Click to choose image or drag & drop here
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Supports PNG, JPG, WebP. You can also paste directly from clipboard!
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 max-h-56 flex items-center justify-center group">
                <img
                  src={imageUrl}
                  alt={altText || 'Preview'}
                  className="w-full h-auto max-h-56 object-contain"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs transition-colors"
                  title="Change image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Alt Text Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Alt Text <span className="text-rose-500">*</span> (Essential for accessibility & SEO)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="e.g. Concrete slab formwork reinforcement diagram"
                  className="w-full text-xs p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl outline-none focus:border-emerald-500 text-stone-900 dark:text-white"
                />
              </div>

              {/* Caption Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Figure Caption <span className="text-stone-400 font-normal">(Optional description under photo)</span>
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Figure 1: Typical beam cross-section showing main bars and stirrups"
                  className="w-full text-xs p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl outline-none focus:border-emerald-500 text-stone-900 dark:text-white"
                />
              </div>

              {/* Alignment Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Image Alignment
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAlignment('full')}
                    className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      alignment === 'full'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    Full Width (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlignment('center')}
                    className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      alignment === 'center'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    Centered Medium
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!imageUrl || !altText.trim() || isUploading}
            onClick={() => {
              if (imageUrl && altText.trim()) {
                onInsert({
                  url: imageUrl,
                  alt: altText.trim(),
                  caption: caption.trim() || undefined,
                  alignment,
                });
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Insert Image</span>
          </button>
        </div>
      </div>
    </div>
  );
}
