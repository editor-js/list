import { ItemChildWrapperElement } from "../types/Elements";
import { getChildItems } from "./getChildItems";

/**
 * Method that will remove passed child wrapper if it has no child items
 */
export function removeChildWrapperIfEmpty(childWrapper: ItemChildWrapperElement): void {
  if (getChildItems(childWrapper) === null) {
    childWrapper.remove();
  }
}
