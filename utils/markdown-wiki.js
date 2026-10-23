const { marked } = require('marked');
const pageExists = require('./pageExists');

// Configure marked with GitHub-flavored markdown and line breaks
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Process internal wiki links like [[Page Title]] or [[Page Title|Display Text]]
 * Checks whether the target page exists and styles links accordingly (blue vs red).
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
      console.error(`Error checking pageExists for "${titleForDb}":`, err);
    }

    const linkClass = exists ? 'wiki-link text-primary' : 'wiki-link text-danger';
    const linkTitle = exists ? displayText : `${displayText} (page does not exist)`;
    const replacement = `<a href="/wiki/${encodeURIComponent(normalizedPageName)}" class="${linkClass}" title="${linkTitle}">${displayText}</a>`;

    result = result.split(fullMatch).join(replacement);
  }

  return result;
}

/**
 * Renders Markdown content directly to HTML, with internal wiki links resolved.
 */
async function renderMarkdown(content) {
  if (!content) return '';
  const withWikiLinks = await processWikiLinks(content);
  return marked.parse(withWikiLinks);
}

module.exports = {
  renderMarkdown,
  processWikiLinks,
  wiki2markdown: processWikiLinks // Backwards-compatibility alias
};
