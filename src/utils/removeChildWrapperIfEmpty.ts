import type { ItemChildWrapperElement } from '../types/Elements';
import { getChildItems } from './getChildItems';

/**
 * Method that will remove passed child wrapper if it has no child items
 * @param childWrapper - childWrapper to be removed if it is empty
 */
export function removeChildWrapperIfEmpty(childWrapper: ItemChildWrapperElement): void {
  if (getChildItems(childWrapper) === null) {
    childWrapper.remove();
  }
}
