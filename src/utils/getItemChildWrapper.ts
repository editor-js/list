import type { ItemChildWrapperElement, ItemElement } from '../types/Elements';
import { DefaultListCssClasses } from '../ListRenderer';

/**
 * Returns child wrapper element of the passed item
 * @param item - item to get wrapper from
 */
export function getItemChildWrapper(item: ItemElement): ItemChildWrapperElement | null {
  return item.querySelector(`.${DefaultListCssClasses.itemChildren}`);
}
