import { ItemContentElement, ItemElement } from "../types/Elements";
import { DefaultListCssClasses } from "../ListRenderer";

export function getItemContentElement(item: ItemElement): ItemContentElement | null {
  return item.querySelector(`.${DefaultListCssClasses.itemContent}`);
}
