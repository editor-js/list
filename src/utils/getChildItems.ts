import { DefaultListCssClasses } from '../ListRenderer';
import type { ItemChildWrapperElement, ItemElement } from '../types/Elements';

/**
 * Get child items of the passed element
 * @param element - child items would be got from this element
 * @param firstLevelChildren - if method should return all level child items or only first level ones
 */
// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
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
    return Array.from(itemChildWrapper.querySelectorAll(`:scope > .${DefaultListCssClasses.item}`));
  } else {
    /**
     * Filter all levels child items of the current child item wrapper
     * In case that child could be not only list item
     */
    return Array.from(itemChildWrapper.querySelectorAll(`.${DefaultListCssClasses.item}`));
  }
}
