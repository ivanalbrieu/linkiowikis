const markdown = require('markdown').markdown;
const wiky = require('wiky').wiky;
const pageExists = require('./pageExists');

async function processWikiLink(match) {
  const [fullMatch, pageName, displayText = pageName] = match;
  const pageNameTrimmed = pageName.trim().replace(/\s+/g, '_');
  const exists = await pageExists(pageNameTrimmed);
  const linkColor = exists ? 'blue' : 'red'; // Adjust the link color based on page existence
  return `<a href="/wiki/${pageNameTrimmed}" style="color:${linkColor};">${displayText.trim()}</a>`;
}

async function processWikiLinks(input) {
  const wikiLinkPattern = /\[\[([^\|\]]+)(?:\|([^\]]+))?\]\]/g;
  let processedInput = input;
  let matches;
  while ((matches = wikiLinkPattern.exec(input)) !== null) {
    const processedLink = await processWikiLink(matches);
    processedInput = processedInput.replace(matches[0], processedLink);
  }
  return processedInput;
}

function processHeaders(input) {
  return input.replace(/^(={2,6})\s*(.*?)\s*\1$/gm, (match, equals, headerText) => {
    let level = equals.length; // Length of '=' signs indicates the header level
    level = Math.max(1, level + 1); // Subtract 1 to shift headers down by one level, ensure minimum level is 1
    return `${"#".repeat(level)} ${headerText.trim()}`;
  });
}

function processLists(input) {
  // Handle custom unordered lists with "·" symbol, including nested lists
  input = input.split('\n').map(line => {
    const match = line.match(/^(·+)\s+(.*)/);
    if (match) {
      const depth = match[1].length; // Count the number of "·" symbols to determine depth
      const itemText = match[2];
      // Convert to Markdown list syntax with correct indentation
      return `${'  '.repeat(depth - 1)}* ${itemText}`;
    }
    return line;
  }).join('\n');

  // Handle custom ordered lists like "1.", "1.1.", "1.1.1.", etc.
    const lines = input.split('\n');
    const outputLines = [];

    for (const line of lines) {
        // Match custom ordered lists like "1.", "1.1.", "1.1.1.", etc.
        const match = line.match(/^((?:\d+\.)+)\s+(.*)/);
        if (match) {
            const marker = match[1]; // e.g., "1.", "1.1.", "1.1.1.", etc.
            const itemText = match[2];
            const depth = marker.split('.').length - 2; // -2 because split('.') of "1." gives ["1", ""]
            
            // Markdown doesn't support "1.1." style numbering, so we default to a single "1."
            // and rely on indentation for depth representation
            const markdownLine = `${'    '.repeat(depth)}1. ${itemText}`; // Indent with 4 spaces per depth level
            outputLines.push(markdownLine);
        } else {
            // For lines that are not part of custom ordered lists, add them as they are
            outputLines.push(line);
        }
    }

    return outputLines.join('\n');
}


function processIndentation(input) {
  // Handle indentation with colons
  return input.replace(/^(:+)(.*)/gm, (match, colons, text) => {
      const indentWidth = colons.length * 20; // Example: 20 pixels per colon
      // Use a div with inline style for indentation
      return `<div style="margin-left: ${indentWidth}px;">${text}</div>`;
  });
}

async function wiki2markdown(input) {
  // Process external URLs with display text to Markdown links
  input = input.replace(/\[(http[s]?:\/\/[^\s]+)\s([^\]]+)\]/g, (match, url, linkText) => {
      const iconHtml = '<i class="fas fa-external-link-alt fa-xs"></i>';
      return `[${linkText} ${iconHtml}](${url})`;
  });

  // Handle bold and italic before lists to avoid conflict
  input = input.replace(/'''(.*?)'''/g, '**$1**') // Wikitext to Markdown bold
               .replace(/''(.*?)''/g, '*$1*');   // Wikitext to Markdown italic

  input = processHeaders(input);
  input = await processWikiLinks(input);
  input = processLists(input);
  input = processIndentation(input);

  return input;
}

module.exports = { wiki2markdown };

//WYSIWYG Editor, not finished because of the above renderer not finished yet, when main editor finished, we will procede with this later

function markdown2wiki(input) {
  // Convert Markdown links to wiki links
  input = input.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, displayText, pageName) => {
      // Remove '/wiki/' from the URL and replace underscores with spaces
      const wikiPageName = pageName.replace('/wiki/', '').replace(/_/g, ' ');
      return `[[${wikiPageName}|${displayText.trim()}]]`;
  });

  // Convert Markdown bold and italic syntax to wiki
  input = input.replace(/\*\*(.*?)\*\*/g, "'''$1'''"); // Bold
  input = input.replace(/\*(.*?)\*/g, "''$1''"); // Italic

  // Convert Markdown headers to Wiki headers (from #Header to ######Header for headers 1 to 6)
  input = input.replace(/^(#{1,6})\s*(.*?)$/gm, (match, hashes, headerText) => {
      const level = hashes.length; // Determine the header level based on number of '#' characters
      return `${"=".repeat(level + 1)}${headerText.trim()}${"=".repeat(level + 1)}`; // Add 1 to level so that '#' becomes '==' in Wikitext
  });

  // Add more conversions as needed for your Markdown to Wikitext syntax
  // ...

  return input;
}

// Export the function for future use in a visual editor
exports.markdown2wiki = markdown2wiki;