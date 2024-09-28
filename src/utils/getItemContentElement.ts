import { ItemContentElement, ItemElement } from "../types/Elements";
import { DefaultListCssClasses } from "../ListRenderer";

/**
 * Returns content element of the passed item
 * @param item - item to get content element from
 */
export function getItemContentElement(item: ItemElement): ItemContentElement | null {
  return item.querySelector(`.${DefaultListCssClasses.itemContent}`);
}
