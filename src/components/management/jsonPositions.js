import jsonSourceMap from 'json-source-map';

// Escape a JSON pointer segment (RFC 6901)
function escapePointerSegment(segment) {
  return String(segment).replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * Parses a JSON string and provides source positions for all JSON pointers.
 *
 * @param {string} text The JSON document
 * @returns {{data: *, pointers: Object}} The parsed data and a map of JSON pointers to positions
 * @throws {SyntaxError} If the document is not valid JSON
 */
export function parseWithPointers(text) {
  return jsonSourceMap.parse(text);
}

/**
 * Resolves an issue reported for a JSON pointer to a text range in the document.
 *
 * @param {Object} pointers The pointer map from parseWithPointers
 * @param {Object} doc The CodeMirror document (Text instance)
 * @param {Object} issue The issue with `pointer` and optionally `keyword` and `params`
 * @returns {{from: number, to: number}} The text range (falls back to the first line)
 */
export function resolveRange(pointers, doc, issue) {
  let location = pointers[issue.pointer];

  // For unexpected properties, highlight the name of the offending property
  const additionalProperty = issue.params?.additionalProperty;
  if (additionalProperty) {
    const propertyPointer = `${issue.pointer}/${escapePointerSegment(additionalProperty)}`;
    const property = pointers[propertyPointer];
    if (property && property.key) {
      return { from: property.key.pos, to: property.keyEnd.pos };
    }
  }

  if (!location || !location.value) {
    // Positionless or unresolvable issues point at the first line
    const firstLine = doc.line(1);
    return { from: firstLine.from, to: firstLine.to };
  }

  const from = location.value.pos;
  let to = location.valueEnd.pos;

  // Highlighting a whole object or array can span hundreds of lines,
  // so clamp multi-line values to the first line of the value.
  const firstLineEnd = doc.lineAt(from).to;
  if (to > firstLineEnd) {
    to = firstLineEnd;
  }

  return { from, to: Math.max(from + 1, to) };
}
