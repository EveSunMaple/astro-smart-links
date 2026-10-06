import type { Element } from "hast";

export function addClass(node: Element, className: string | undefined): void {
  if (!className)
    return;

  const current = node.properties?.className;
  const classes = Array.isArray(current)
    ? [...current]
    : typeof current === "string"
      ? current.split(/\s+/).filter(Boolean)
      : [];

  if (!classes.includes(className))
    classes.push(className);

  node.properties = { ...node.properties, className: classes };
}

export function removeClass(node: Element, className: string | undefined): void {
  if (!className || !node.properties?.className)
    return;

  const current = node.properties.className;
  const classes = Array.isArray(current)
    ? current.filter((cls) => cls !== className)
    : typeof current === "string"
      ? current.split(/\s+/).filter((cls) => cls && cls !== className)
      : [];

  if (classes.length > 0)
    node.properties = { ...node.properties, className: classes };
  else
    delete node.properties.className;
}

export function hasClass(node: Element, className: string | undefined): boolean {
  if (!className || !node.properties?.className)
    return false;

  const current = node.properties.className;
  return Array.isArray(current)
    ? current.includes(className)
    : typeof current === "string" && current.split(/\s+/).includes(className);
}

export function createContentElement(className: string, value: string): Element {
  return {
    type: "element",
    tagName: "span",
    properties: { className: className ? [className] : [] },
    children: [{ type: "text", value }],
  };
}
