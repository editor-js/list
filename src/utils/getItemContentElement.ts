import type { ItemContentElement, ItemElement } from '../types/Elements';
import { DefaultListCssClasses } from '../ListRenderer';

/**
 * Returns content element of the passed item
 * @param item - content element would be got from this item
 */
export function getItemContentElement(item: ItemElement): ItemContentElement | null {
  return item.querySelector(`.${DefaultListCssClasses.itemContent}`);
}
