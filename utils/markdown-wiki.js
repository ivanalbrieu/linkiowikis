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
 * Pre-processes wikitext constructs into standard Markdown,
 * preserving support for existing pages while allowing modern Markdown.
 */
async function wiki2markdown(input) {
  if (!input || typeof input !== 'string') return '';

  // 1. Process external URLs with display text: [http://url display text] -> [display text <i class="...">](url)
  input = input.replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, (match, url, linkText) => {
    const iconHtml = '<i class="fas fa-external-link-alt fa-xs"></i>';
    return `[${linkText.trim()} ${iconHtml}](${url.trim()})`;
  });

  // 2. Handle wikitext bold and italic ('''bold''' -> **bold**, ''italic'' -> *italic*)
  input = input.replace(/'''(.*?)'''/g, '**$1**')
               .replace(/''(.*?)''/g, '*$1*');

  // 3. Headers: ==Title== or ===Title=== or --Title-- or ---Title--- (handles \r\n properly)
  input = input.replace(/^(=+|-{2,})\s*(.*?)\s*(=+|-{2,})\r?$/gm, (match, left, headerText) => {
    let level = Math.min(5, Math.max(2, left.length));
    return `${"#".repeat(level)} ${headerText.trim()}`;
  });

  // 4. Internal wiki links: [[Page Name]] or [[Page Name|Display Text]]
  input = await processWikiLinks(input);

  // 5. Bullet lists: lines starting with ·, •, *, or -
  input = input.split('\n').map(line => {
    const trimmed = line.replace(/\r$/, '');
    const m = trimmed.match(/^([·•\*\-]+)\s+(.*)/);
    if (m && !trimmed.match(/^(\*{2,}|-{2,})/)) {
      return `* ${m[2]}`;
    }
    return line;
  }).join('\n');

  // 6. Indentation with colons (:text -> margin-left)
  input = input.replace(/^(:+)(.*)/gm, (match, colons, text) => {
    const indentWidth = colons.length * 20;
    return `<div style="margin-left: ${indentWidth}px;">${text}</div>`;
  });

  return input;
}

/**
 * Main rendering function: translates any wikitext constructs to Markdown,
 * then parses with `marked` to generate HTML.
 */
async function renderMarkdown(content) {
  if (!content) return '';
  const markdown = await wiki2markdown(content);
  return marked.parse(markdown);
}

module.exports = {
  renderMarkdown,
  processWikiLinks,
  wiki2markdown
};
