/**
 * Get all siblings before passed element, or after it
 * @param element - html element whose siblings would be returned
 * @param direction - wherever siblings would be returned, after element of before it
 */
export function getSiblings(element: HTMLElement, direction: 'after' | 'before' = 'after'): Element[] | null {
  const siblings: Element[] = [];

  let nextElementSibling: HTMLElement;

  /**
   * Method that is responsible for getting next element sibling responsible to the direction variable
   * @param el - current element
   * @returns HTML element of the sibling
   */
  function getNextElementSibling(el: HTMLElement): HTMLElement {
    /**
     * Get first sibling element respectfully to passed direction
     */
    switch (direction) {
      case 'after':
        return el.nextElementSibling as HTMLElement;

      case 'before':
        return el.previousElementSibling as HTMLElement;
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
