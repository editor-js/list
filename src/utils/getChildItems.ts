import { DefaultListCssClasses } from "../ListRenderer";
import { ItemChildWrapperElement, ItemElement } from "../types/Elements";

/**
 * Get child items of the passed element
 * @param element - element to get child items
 * @param firstLevelChildren - if method should return all level child items or only first level ones
 */
export function getChildItems(element: ItemElement | ItemChildWrapperElement, firstLevelChildren: boolean = true): ItemElement[] {
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
    return [];
  }

  if (firstLevelChildren) {
    /**
     * Filter first level child items of the curret child item wrapper
     * In case that child could be not only list item
     */
    return Array.from(itemChildWrapper.querySelectorAll(`:scope > .${DefaultListCssClasses.item}`))
  } else {
    /**
     * Filter all levels child items of the current child item wrapper
     * In case that child could be not only list item
     */
    return Array.from(itemChildWrapper.querySelectorAll(`.${DefaultListCssClasses.item}`))
  }
}