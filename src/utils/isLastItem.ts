import type { ItemElement } from '../types/Elements';

/**
 * Check that passed item element is last item of the list
 * @param item - item to be checked, wherever it has next element sibling
 */
export function isLastItem(item: ItemElement): boolean {
  return item.nextElementSibling === null;
}
