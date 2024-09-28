import { ItemChildWrapperElement, ItemElement } from "../types/Elements";
import { DefaultListCssClasses } from "../ListRenderer";

export function getItemChildWrapper(item: ItemElement): ItemChildWrapperElement | null {
  return item.querySelector(`.${DefaultListCssClasses.itemChildren}`);
}
