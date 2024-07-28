/**
 * HtmlElement's attribute that can be set
 */
type HtmlElementAttributes = Partial<HTMLElement>;

/**
 * Helper for making Elements with attributes
 *
 * @param  {string} tagName           - new Element tag name
 * @param  {Array|string} classNames  - list or name of CSS classname(s)
 * @param  {object} attributes        - any attributes
 * @returns {Element}
 */
export function make(
  tagName: string,
  classNames: string[] | string | null = null,
  attributes?: HtmlElementAttributes
): HTMLElement {
  const el = document.createElement(tagName);

  if (Array.isArray(classNames)) {
    el.classList.add(...classNames);
  } else if (classNames) {
    el.classList.add(classNames);
  }

  for (const attrName in attributes) {
    // as any is used to avoid TS error that read-only properties of HTMLElement are not assignable
    (el[attrName as keyof HtmlElementAttributes] as any) =
      attributes[attrName as keyof HtmlElementAttributes];
  }

  return el;
}

/**
 * Returns the HTML content of passed Document Fragment
 *
 * @param {DocumentFragment} fragment - document fragment to process
 * @returns {string}
 */
export function fragmentToString(fragment: DocumentFragment): string {
  const div = make('div');

  div.appendChild(fragment);

  return div.innerHTML;
}

/**
 * breadth-first search (BFS)
 * {@link https://en.wikipedia.org/wiki/Breadth-first_search}
 *
 * @description Pushes to stack all DOM leafs and checks for emptiness
 * @param {Node} node - node to check
 * @returns {boolean}
 */
export function isEmpty(node: Element): boolean {
  let content: string | null;

  if (node.nodeType !== Node.ELEMENT_NODE) {
    content = node.textContent;
  } else {
    content = node.innerHTML;

    /**
     * Don't count <br>s as content
     */
    content = content.replaceAll('<br>', '');
  }

  return content?.trim().length === 0;
}
