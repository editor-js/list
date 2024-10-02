/**
 * Get all siblings before passed element, or after it
 * @param element
 * @param direction
 */
export function getSiblings(element: HTMLElement, direction: 'after' | 'before' = 'after'): Element[] | null {
  const siblings: Element[] = [];

  let nextElementSibling: HTMLElement;

  function getNextElementSibling(element: HTMLElement): HTMLElement {
    /**
     * Get first sibling element respectfully to passed direction
     */
    switch (direction) {
      case 'after':
        return element.nextElementSibling as HTMLElement;

      case 'before':
        return element.previousElementSibling as HTMLElement;
    }
  }

  nextElementSibling = getNextElementSibling(element);

  /**
   * Iterate by all siblings elements
   */
  while (nextElementSibling !== null) {
    siblings.push(nextElementSibling);

    /**
     * Get next element sibling
     */
    nextElementSibling = getNextElementSibling(nextElementSibling);
  }

  /**
   * Check that formed siblings array is not empty
   * If it is emtpy, return null
   */
  if (siblings.length !== 0) {
    return siblings;
  }

  return null;
}
