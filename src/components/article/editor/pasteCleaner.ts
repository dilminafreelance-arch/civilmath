/**
 * Strict paste cleaner for CivilMath article editor.
 * Strips all inline styles, arbitrary font sizes, font families, and messy wrappers from
 * Microsoft Word, Google Docs, or web pastes.
 * Ensures consistent, semantic formatting throughout all articles.
 */

export function cleanPastedHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') return '';

  // 1. Pre-strip HTML comments, XML processing instructions, and Word conditionals
  let html = rawHtml
    .replace(/<!--[\s\S]*?-->/gi, '')
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!\[if[\s\S]*?<!\[endif\]>/gi, '');

  // 2. Parse HTML safely with DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  if (!body) return '';

  // 3. Remove forbidden top-level / embedded metadata tags
  const forbiddenTags = ['style', 'script', 'meta', 'link', 'title', 'xml', 'o:p'];
  forbiddenTags.forEach(tag => {
    const elements = body.querySelectorAll(tag);
    elements.forEach(el => el.remove());
  });

  // 4. Recursive sanitizer
  cleanElement(body);

  // Return clean inner HTML
  return body.innerHTML.trim();
}

const ALLOWED_TAGS = new Set([
  'H1', 'H2', 'H3', 'H4', 'P', 'UL', 'OL', 'LI', 'BLOCKQUOTE',
  'STRONG', 'B', 'EM', 'I', 'U', 'S', 'CODE', 'PRE', 'HR', 'BR',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
  'A', 'IMG', 'FIGURE', 'FIGCAPTION', 'SPAN', 'DIV'
]);

function cleanElement(node: Node) {
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
      continue;
    }

    if (child.nodeType === Node.TEXT_NODE) {
      continue;
    }

    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tagName = el.tagName.toUpperCase();

      // Check if tag is disallowed
      if (!ALLOWED_TAGS.has(tagName)) {
        // Unwrap children
        while (el.firstChild) {
          el.parentNode?.insertBefore(el.firstChild, el);
        }
        el.remove();
        continue;
      }

      // Check for Google Docs specific bug: <b style="font-weight:normal">
      const style = el.getAttribute('style') || '';
      const isWeightNormal = /font-weight\s*:\s*(normal|400)/i.test(style);
      if ((tagName === 'B' || tagName === 'STRONG') && isWeightNormal) {
        // This is a fake bold from Google Docs, unwrap it
        while (el.firstChild) {
          el.parentNode?.insertBefore(el.firstChild, el);
        }
        el.remove();
        continue;
      }

      // Unwrap generic spans or divs that have no math annotations
      const isMathSpan = el.hasAttribute('data-latex') || el.classList.contains('math-inline');
      const isMathBlock = el.hasAttribute('data-latex') || el.classList.contains('math-block');

      if ((tagName === 'SPAN' && !isMathSpan) || (tagName === 'DIV' && !isMathBlock)) {
        cleanElement(el);
        while (el.firstChild) {
          el.parentNode?.insertBefore(el.firstChild, el);
        }
        el.remove();
        continue;
      }

      // Strip ALL style attributes (strips font-size, font-family, inline colors, margins)
      el.removeAttribute('style');

      // Strip all class names except our allowed math/table identifiers
      if (isMathSpan) {
        el.className = 'math-inline';
      } else if (isMathBlock) {
        el.className = 'math-block';
      } else {
        el.removeAttribute('class');
      }

      // Strip Microsoft Word & generic noise attributes
      const attrsToRemove = [
        'id', 'dir', 'align', 'valign', 'lang', 'face', 'size', 'color',
        'border', 'cellspacing', 'cellpadding', 'bgcolor', 'width', 'height'
      ];
      attrsToRemove.forEach(attr => el.removeAttribute(attr));

      // Specific tag attribute cleaning
      if (tagName === 'A') {
        const href = el.getAttribute('href');
        if (!href || href.startsWith('javascript:')) {
          el.removeAttribute('href');
        } else {
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener noreferrer');
        }
      } else if (tagName === 'IMG') {
        const src = el.getAttribute('src');
        if (!src) {
          el.remove();
          continue;
        }
        // Retain alt text if present, clean up junk
        const alt = el.getAttribute('alt') || 'Article diagram';
        el.setAttribute('alt', alt);
      } else if (tagName === 'TH' || tagName === 'TD') {
        // Keep colspan and rowspan if valid numbers
        const colspan = el.getAttribute('colspan');
        const rowspan = el.getAttribute('rowspan');
        if (colspan && Number(colspan) > 1) el.setAttribute('colspan', colspan);
        else el.removeAttribute('colspan');
        if (rowspan && Number(rowspan) > 1) el.setAttribute('rowspan', rowspan);
        else el.removeAttribute('rowspan');
      }

      // Clean children recursively
      cleanElement(el);
    }
  }
}
