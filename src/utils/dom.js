/**
 * Helper for making Elements with attributes
 *
 * @param  {string} tagName           - new Element tag name
 * @param  {Array|string} classNames  - list or name of CSS classname(s)
 * @param  {object} attributes        - any attributes
 * @returns {Element}
 */
export function make(tagName, classNames = null, attributes = {}) {
  const el = document.createElement(tagName);

  if (Array.isArray(classNames)) {
    el.classList.add(...classNames);
  } else if (classNames) {
    el.classList.add(classNames);
  }

  for (const attrName in attributes) {
    el[attrName] = attributes[attrName];
  }

  return el;
}

/**
 * Returns the HTML content of passed Document Fragment
 *
 * @param {DocumentFragment} fragment - document fragment to process
 * @returns {string}
 */
export function fragmentToString(fragment) {
  const div = make('div');

  div.appendChild(fragment);

  return div.innerHTML;
}
