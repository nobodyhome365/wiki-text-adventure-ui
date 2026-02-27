import { runAutoLayout } from './autoLayout';

/**
 * Parses a MediaWiki text adventure wikitext string into React Flow nodes and edges.
 * Handles both {{Text adventure}} and {{text adventure}} (case-insensitive).
 * @param {string} wikitext
 * @returns {{ nodes: Array, edges: Array }}
 */
export function importWikitext(wikitext) {
  const nodes = [];
  const edges = [];

  // Strip HTML comments before parsing — they can contain }}, fake choices, or
  // pollute parameter values, all of which would silently corrupt the parse.
  wikitext = wikitext.replace(/<!--[\s\S]*?-->/g, '');

  // Match each scene block: |N =\n{{Text adventure...body...\n}}
  // \n}} is safe as a closing marker because {{Text adventure choice|...|...}} always
  // ends with }} on the same line (no preceding newline).
  const caseRegex = /\|(\d+)\s*=\s*\n\{\{Text adventure([\s\S]*?)\n\}\}/gi;
  let match;

  while ((match = caseRegex.exec(wikitext)) !== null) {
    const numericId = parseInt(match[1], 10);
    const body = match[2]; // everything between {{Text adventure and \n}}

    // Extract optional single-line fields
    const imageMatch     = body.match(/\|image\s*=\s*(.+)/i);
    const imagesizeMatch = body.match(/\|imagesize\s*=\s*(.+)/i);
    const titleMatch     = body.match(/\|title\s*=\s*(.+)/i);

    const image     = imageMatch     ? imageMatch[1].trim()     : '';
    const imagesize = imagesizeMatch ? imagesizeMatch[1].trim() : '';
    const title     = titleMatch     ? titleMatch[1].trim()     : '';

    // Extract text field — everything after |text = (newline optional: some authors
    // write |text = text starts here with no leading newline)
    const textMatch = body.match(/\|text\s*=\s*\n?([\s\S]*)/i);
    const rawText = textMatch ? textMatch[1] : '';

    // Extract all choices embedded in the text field (case-insensitive)
    const choiceRegex = /\{\{Text adventure choice\|(\d+)\|(.*?)\}\}/gi;
    const parsedChoices = [];
    let choiceMatch;
    while ((choiceMatch = choiceRegex.exec(rawText)) !== null) {
      parsedChoices.push({
        targetId: parseInt(choiceMatch[1], 10),
        text: choiceMatch[2],
      });
    }

    // Strip all choice templates (and any preceding newlines) from the raw text
    // to get the pure scene text. Using replace rather than a split so we handle
    // both "\n\n{{choice}}" (exporter format) and "\n{{choice}}" (hand-written).
    const sceneText = rawText
      .replace(/\n*\{\{Text adventure choice\|\d+\|.*?\}\}/gi, '')
      .trim();

    // Detect ending node: if the last choice targets scene 0 and this isn't scene 0,
    // that choice is the implicit "start over" added by the exporter.
    let isEnding = false;
    let startOverText;
    let regularChoices = parsedChoices;

    if (numericId !== 0 && parsedChoices.length > 0) {
      const last = parsedChoices[parsedChoices.length - 1];
      if (last.targetId === 0) {
        isEnding = true;
        startOverText = last.text;
        regularChoices = parsedChoices.slice(0, -1);
      }
    }

    nodes.push({
      id: String(numericId),
      type: 'sceneNode',
      position: { x: 0, y: 0 }, // positioned by runAutoLayout below
      data: {
        numericId,
        image,
        title,
        text: sceneText,
        imagesize,
        choices: regularChoices.map(c => ({ text: c.text })),
        ...(isEnding && { isEnding: true, startOverText }),
      },
    });

    regularChoices.forEach((choice, idx) => {
      edges.push({
        id: `e${numericId}-choice${idx}-${choice.targetId}`,
        source: String(numericId),
        sourceHandle: `choice-${idx}`,
        target: String(choice.targetId),
        targetHandle: 'target',
      });
    });
  }

  if (nodes.length === 0) {
    throw new Error('No valid scenes found. Make sure this is a text adventure wikitext.');
  }

  return {
    nodes: runAutoLayout(nodes, edges),
    edges,
  };
}