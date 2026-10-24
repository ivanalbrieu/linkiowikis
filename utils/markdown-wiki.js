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
        return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text} <i class="fas fa-external-link-alt fa-xs"></i></a>`;
      }
      return `<a href="${href}"${titleAttr}>${text}</a>`;
    }
  }
});

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
 * Main rendering function: resolves internal [[Wiki Links]],
 * then parses 100% standard Markdown directly with `marked`.
 */
async function renderMarkdown(content) {
  if (!content) return '';
  const withWikiLinks = await processWikiLinks(content);
  return marked.parse(withWikiLinks);
}

module.exports = {
  renderMarkdown,
  processWikiLinks
};
