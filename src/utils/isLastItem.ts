import { ItemElement } from "../types/Elements";

export function isLastItem(item: ItemElement): boolean {
  return item.nextElementSibling === null;
}
