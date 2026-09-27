import React from 'react';
import { Table as TableIcon } from 'lucide-react';
import { TableBlockData } from '../../types/article';

export interface TableBlockRendererProps {
  title?: string;
  headers?: string[];
  rows?: string[][];
  caption?: string;
}

export default function TableBlockRenderer({
  title,
  headers = [],
  rows = [],
  caption,
}: TableBlockRendererProps) {
  if (headers.length === 0 && rows.length === 0) return null;

  return (
    <div className="my-6 space-y-2">
      {title && (
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#657565] dark:text-[#9FB19F] uppercase tracking-wider">
          <TableIcon className="w-3.5 h-3.5" />
          <span>{title}</span>
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] overflow-hidden shadow-2xs">
        {/* Responsive horizontal scroll container */}
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-xs font-mono border-collapse min-w-[500px]">
            {headers.length > 0 && (
              <thead>
                <tr className="bg-[#FAF9F6] dark:bg-[#1E221E] border-b border-[#D8D0C2] dark:border-[#384238]">
                  {headers.map((h, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-left font-bold text-[#20231F] dark:text-[#EAE7E0] uppercase tracking-wider text-[11px] font-mono"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-[#D8D0C2]/50 dark:divide-[#333C33]">
              {rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-[#FAF9F6]/80 dark:hover:bg-[#1E221E]/60 transition-colors"
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-4 py-3 text-xs text-[#333C33] dark:text-[#D1DDD1] ${
                        cIdx === 0 ? 'font-semibold text-[#20231F] dark:text-[#EAE7E0]' : ''
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {caption && (
          <div className="px-4 py-2 border-t border-[#D8D0C2]/50 dark:border-[#333C33] bg-[#FAF9F6] dark:bg-[#1E221E] text-[11px] font-mono text-[#7B8978] text-center">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
}
