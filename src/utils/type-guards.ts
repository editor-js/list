/**
 * Type guard to check if a node is an HTMLElement, then we can safely use it as an HTMLElement
 * @param node
 * @returns {node is HTMLElement}
 */
export function isHtmlElement(node: Node): node is HTMLElement {
  // node is an HTMLElement if it is an element node
  return node.nodeType === Node.ELEMENT_NODE;
}
