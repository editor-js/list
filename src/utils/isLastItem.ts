import type { ItemElement } from '../types/Elements';

/**
 * Check that passed item element is last item of the list
 * @param item
 */
export function isLastItem(item: ItemElement): boolean {
  return item.nextElementSibling === null;
}
