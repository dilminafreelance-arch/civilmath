import fs from "fs";
import path from "path";
import { SHELL_HTML } from "./htmlShell.js";

const SITE_URL = "https://civilmath.com";
const SITE_NAME = "CivilMath";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const TWITTER_HANDLE = "@civilmath";
const JSON_ARTICLE_ID = "ssr-article-data";
const JSON_LIST_ID = "ssr-articles-list";

export const ARTICLE_CRITICAL_CSS = `
.ssr-wrap{max-width:48rem;margin:0 auto;padding:1.5rem 1.25rem 4rem;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#20231F;line-height:1.75}
.ssr-topbar{display:flex;align-items:center;justify-content:space-between;padding:.75rem 0;margin-bottom:1.5rem;border-bottom:1px solid #e7e5e0}
.ssr-topbar a.brand{font-weight:800;font-size:1.05rem;color:#20231F;text-decoration:none;letter-spacing:-.02em}
.ssr-topbar a.home{font-size:.8rem;color:#657565;text-decoration:none}
.ssr-crumb{font-size:.75rem;color:#7B8978;margin-bottom:1rem}
.ssr-crumb a{color:#657565;text-decoration:none}
.ssr-wrap h1{font-size:1.9rem;line-height:1.25;font-weight:800;letter-spacing:-.02em;margin:0 0 .75rem}
.ssr-meta{font-size:.8rem;color:#7B8978;margin-bottom:1.25rem}
.ssr-cover{width:100%;border-radius:1rem;margin:0 0 1.75rem;display:block}
.ssr-excerpt{font-size:1.05rem;color:#3d443c;border-left:3px solid #657565;padding-left:1rem;margin:0 0 1.75rem}
.ssr-body{font-size:1rem}
.ssr-body h2{font-size:1.4rem;font-weight:700;margin:2.25rem 0 .9rem;letter-spacing:-.01em}
.ssr-body h3{font-size:1.15rem;font-weight:700;margin:1.75rem 0 .7rem}
.ssr-body p{margin:0 0 1.1rem}
.ssr-body ul,.ssr-body ol{margin:0 0 1.1rem;padding-left:1.5rem}
.ssr-body li{margin-bottom:.45rem}
.ssr-body strong{font-weight:700}
.ssr-body table{width:100%;border-collapse:collapse;font-size:.9rem;margin:0}
.ssr-body th,.ssr-body td{border:1px solid #e7e5e0;padding:.55rem .75rem;text-align:left}
.ssr-body th{background:#f4f3f0;font-weight:700}
.ssr-table-wrap{margin:1.5rem 0;overflow-x:auto;border:1px solid #e7e5e0;border-radius:.75rem}
.ssr-body img{max-width:100%;border-radius:.75rem}
.ssr-body blockquote{border-left:3px solid #657565;padding-left:1rem;color:#3d443c;margin:0 0 1.1rem}
.ssr-faq{margin-top:2rem}
.ssr-faq dt{font-weight:700;margin-top:.85rem}
.ssr-faq dd{margin:.25rem 0 0;color:#3d443c}
.ssr-related{margin-top:2.25rem;padding-top:1.25rem;border-top:1px solid #e7e5e0}
.ssr-related ul{list-style:none;padding:0;margin:.5rem 0 0;display:grid;gap:.45rem}
.ssr-related a{color:#2E6B56;font-weight:600;text-decoration:none}
.ssr-tags{margin-top:2rem;display:flex;flex-wrap:wrap;gap:.5rem}
.ssr-tags span{font-size:.75rem;background:#f4f3f0;border-radius:9999px;padding:.3rem .8rem;color:#536153}
.ssr-note{margin-top:2.5rem;padding-top:1.25rem;border-top:1px solid #e7e5e0;font-size:.8rem;color:#7B8978}
.ssr-dir-list{list-style:none;padding:0;margin:1.5rem 0;display:grid;gap:.75rem}
.ssr-dir-list li{border:1px solid #e7e5e0;border-radius:.75rem;padding:.9rem 1.1rem;background:#faf9f6}
.ssr-dir-list a{color:#20231F;font-weight:700;text-decoration:none;display:block;font-size:1.02rem;margin-bottom:.25rem}
.ssr-dir-list span{color:#525852;font-size:.88rem;display:block}
`;

export function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function escAttr(s) {
  return escHtml(s).replace(/'/g, "&#39;");
}

export function stripHtml(s) {
  return String(s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveOgImage(raw) {
  const v = String(raw ?? "").trim();
  if (!v || v.startsWith("data:") || v.length > 2000) return DEFAULT_IMAGE;
  if (v.startsWith("/")) return `${SITE_URL}${v}`;
  return v;
}

export function slimArticleForEmbed(article) {
  if (!article || typeof article !== "object") return article;
  const copy = { ...article };
  const cover = String(copy.coverImage || copy.coverImageUrl || "").trim();
  if (cover.startsWith("data:") && copy.slug) {
    const publicUrl = `/article-covers/${encodeURIComponent(copy.slug)}.webp`;
    copy.coverImage = publicUrl;
    copy.coverImageUrl = publicUrl;
    if (copy.seo && typeof copy.seo === "object") {
      copy.seo = { ...copy.seo, ogImage: `${SITE_URL}${publicUrl}` };
    }
  }
  return copy;
}

export function extractArticleFaqs(article) {
  if (!article) return [];
  if (Array.isArray(article.faqs) && article.faqs.length > 0) {
    return article.faqs.filter((f) => f && f.question && f.answer);
  }
  if (Array.isArray(article.blocks)) {
    const faqBlock = article.blocks.find((b) => b && b.type === "faq" && Array.isArray(b.data?.faqs));
    if (faqBlock) {
      const list = faqBlock.data.faqs.filter((f) => f && f.question && f.answer);
      if (list.length > 0) return list;
    }
  }
  if (typeof article.content === "string" && article.content.includes("<h2")) {
    const faqSectionMatch = article.content.match(
      /<h2[^>]*>\s*Frequently Asked Questions\s*<\/h2>([\s\S]*?)(?=<h2\b|$)/i
    );
    if (faqSectionMatch) {
      const section = faqSectionMatch[1];
      const extracted = [];
      const pairRe = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
      let m;
      while ((m = pairRe.exec(section)) !== null) {
        const question = stripHtml(m[1]);
        const answer = stripHtml(m[2]);
        if (question && answer) {
          extracted.push({ question, answer });
        }
      }
      if (extracted.length > 0) return extracted;
    }
  }
  return [];
}

function buildArticleJsonLd(article, canonical, ogImage) {
  const seo = article.seo || {};
  const keywords = [
    seo.primaryKeyword,
    ...(Array.isArray(seo.secondaryKeywords) ? seo.secondaryKeywords : []),
    ...(Array.isArray(article.tags) ? article.tags : []),
  ]
    .filter(Boolean)
    .join(", ");

  const schema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: seo.seoTitle || article.title,
    description: stripHtml(seo.metaDescription || article.excerpt || article.title).slice(0, 300),
    url: canonical,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    image: ogImage,
    datePublished: article.publishedAt || new Date().toISOString(),
    dateModified: article.updatedAt || article.publishedAt || new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: article.author || SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: DEFAULT_IMAGE,
      },
    },
    inLanguage: "en-US",
  };

  if (keywords) {
    schema.keywords = keywords;
  }
  return schema;
}

function buildBreadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

function buildFaqJsonLd(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: stripHtml(f.question),
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtml(f.answer),
      },
    })),
  };
}

function stripExistingSeoAndSplash(html) {
  let out = html;
  // Remove splash loader so SSR content is immediately visible
  out = out.replace(/<div id="cm-splash"[\s\S]*?(?=<div id="root">)/i, "");
  out = out.replace(/<title>[\s\S]*?<\/title>/i, "<title></title>");
  out = out.replace(/<meta[^>]+name=["'](?:description|keywords|robots)["'][^>]*\/?>/gi, "");
  out = out.replace(
    /<meta[^>]+(?:property=["'](?:og|article):[^"']+["']|name=["']twitter:[^"']+["'])[^>]*\/?>/gi,
    ""
  );
  out = out.replace(/<link[^>]+rel=["']canonical["'][^>]*\/?>/gi, "");
  out = out.replace(/<script[^>]+data-rh=["']true["'][^>]*>[\s\S]*?<\/script>/gi, "");
  out = out.replace(
    new RegExp(`<script[^>]+id=["'](?:${JSON_ARTICLE_ID}|${JSON_LIST_ID})["'][^>]*>[\\s\\S]*?<\\/script>`, "gi"),
    ""
  );
  out = out.replace(/<div\s+id=["']root["'][^>]*>[\s\S]*?(?=<\/body>)/i, '<div id="root"></div>\n  ');
  return out;
}

function prepareStaticBodyHtml(article) {
  const parts = [];
  if (article.introduction && !String(article.content || "").includes(article.introduction.slice(0, 40))) {
    parts.push(`<p>${escHtml(article.introduction)}</p>`);
  }
  if (article.content) {
    let raw = String(article.content);
    // Demote any stray <h1> inside article.content to <h2> so the page has exactly one <h1>
    raw = raw.replace(/<h1(\b[^>]*)>/gi, "<h2$1>").replace(/<\/h1>/gi, "</h2>");
    raw = raw.replace(/(<table[\s\S]*?<\/table>)/gi, (m) => {
      if (/ssr-table-wrap/.test(m)) return m;
      return `<div class="ssr-table-wrap">${m}</div>`;
    });
    parts.push(raw);
  }
  if (article.theory) {
    parts.push(`<h2>Engineering Theory &amp; Principles</h2><p>${escHtml(article.theory)}</p>`);
  }
  if (Array.isArray(article.formulas) && article.formulas.length > 0) {
    const fItems = article.formulas
      .map(
        (f) =>
          `<div><h3>${escHtml(f.label || "Formula")}</h3><p><code>${escHtml(f.expression || f.formula || "")}</code></p></div>`
      )
      .join("");
    parts.push(`<h2>Key Engineering Formulas</h2>${fItems}`);
  }
  if (article.stepByStepExample && article.stepByStepExample.problem) {
    const ex = article.stepByStepExample;
    const stepsHtml = Array.isArray(ex.steps)
      ? `<ol>${ex.steps.map((s) => `<li><strong>${escHtml(s.title || "")}:</strong> ${escHtml(s.calculation || s.detail || "")}</li>`).join("")}</ol>`
      : "";
    parts.push(
      `<h2>Worked Calculation Example</h2><p>${escHtml(ex.problem)}</p>${stepsHtml}${
        ex.conclusion ? `<p><strong>Result:</strong> ${escHtml(ex.conclusion)}</p>` : ""
      }`
    );
  }
  if (Array.isArray(article.blocks) && article.blocks.length > 0 && !article.content) {
    for (const block of article.blocks) {
      if (!block || !block.type) continue;
      if (block.type === "heading" && block.data?.text) {
        parts.push(`<h2>${escHtml(block.data.text)}</h2>`);
      } else if ((block.type === "paragraph" || block.type === "rich_text") && (block.data?.text || block.data?.html)) {
        parts.push(block.data.html || `<p>${escHtml(block.data.text)}</p>`);
      }
    }
  }
  return parts.join("\n");
}

function renderStaticArticleMarkup(article, relatedArticles = []) {
  const h1 = escHtml(article.h1 || article.title || "Untitled Article");
  const title = escHtml(article.title || "Untitled Article");
  const excerpt = escHtml(stripHtml(article.excerpt || ""));
  const author = escHtml(article.author || "CivilMath Engineering Editorial Team");
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const readTime = article.readTimeMinutes ? `${article.readTimeMinutes} min read` : "";
  const cover = article.coverImage || article.coverImageUrl || "";
  const showCover = cover && !String(cover).startsWith("data:");
  const tags = Array.isArray(article.tags) ? article.tags : [];
  const body = prepareStaticBodyHtml(article);
  const faqs = extractArticleFaqs(article);
  const bodyHasFaqHeading = /<h2[^>]*>\s*Frequently Asked Questions\s*<\/h2>/i.test(body);

  const faqHtml =
    faqs.length > 0 && !bodyHasFaqHeading
      ? `<section class="ssr-faq"><h2>Frequently Asked Questions</h2><dl>${faqs
          .map((f) => `<dt>${escHtml(stripHtml(f.question))}</dt><dd>${escHtml(stripHtml(f.answer))}</dd>`)
          .join("")}</dl></section>`
      : "";

  const otherArticles = (Array.isArray(relatedArticles) ? relatedArticles : [])
    .filter((r) => r && r.slug && r.slug !== article.slug && r.status !== "draft")
    .slice(0, 6);

  const relatedHtml =
    otherArticles.length > 0
      ? `<nav class="ssr-related" aria-label="Related Engineering Articles"><h2>Related Engineering Articles</h2><ul>${otherArticles
          .map((r) => `<li><a href="/articles/${escAttr(r.slug)}">${escHtml(r.title)}</a></li>`)
          .join("")}</ul></nav>`
      : "";

  return (
    `<article class="ssr-wrap">` +
    `<header class="ssr-topbar"><a class="brand" href="/">CivilMath</a><a class="home" href="/articles">All articles</a></header>` +
    `<nav class="ssr-crumb" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/articles">Articles</a> / ${title}</nav>` +
    `<h1>${h1}</h1>` +
    `<p class="ssr-meta">By ${author}${date ? ` &middot; ${escHtml(date)}` : ""}${readTime ? ` &middot; ${escHtml(readTime)}` : ""}</p>` +
    (showCover
      ? `<img class="ssr-cover" src="${escAttr(cover)}" alt="${escAttr(article.title || "Article cover")}" loading="eager" />`
      : "") +
    (excerpt ? `<p class="ssr-excerpt">${excerpt}</p>` : "") +
    `<div class="ssr-body">${body}</div>` +
    faqHtml +
    (tags.length ? `<div class="ssr-tags">${tags.map((t) => `<span>#${escHtml(t)}</span>`).join("")}</div>` : "") +
    relatedHtml +
    `<p class="ssr-note">Calculations and engineering guides are for planning and educational reference. Verify final designs against applicable codes with a licensed Professional Engineer.</p>` +
    `</article>`
  );
}

export function renderArticlePageHtml(shellHtml, article, relatedArticles = []) {
  const slim = slimArticleForEmbed(article);
  const slug = String(slim.slug || "").trim();
  const rawTitle = String(slim.title || "Untitled Article").trim();
  const seoTitle = String(slim.seo?.seoTitle || `${rawTitle} | CivilMath`).trim();
  const description =
    stripHtml(slim.seo?.metaDescription || slim.excerpt || rawTitle).slice(0, 300) || seoTitle;
  const canonical = String(slim.seo?.canonicalUrl || `${SITE_URL}/articles/${slug}`).trim();
  const ogImage = resolveOgImage(slim.coverImage || slim.seo?.ogImage);
  const noindex = slim.status === "draft" || Boolean(slim.seo?.noindex);
  const keywords = [
    slim.seo?.primaryKeyword,
    ...(Array.isArray(slim.seo?.secondaryKeywords) ? slim.seo.secondaryKeywords : []),
    ...(Array.isArray(slim.tags) ? slim.tags : []),
  ]
    .filter(Boolean)
    .join(", ");

  const faqs = extractArticleFaqs(slim);
  const schemas = [
    buildArticleJsonLd(slim, canonical, ogImage),
    buildBreadcrumbJsonLd([
      { name: "Home", url: "/" },
      { name: "Articles", url: "/articles" },
      { name: rawTitle, url: `/articles/${slug}` },
    ]),
  ];
  if (faqs.length > 0) {
    schemas.push(buildFaqJsonLd(faqs));
  }

  const headLines = [
    `<meta name="description" content="${escAttr(description)}" data-rh="true" />`,
  ];
  if (keywords) {
    headLines.push(`<meta name="keywords" content="${escAttr(keywords)}" data-rh="true" />`);
  }
  if (noindex) {
    headLines.push(`<meta name="robots" content="noindex, nofollow" data-rh="true" />`);
  } else {
    headLines.push(`<link rel="canonical" href="${escAttr(canonical)}" data-rh="true" />`);
  }
  headLines.push(
    `<meta property="og:title" content="${escAttr(seoTitle)}" data-rh="true" />`,
    `<meta property="og:description" content="${escAttr(description)}" data-rh="true" />`,
    `<meta property="og:url" content="${escAttr(canonical)}" data-rh="true" />`,
    `<meta property="og:image" content="${escAttr(ogImage)}" data-rh="true" />`,
    `<meta property="og:type" content="article" data-rh="true" />`,
    `<meta property="og:site_name" content="${escAttr(SITE_NAME)}" data-rh="true" />`,
    `<meta name="twitter:card" content="summary_large_image" data-rh="true" />`,
    `<meta name="twitter:site" content="${escAttr(TWITTER_HANDLE)}" data-rh="true" />`,
    `<meta name="twitter:title" content="${escAttr(seoTitle)}" data-rh="true" />`,
    `<meta name="twitter:description" content="${escAttr(description)}" data-rh="true" />`,
    `<meta name="twitter:image" content="${escAttr(ogImage)}" data-rh="true" />`
  );
  if (slim.publishedAt) {
    headLines.push(
      `<meta property="article:published_time" content="${escAttr(slim.publishedAt)}" data-rh="true" />`
    );
  }
  if (slim.updatedAt || slim.publishedAt) {
    headLines.push(
      `<meta property="article:modified_time" content="${escAttr(slim.updatedAt || slim.publishedAt)}" data-rh="true" />`
    );
  }
  for (const s of schemas) {
    headLines.push(
      `<script type="application/ld+json" data-rh="true">${JSON.stringify(s).replace(/<\//g, "<\\/")}</script>`
    );
  }

  let out = stripExistingSeoAndSplash(shellHtml);
  out = out.replace(/<title><\/title>/i, `<title>${escHtml(seoTitle)}</title>`);
  if (!out.includes(".ssr-wrap{")) {
    headLines.push(`<style>${ARTICLE_CRITICAL_CSS}</style>`);
  }
  out = out.replace(/<\/head>/i, `    ${headLines.join("\n    ")}\n  </head>`);

  const staticHtml = renderStaticArticleMarkup(slim, relatedArticles);
  out = out.replace(/<div\s+id=["']root["'][^>]*>[\s\S]*?<\/div>/i, `<div id="root">${staticHtml}</div>`);

  const jsonPayload = JSON.stringify(slim).replace(/<\//g, "<\\/");
  const jsonTag = `<script id="${JSON_ARTICLE_ID}" type="application/json">${jsonPayload}</script>`;
  if (out.includes("</body>")) {
    out = out.replace("</body>", `${jsonTag}\n  </body>`);
  } else {
    out += jsonTag;
  }
  return out;
}

export function renderArticleNotFoundHtml(shellHtml) {
  const title = "Article Not Found | CivilMath";
  const description = "The requested civil engineering article was not found.";
  let out = stripExistingSeoAndSplash(shellHtml);
  out = out.replace(/<title><\/title>/i, `<title>${escHtml(title)}</title>`);
  const headLines = [
    `<meta name="description" content="${escAttr(description)}" data-rh="true" />`,
    `<meta name="robots" content="noindex, nofollow" data-rh="true" />`,
    `<style>${ARTICLE_CRITICAL_CSS}</style>`,
  ];
  out = out.replace(/<\/head>/i, `    ${headLines.join("\n    ")}\n  </head>`);
  const markup = `<div class="ssr-wrap"><header class="ssr-topbar"><a class="brand" href="/">CivilMath</a><a class="home" href="/articles">All articles</a></header><h1>Article Not Found</h1><p>${escHtml(description)}</p><p><a href="/articles">Browse All Articles</a></p></div>`;
  out = out.replace(/<div\s+id=["']root["'][^>]*>[\s\S]*?<\/div>/i, `<div id="root">${markup}</div>`);
  return out;
}

export function renderArticlesDirectoryHtml(shellHtml, articles = []) {
  const title = "Civil Engineering Calculation Articles & Guides | CivilMath";
  const description =
    "Explore step-by-step engineering articles, formulas, and practical calculation guides for concrete, rebar BBS schedules, beam design, and surveying.";
  const canonical = `${SITE_URL}/articles`;

  const publishedList = (Array.isArray(articles) ? articles : [])
    .filter((a) => a && a.slug && a.status !== "draft" && !a.seo?.noindex)
    .map((a) => slimArticleForEmbed(a));

  const breadcrumbSchema = buildBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Articles", url: "/articles" },
  ]);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: canonical,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: publishedList.length,
      itemListElement: publishedList.slice(0, 100).map((a, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${SITE_URL}/articles/${a.slug}`,
        name: a.title,
      })),
    },
  };

  let out = stripExistingSeoAndSplash(shellHtml);
  out = out.replace(/<title><\/title>/i, `<title>${escHtml(title)}</title>`);

  const headLines = [
    `<meta name="description" content="${escAttr(description)}" data-rh="true" />`,
    `<link rel="canonical" href="${escAttr(canonical)}" data-rh="true" />`,
    `<meta property="og:title" content="${escAttr(title)}" data-rh="true" />`,
    `<meta property="og:description" content="${escAttr(description)}" data-rh="true" />`,
    `<meta property="og:url" content="${escAttr(canonical)}" data-rh="true" />`,
    `<meta property="og:image" content="${escAttr(DEFAULT_IMAGE)}" data-rh="true" />`,
    `<meta property="og:type" content="website" data-rh="true" />`,
    `<meta property="og:site_name" content="${escAttr(SITE_NAME)}" data-rh="true" />`,
    `<meta name="twitter:card" content="summary_large_image" data-rh="true" />`,
    `<meta name="twitter:site" content="${escAttr(TWITTER_HANDLE)}" data-rh="true" />`,
    `<meta name="twitter:title" content="${escAttr(title)}" data-rh="true" />`,
    `<meta name="twitter:description" content="${escAttr(description)}" data-rh="true" />`,
    `<meta name="twitter:image" content="${escAttr(DEFAULT_IMAGE)}" data-rh="true" />`,
    `<script type="application/ld+json" data-rh="true">${JSON.stringify(breadcrumbSchema).replace(/<\//g, "<\\/")}</script>`,
    `<script type="application/ld+json" data-rh="true">${JSON.stringify(itemListSchema).replace(/<\//g, "<\\/")}</script>`,
  ];
  if (!out.includes(".ssr-wrap{")) {
    headLines.push(`<style>${ARTICLE_CRITICAL_CSS}</style>`);
  }
  out = out.replace(/<\/head>/i, `    ${headLines.join("\n    ")}\n  </head>`);

  const listItems = publishedList
    .map(
      (a) =>
        `<li><a href="/articles/${escAttr(a.slug)}">${escHtml(a.title)}</a><span>${escHtml(
          stripHtml(a.excerpt || a.seo?.metaDescription || "").slice(0, 220)
        )}</span></li>`
    )
    .join("");

  const markup =
    `<div class="ssr-wrap">` +
    `<header class="ssr-topbar"><a class="brand" href="/">CivilMath</a><a class="home" href="/calculators">Calculators</a></header>` +
    `<nav class="ssr-crumb" aria-label="Breadcrumb"><a href="/">Home</a> / Articles &amp; Guides</nav>` +
    `<h1>Civil Engineering Calculation Articles</h1>` +
    `<p>${escHtml(description)}</p>` +
    `<ul class="ssr-dir-list">${listItems}</ul>` +
    `</div>`;

  out = out.replace(/<div\s+id=["']root["'][^>]*>[\s\S]*?<\/div>/i, `<div id="root">${markup}</div>`);

  // Embed lightweight article summaries so ArticlesDirectoryPage hydrates immediately
  const summaries = publishedList.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    h1: a.h1 || a.title,
    excerpt: a.excerpt,
    category: a.category,
    author: a.author,
    publishedAt: a.publishedAt,
    updatedAt: a.updatedAt,
    readTimeMinutes: a.readTimeMinutes,
    status: a.status || "published",
    tags: a.tags,
    coverImage:
      typeof a.coverImage === "string" && !a.coverImage.startsWith("data:")
        ? a.coverImage
        : undefined,
    seo: a.seo,
  }));
  const jsonTag = `<script id="${JSON_LIST_ID}" type="application/json">${JSON.stringify(summaries).replace(
    /<\//g,
    "<\\/"
  )}</script>`;
  if (out.includes("</body>")) {
    out = out.replace("</body>", `${jsonTag}\n  </body>`);
  } else {
    out += jsonTag;
  }
  return out;
}

export function loadHtmlShell() {
  const candidates = [
    path.resolve(process.cwd(), "dist", "_shell.html"),
    path.resolve(process.cwd(), "dist", "index.html"),
    path.resolve(process.cwd(), "index.html"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const html = fs.readFileSync(p, "utf8");
        if (html && html.includes('<div id="root"')) {
          return html;
        }
      }
    } catch {
      // ignore and try next
    }
  }
  return SHELL_HTML;
}
