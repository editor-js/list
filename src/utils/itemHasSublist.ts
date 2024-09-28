import { ItemElement } from "../types/Elements";
import { DefaultListCssClasses } from "../ListRenderer";

export function itemHasSublist(item: ItemElement): boolean {
  return item.querySelector(`.${DefaultListCssClasses.itemChildren}`) !== null
}
