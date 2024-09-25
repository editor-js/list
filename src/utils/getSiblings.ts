/**
 * Get all siblings before passed element, or after it
 */
export function getSiblings(element: HTMLElement, afterCurrentElement: boolean = true): Element[] | null {
  const siblings: Element[] = [];

  let nextElementSibling: HTMLElement;

  function getNextElementSibling(element: HTMLElement): HTMLElement{
    /**
     * Get first sibling element respectfully to passed afterCurrentElement
     */
    switch (afterCurrentElement) {
      case true:
        return element.nextElementSibling as HTMLElement;

      case false:
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
