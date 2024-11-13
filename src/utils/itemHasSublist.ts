import type { ItemElement } from '../types/Elements';
import { DefaultListCssClasses } from '../ListRenderer';

/**
 * Check if passed item has the sublist
 * @param item - item to be checked wherever it has sublist
 */
export function itemHasSublist(item: ItemElement): boolean {
  return item.querySelector(`.${DefaultListCssClasses.itemChildren}`) !== null;
}
