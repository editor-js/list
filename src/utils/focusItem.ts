import { focus } from "@editorjs/caret";
import { ItemElement } from "../types/Elements";
import { getItemContentElement } from "./getItemContentElement";

/**
 * Sets focus to the item's content
 *
 * @param {Element} item - item (<li>) to select
 * @param {boolean} atStart - where to set focus: at the start or at the end
 * @returns {void}
 */
export function focusItem(item: ItemElement, atStart: boolean = true): void {
  const itemContent = getItemContentElement(item);

  if (!itemContent) {
    return;
  }

  focus(itemContent, atStart);
}
