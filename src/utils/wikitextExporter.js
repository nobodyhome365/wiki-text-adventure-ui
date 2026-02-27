/**
 * Generates the full MediaWiki wikitext for a text adventure.
 * @param {Array} nodes - React Flow node objects
 * @param {Array} edges - React Flow edge objects
 * @returns {string} wikitext
 */
export function exportWikitext(nodes, edges) {
  const sorted = [...nodes].sort((a, b) => a.data.numericId - b.data.numericId);

  // Build lookup: "nodeId:choice-N" -> target numericId
  const edgeMap = {};
  for (const edge of edges) {
    const targetNode = nodes.find(n => n.id === edge.target);
    if (targetNode && edge.sourceHandle) {
      edgeMap[`${edge.source}:${edge.sourceHandle}`] = targetNode.data.numericId;
    }
  }

  const cases = sorted.map(node => {
    const { numericId, image, title, text, imagesize, choices, isEnding, startOverText } = node.data;

    const choiceLines = choices.map((choice, idx) => {
      const targetId = edgeMap[`${node.id}:choice-${idx}`];
      const resolvedTarget = targetId !== undefined ? targetId : '?';
      return `{{Text adventure choice|${resolvedTarget}|${choice.text}}}`;
    });

    if (isEnding) {
      const txt = startOverText || "'''START OVER'''";
      choiceLines.push(`{{Text adventure choice|0|${txt}}}`);
    }

    const textBlock = choiceLines.length > 0
      ? `${text}\n\n${choiceLines.join('\n')}`
      : text;

    const templateLines = ['{{Text adventure'];
    if (image) templateLines.push(`|image = ${image}`);
    if (imagesize) templateLines.push(`|imagesize = ${imagesize}`);
    if (title) templateLines.push(`|title = ${title}`);
    templateLines.push(`|text = \n${textBlock}`);
    templateLines.push('}}');

    return `|${numericId} =\n${templateLines.join('\n')}`;
  });

  return `{{#switch:{{Get}}\n${cases.join('\n')}\n}}`;
}
