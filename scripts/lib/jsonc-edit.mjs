/**
 * Comment-preserving edits for JSONC configuration files.
 *
 * The deploy script updates `name` and `d1_databases` in wrangler.jsonc. A
 * JSON.parse/JSON.stringify round-trip would silently drop the user's
 * comments, so these helpers rewrite only the affected top-level property
 * values and leave the rest of the file byte-for-byte intact.
 *
 * Only top-level properties of a root object are supported, which is all the
 * deploy script touches. Comments surrounding a managed property survive;
 * comments inside a property value are replaced along with the value.
 */

/** Remove `//` and block comments outside strings, as used by JSONC. */
export function stripJsonComments(source) {
  let output = "";
  let inString = false;
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }
    if (char === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") index += 1;
      output += "\n";
      continue;
    }
    if (char === "/" && next === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) index += 1;
      index += 1;
      continue;
    }
    output += char;
  }
  return output;
}

function skipWhitespaceAndComments(source, index) {
  const end = source.length;
  while (index < end) {
    const char = source[index];
    if (char === " " || char === "\t" || char === "\r" || char === "\n") {
      index += 1;
      continue;
    }
    if (char === "/" && source[index + 1] === "/") {
      index += 2;
      while (index < end && source[index] !== "\n") index += 1;
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      index += 2;
      while (index < end && !(source[index] === "*" && source[index + 1] === "/")) index += 1;
      index = Math.min(index + 2, end);
      continue;
    }
    break;
  }
  return index;
}

function readStringEnd(source, index) {
  let cursor = index + 1;
  while (cursor < source.length) {
    if (source[cursor] === "\\") {
      cursor += 2;
      continue;
    }
    if (source[cursor] === '"') return cursor + 1;
    cursor += 1;
  }
  throw new Error("Unterminated string in JSONC");
}

function scanValueEnd(source, start) {
  let cursor = start;
  let depth = 0;
  while (cursor < source.length) {
    const char = source[cursor];
    if (char === '"') {
      cursor = readStringEnd(source, cursor);
      continue;
    }
    if (char === "/" && source[cursor + 1] === "/") {
      cursor += 2;
      while (cursor < source.length && source[cursor] !== "\n") cursor += 1;
      continue;
    }
    if (char === "/" && source[cursor + 1] === "*") {
      cursor += 2;
      while (cursor < source.length && !(source[cursor] === "*" && source[cursor + 1] === "/")) cursor += 1;
      cursor = Math.min(cursor + 2, source.length);
      continue;
    }
    if (char === "{" || char === "[") {
      depth += 1;
      cursor += 1;
      continue;
    }
    if (char === "}" || char === "]") {
      if (depth === 0) break;
      depth -= 1;
      cursor += 1;
      continue;
    }
    if (char === "," && depth === 0) break;
    cursor += 1;
  }
  return cursor;
}

/** Return the span of every top-level property in a JSONC root object. */
export function topLevelProperties(source) {
  const properties = [];
  let cursor = skipWhitespaceAndComments(source, 0);
  if (source[cursor] !== "{") throw new Error("Expected a root object");
  cursor = skipWhitespaceAndComments(source, cursor + 1);
  while (cursor < source.length) {
    if (source[cursor] === "}") return properties;
    if (source[cursor] === ",") {
      cursor = skipWhitespaceAndComments(source, cursor + 1);
      continue;
    }
    if (source[cursor] !== '"') throw new Error(`Expected a property name at offset ${cursor}`);
    const keyStart = cursor;
    const keyEnd = readStringEnd(source, cursor);
    const key = JSON.parse(source.slice(keyStart, keyEnd));
    const colon = skipWhitespaceAndComments(source, keyEnd);
    if (source[colon] !== ":") throw new Error(`Expected ':' after ${key}`);
    const valueStart = skipWhitespaceAndComments(source, colon + 1);
    const valueEnd = scanValueEnd(source, valueStart);
    properties.push({ key, keyStart, keyEnd, valueStart, valueEnd });
    cursor = skipWhitespaceAndComments(source, valueEnd);
  }
  return properties;
}

function findRootClose(source) {
  let cursor = skipWhitespaceAndComments(source, 0);
  if (source[cursor] !== "{") throw new Error("Expected a root object");
  let depth = 0;
  while (cursor < source.length) {
    const char = source[cursor];
    if (char === '"') {
      cursor = readStringEnd(source, cursor);
      continue;
    }
    if (char === "/" && source[cursor + 1] === "/") {
      cursor += 2;
      while (cursor < source.length && source[cursor] !== "\n") cursor += 1;
      continue;
    }
    if (char === "/" && source[cursor + 1] === "*") {
      cursor += 2;
      while (cursor < source.length && !(source[cursor] === "*" && source[cursor + 1] === "/")) cursor += 1;
      cursor = Math.min(cursor + 2, source.length);
      continue;
    }
    if (char === "{") {
      depth += 1;
      cursor += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return cursor;
      cursor += 1;
      continue;
    }
    cursor += 1;
  }
  throw new Error("Root object is not closed");
}

function propertyIndent(source, keyStart) {
  const lineStart = source.lastIndexOf("\n", keyStart - 1) + 1;
  const prefix = source.slice(lineStart, keyStart);
  return /^[ \t]*$/.test(prefix) ? prefix : "";
}

/**
 * Set a top-level property, preserving surrounding comments and formatting.
 * Inserts the property before the closing brace when it does not exist.
 */
export function setTopLevel(source, key, value) {
  const properties = topLevelProperties(source);
  const existing = properties.find((property) => property.key === key);
  const serialized = JSON.stringify(value, null, 2);

  if (existing) {
    const indent = propertyIndent(source, existing.keyStart);
    const formatted = serialized.replace(/\n/g, `\n${indent}`);
    return source.slice(0, existing.valueStart) + formatted + source.slice(existing.valueEnd);
  }

  const last = properties.at(-1);
  if (!last) {
    const rootClose = findRootClose(source);
    const formatted = serialized.replace(/\n/g, "\n  ");
    const inner = source.slice(1, rootClose);
    if (inner.trim() === "") {
      return `${source.slice(0, 1)}\n  "${key}": ${formatted}\n${source.slice(rootClose)}`;
    }
    // The object only contains comments; keep them above the new property.
    const prefix = inner.endsWith("\n") ? "" : "\n";
    return `${source.slice(0, 1)}${inner}${prefix}  "${key}": ${formatted}\n${source.slice(rootClose)}`;
  }

  const afterLast = skipWhitespaceAndComments(source, last.valueEnd);
  const formatted = serialized.replace(/\n/g, "\n  ");
  if (source[afterLast] === ",") {
    return `${source.slice(0, afterLast + 1)}\n  "${key}": ${formatted}${source.slice(afterLast + 1)}`;
  }
  return `${source.slice(0, last.valueEnd)},\n  "${key}": ${formatted}${source.slice(last.valueEnd)}`;
}

/** Remove a top-level property, including one adjacent comma. */
export function removeTopLevel(source, key) {
  const properties = topLevelProperties(source);
  const index = properties.findIndex((property) => property.key === key);
  if (index === -1) return source;

  const property = properties[index];
  const lineStart = source.lastIndexOf("\n", property.keyStart - 1) + 1;
  let start = /^[ \t]*$/.test(source.slice(lineStart, property.keyStart)) ? lineStart : property.keyStart;
  let end = property.valueEnd;

  const next = skipWhitespaceAndComments(source, property.valueEnd);
  if (source[next] === ",") {
    end = next + 1;
    while (end < source.length && (source[end] === " " || source[end] === "\t")) end += 1;
    if (source[end] === "\r") end += 1;
    if (source[end] === "\n") end += 1;
  } else if (index > 0) {
    const previous = properties[index - 1];
    const comma = skipWhitespaceAndComments(source, previous.valueEnd);
    if (source[comma] === ",") start = comma;
  }

  return source.slice(0, start) + source.slice(end);
}
