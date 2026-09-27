import React, { useState } from 'react';
import { ExternalLink, Maximize2, X } from 'lucide-react';
import { ImageBlockData } from '../../types/article';

export interface DiagramCardProps {
  url: string;
  alt?: string;
  caption?: string;
  figureNumber?: string;
  layout?: 'full' | 'standard' | 'small' | 'two-column';
  link?: string;
}

export default function DiagramCard({
  url,
  alt = 'Civil engineering diagram',
  caption,
  figureNumber,
  layout = 'standard',
  link,
}: DiagramCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!url) return null;

  const widthClass =
    layout === 'full'
      ? 'w-full'
      : layout === 'small'
      ? 'max-w-md mx-auto'
      : 'max-w-2xl mx-auto';

  return (
    <>
      <figure className={`my-8 ${widthClass} space-y-2`}>
        <div className="group relative rounded-2xl overflow-hidden border border-[#D8D0C2] dark:border-[#384238] bg-[#FAF9F6] dark:bg-[#1E221E] shadow-2xs">
          <img
            src={url}
            alt={alt}
            loading="lazy"
            className="w-full h-auto max-h-[500px] object-contain mx-auto transition-transform group-hover:scale-[1.01]"
          />

          <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="p-1.5 text-white hover:text-emerald-400 transition-colors cursor-pointer"
              title="View full size diagram"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-white hover:text-emerald-400 transition-colors"
                title="Open related link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {(figureNumber || caption) && (
          <figcaption className="text-center px-4 py-1 text-xs font-mono text-[#7B8978] leading-relaxed">
            {figureNumber && (
              <strong className="text-[#20231F] dark:text-[#EAE7E0] mr-1.5">
                {figureNumber}
              </strong>
            )}
            {caption && <span>{caption}</span>}
          </figcaption>
        )}
      </figure>

      {/* Lightbox Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] bg-white dark:bg-[#1E221E] rounded-2xl overflow-hidden p-2 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={url}
              alt={alt}
              className="w-full h-auto max-h-[82vh] object-contain rounded-xl"
            />
            {(figureNumber || caption) && (
              <div className="p-3 text-center text-xs font-mono text-[#7B8978]">
                {figureNumber && <strong className="text-[#20231F] dark:text-[#EAE7E0] mr-1">{figureNumber}: </strong>}
                {caption}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
