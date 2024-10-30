import { DefaultListCssClasses } from '../ListRenderer';
import type { ItemChildWrapperElement, ItemElement } from '../types/Elements';
import { getChildItems } from './getChildItems';
import { getItemChildWrapper } from './getItemChildWrapper';

/**
 * Method that will remove passed child wrapper if it has no child items
 * @param element - child wrapper or actual item, from where we get child wrapper
 */
// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
export function removeChildWrapperIfEmpty(element: ItemChildWrapperElement | ItemElement): void {
  let itemChildWrapper: HTMLElement | null = element;

  /**
   * If passed element is list item than get item's child wrapper
   */
  if (element.classList.contains(DefaultListCssClasses.item)) {
    itemChildWrapper = getItemChildWrapper(element);
  }

  if (itemChildWrapper === null) {
    return;
  }

  /**
   * Check that there is at least one item
   */
  if (getChildItems(itemChildWrapper).length === 0) {
    itemChildWrapper.remove();
  }
}
