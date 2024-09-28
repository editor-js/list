import { DefaultListCssClasses } from "../ListRenderer";
import { ItemElement } from "../types/Elements";

/**
 * Get all child items of the passed list item
 */
export function getChildItems(element: HTMLElement): ItemElement[] | null {
  let itemChildWrapper: HTMLElement = element;

  /**
   * If passed element is list item than get item's child wrapper
   */
  if (element.classList.contains(DefaultListCssClasses.item)) {
    itemChildWrapper = element.querySelector(`.${DefaultListCssClasses.itemChildren}`) as HTMLElement;
  }

  /**
   * Check if itemChildWrapper is not null
   */
  if (itemChildWrapper === null) {
    return null;
  }

  /**
   * Filter child items of the curret child item wrapper
   * In case that child could be not only list item
   */
  return Array.from(itemChildWrapper.querySelectorAll(`:scope > .${DefaultListCssClasses.item}`))
}
