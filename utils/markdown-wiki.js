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
      // If DB is offline or table error, default gracefully
    }

    const linkColor = exists ? 'blue' : 'red';
    const linkTitle = exists ? displayText : `${displayText} (page does not exist)`;
    const replacement = `<a href="/wiki/${encodeURIComponent(normalizedPageName)}" style="color:${linkColor};" title="${linkTitle}">${displayText}</a>`;

    result = result.split(fullMatch).join(replacement);
  }

  return result;
}

function processHeaders(input) {
  return input.replace(/^(={2,6})\s*(.*?)\s*\1$/gm, (match, equals, headerText) => {
    let level = equals.length;
    level = Math.max(1, level + 1);
    return `${"#".repeat(level)} ${headerText.trim()}`;
  });
}

function processLists(input) {
  input = input.split('\n').map(line => {
    const match = line.match(/^(·+)\s+(.*)/);
    if (match) {
      const depth = match[1].length;
      const itemText = match[2];
      return `${'  '.repeat(depth - 1)}* ${itemText}`;
    }
    return line;
  }).join('\n');

  const lines = input.split('\n');
  const outputLines = [];

  for (const line of lines) {
    const match = line.match(/^((?:\d+\.)+)\s+(.*)/);
    if (match) {
      const marker = match[1];
      const itemText = match[2];
      const depth = marker.split('.').length - 2;
      const markdownLine = `${'    '.repeat(depth)}1. ${itemText}`;
      outputLines.push(markdownLine);
    } else {
      outputLines.push(line);
    }
  }

  return outputLines.join('\n');
}

function processIndentation(input) {
  return input.replace(/^(:+)(.*)/gm, (match, colons, text) => {
    const indentWidth = colons.length * 20;
    return `<div style="margin-left: ${indentWidth}px;">${text}</div>`;
  });
}

/**
 * Pre-processes wikitext constructs into standard Markdown,
 * preserving support for existing pages while allowing modern Markdown.
 */
async function wiki2markdown(input) {
  if (!input || typeof input !== 'string') return '';

  // Process external URLs with display text: [http://url display text] -> [display text <i class="...">](url)
  input = input.replace(/\[(http[s]?:\/\/[^\s]+)\s([^\]]+)\]/g, (match, url, linkText) => {
    const iconHtml = '<i class="fas fa-external-link-alt fa-xs"></i>';
    return `[${linkText} ${iconHtml}](${url})`;
  });

  // Handle wikitext bold and italic ('''bold''' -> **bold**, ''italic'' -> *italic*)
  input = input.replace(/'''(.*?)'''/g, '**$1**')
               .replace(/''(.*?)''/g, '*$1*');

  input = processHeaders(input);
  input = await processWikiLinks(input);
  input = processLists(input);
  input = processIndentation(input);

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
