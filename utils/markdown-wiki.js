const { marked } = require('marked');
const pageExists = require('./pageExists');

// Configure marked with GitHub-flavored markdown and line breaks
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Configure external links to display external-link icon
marked.use({
  renderer: {
    link(hrefOrToken, titleParam, textParam) {
      let href, title, text;
      if (typeof hrefOrToken === 'object' && hrefOrToken !== null) {
        href = hrefOrToken.href || '';
        title = hrefOrToken.title || '';
        text = hrefOrToken.text || '';
      } else {
        href = hrefOrToken || '';
        title = titleParam || '';
        text = textParam || '';
      }

      const titleAttr = title ? ` title="${title}"` : '';
      const isExternal = /^https?:\/\//i.test(href);
      if (isExternal) {
        const hasIcon = /fa-(?:arrow-up-right-from-square|external-link-alt|up-right-from-square)/i.test(text);
        const iconHtml = hasIcon ? '' : ' <i class="fa-solid fa-arrow-up-right-from-square text-xs ml-0.5"></i>';
        return `<a href="${href}" class="external" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}${iconHtml}</a>`;
      }
      return `<a href="${href}"${titleAttr}>${text}</a>`;
    }
  }
});

/**
 * Normalizes <centre> and <center> tags and ensures block-level center tags
 * have blank lines so marked parses Markdown content inside them.
 */
function processCenterTags(input) {
  if (!input || typeof input !== 'string') return '';
  let res = input.replace(/<\s*centre\s*>/gi, '<center>').replace(/<\s*\/centre\s*>/gi, '</center>');
  res = res.replace(/(^|\n)<\s*center\s*>\r?\n/gi, '$1<center>\n\n');
  res = res.replace(/\r?\n<\s*\/center\s*>($|\n)/gi, '\n\n</center>$1');
  return res;
}

/**
 * Strips HTML comments (<!-- ... -->) like the MediaWiki wikitext parser
 * Reference: https://www.mediawiki.org/wiki/Help:HTML_in_wikitext#Comments
 */
function stripHtmlComments(input) {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * HTML Sanitizer based on MediaWiki's Help:HTML_in_wikitext specification.
 * Strips dangerous tags (script, iframe, object, embed, form, input, button, meta, link)
 * and inline event handlers (onclick, onerror, onload, etc.) while allowing safe HTML5
 * formatting tags, tables, blockquotes, code, and attributes (class, id, style, title, etc.).
 */
function sanitizeMediaWikiHtml(html) {
  if (!html || typeof html !== 'string') return '';

  let clean = html;

  // 1. Remove dangerous paired tags and their contents
  clean = clean.replace(/<\s*(script|style|iframe|object|embed|form|meta|link|base|applet)[\s\S]*?<\s*\/\s*\1\s*>/gi, '');

  // 2. Remove any remaining self-closing or unclosed dangerous tags
  clean = clean.replace(/<\s*(script|style|iframe|object|embed|form|meta|link|base|applet|input|button)[\s\S]*?>/gi, '');

  // 3. Strip dangerous inline event handlers (onclick, onload, onerror, onmouseover, etc.)
  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // 4. Strip javascript: URLs from href, src, or style
  clean = clean.replace(/(href|src)\s*=\s*("[^"]*javascript:[^"]*"|'[^']*javascript:[^']*'|[^\s>]*javascript:[^\s>]*)/gi, '$1="#"');

  return clean;
}

/**
 * Process internal wiki links like [[Page Title]] or [[Page Title|Display Text]]
 * Checks whether the target page exists in DB and styles links accordingly (blue vs red).
 */
async function processWikiLinks(input) {
  if (!input || typeof input !== 'string') return '';
  const wikiLinkPattern = /\[\[([^\|\]]+)(?:\|([^\]]+))?\]\]/g;

  const matches = [...input.matchAll(wikiLinkPattern)];
  if (matches.length === 0) return input;

  let result = input;
  for (const match of matches) {
    const fullMatch = match[0];
    const pageName = match[1].trim();
    const displayText = (match[2] !== undefined ? match[2] : pageName).trim();
    const normalizedPageName = pageName.replace(/\s+/g, '_');
    const titleForDb = normalizedPageName.replace(/_/g, ' ');

    let exists = false;
    try {
      exists = await pageExists(titleForDb);
    } catch (err) {
      // Graceful fallback if database check fails
    }

    const linkColor = exists ? '#0d6efd' : '#dc3545';
    const linkTitle = exists ? displayText : `${displayText} (page does not exist)`;
    const replacement = `<a href="/wiki/${encodeURIComponent(normalizedPageName)}" style="color:${linkColor};" title="${linkTitle}">${displayText}</a>`;

    result = result.split(fullMatch).join(replacement);
  }

  return result;
}

/**
 * Main rendering function:
 * 1. Strips HTML comments (<!-- ... -->)
 * 2. Normalizes <center>/<centre> tags and ensures nested Markdown parsing
 * 3. Resolves internal [[Wiki Links]]
 * 4. Parses 100% standard Markdown + allowed HTML via `marked`
 * 5. Sanitizes output according to MediaWiki's Help:HTML_in_wikitext rules
 */
async function renderMarkdown(content) {
  if (!content) return '';
  const withoutComments = stripHtmlComments(content);
  const withCenterNormalized = processCenterTags(withoutComments);
  const withWikiLinks = await processWikiLinks(withCenterNormalized);
  const parsed = marked.parse(withWikiLinks);
  return sanitizeMediaWikiHtml(parsed);
}

module.exports = {
  renderMarkdown,
  processWikiLinks,
  processCenterTags,
  stripHtmlComments,
  sanitizeMediaWikiHtml
};
