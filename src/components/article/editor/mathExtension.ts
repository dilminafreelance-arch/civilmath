import { Node, mergeAttributes } from '@tiptap/core';
import katex from 'katex';

export interface MathOptions {
  openFormulaModal?: (latex: string, isBlock: boolean, onSave: (newLatex: string) => void) => void;
}

/**
 * Render KaTeX HTML safely with fallback
 */
export function renderKatexHtml(latex: string, displayMode: boolean): string {
  if (!latex || !latex.trim()) return '';
  try {
    return katex.renderToString(latex.trim(), {
      displayMode,
      throwOnError: false,
    });
  } catch (err: any) {
    return `<span class="katex-error text-rose-500 font-mono text-xs">Error: ${err?.message || 'Invalid formula'}</span>`;
  }
}

/**
 * Inline Math Node ($...$)
 */
export const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: element => element.getAttribute('data-latex') || element.textContent || '',
        renderHTML: attributes => ({
          'data-type': 'math-inline',
          'data-latex': attributes.latex,
          class: 'math-inline inline-block px-1.5 py-0.5 rounded cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math-inline"]',
      },
      {
        tag: 'span[data-latex]',
      },
      {
        tag: 'span.math-inline',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const latex = node.attrs.latex || '';
    const rendered = renderKatexHtml(latex, false);
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'math-inline',
        'data-latex': latex,
      }),
      0, // Or render KaTeX span
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('span');
      dom.className = 'math-inline inline-block px-1.5 py-0.5 rounded cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors border border-transparent hover:border-purple-300 select-none';
      dom.setAttribute('data-type', 'math-inline');
      dom.setAttribute('data-latex', node.attrs.latex);

      const render = () => {
        const latex = node.attrs.latex;
        dom.innerHTML = renderKatexHtml(latex, false);
      };

      render();

      dom.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = typeof getPos === 'function' ? getPos() : null;
        if (pos !== null) {
          editor.commands.setNodeSelection(pos);
          const currentLatex = node.attrs.latex;
          // Dispatch custom event for modal edit
          const event = new CustomEvent('edit-math-formula', {
            detail: {
              latex: currentLatex,
              isBlock: false,
              pos,
            },
          });
          window.dispatchEvent(event);
        }
      });

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) return false;
          if (updatedNode.attrs.latex !== node.attrs.latex) {
            dom.setAttribute('data-latex', updatedNode.attrs.latex);
            dom.innerHTML = renderKatexHtml(updatedNode.attrs.latex, false);
          }
          return true;
        },
      };
    };
  },
});

/**
 * Block Math Node ($$...$$)
 */
export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  inline: false,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: element => element.getAttribute('data-latex') || element.textContent || '',
        renderHTML: attributes => ({
          'data-type': 'math-block',
          'data-latex': attributes.latex,
          class: 'math-block my-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-center overflow-x-auto cursor-pointer hover:border-purple-400 transition-colors',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-block"]',
      },
      {
        tag: 'div[data-latex]',
      },
      {
        tag: 'div.math-block',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const latex = node.attrs.latex || '';
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'math-block',
        'data-latex': latex,
      }),
      0,
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.className = 'math-block my-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-center overflow-x-auto cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors select-none';
      dom.setAttribute('data-type', 'math-block');
      dom.setAttribute('data-latex', node.attrs.latex);

      const render = () => {
        const latex = node.attrs.latex;
        dom.innerHTML = renderKatexHtml(latex, true);
      };

      render();

      dom.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = typeof getPos === 'function' ? getPos() : null;
        if (pos !== null) {
          editor.commands.setNodeSelection(pos);
          const currentLatex = node.attrs.latex;
          // Dispatch custom event for modal edit
          const event = new CustomEvent('edit-math-formula', {
            detail: {
              latex: currentLatex,
              isBlock: true,
              pos,
            },
          });
          window.dispatchEvent(event);
        }
      });

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) return false;
          if (updatedNode.attrs.latex !== node.attrs.latex) {
            dom.setAttribute('data-latex', updatedNode.attrs.latex);
            dom.innerHTML = renderKatexHtml(updatedNode.attrs.latex, true);
          }
          return true;
        },
      };
    };
  },
});
