import { IconCheck } from '@codexteam/icons'
import ItemMeta from "../types/itemMeta";
import { NestedListConfig } from "../types/listParams";
import * as Dom from '../utils/dom';
import { ListRenderer } from './listRenderer';

/**
 * Class that is responsible for checklist rendering
 */
export class CheckListRenderer extends ListRenderer {
  /**
   * Tool's configuration
   */
  protected config?: NestedListConfig;

  /**
   * Is NestedList Tool read-only option
   */
  readOnly: boolean;

  constructor(readonly: boolean, config?: NestedListConfig) {
    super();
    this.config = config;
    this.readOnly = readonly;
  }

  /**
   * Renders ol wrapper for list
   * @returns - created html ol element
   */
  renderWrapper(): HTMLOListElement {
    const listWrapper = Dom.make('ul', [ListRenderer.CSS.wrapper, ListRenderer.CSS.wrapperChecklist]) as HTMLOListElement;

    listWrapper.addEventListener('click', (event) => {
      this.toggleCheckbox(event);
    });

    return listWrapper;
  }

  /**
   * Render wrapper of child list
   * @returns wrapper element of the child list
   */
  renderSublistWrapper(): HTMLElement {
    const divElement = Dom.make('ul', [ListRenderer.CSS.wrapperChecklist, ListRenderer.CSS.itemChildren]) as HTMLElement;

    return divElement;
  }

  /**
   * Redners list item element
   * @param content - content of the list item
   * @returns - created html list item element
   */
  renderItem(content: string, meta: ItemMeta): HTMLLIElement {
    const itemWrapper = Dom.make('li', [ListRenderer.CSS.item, ListRenderer.CSS.item]);
    const itemBody = Dom.make('div', ListRenderer.CSS.itemBody);
    const itemContent = Dom.make('div', ListRenderer.CSS.itemContent, {
      innerHTML: content,
      contentEditable: (!this.readOnly).toString(),
    });

    const checkbox = Dom.make('span', ListRenderer.CSS.checkbox);
    const checkboxContainer = Dom.make('div', ListRenderer.CSS.checkboxContainer);

    if (meta && meta.checked === true) {
      checkboxContainer.classList.add(ListRenderer.CSS.itemChecked);
    }

    checkbox.innerHTML = IconCheck;
    checkboxContainer.appendChild(checkbox);

    itemBody.appendChild(itemContent);
    itemWrapper.appendChild(checkboxContainer);
    itemWrapper.appendChild(itemBody);

    return itemWrapper as HTMLLIElement;
  }

  /**
   * Return the item content
   *
   * @param {Element} item - item wrapper (<li>)
   * @returns {string}
   */
  getItemContent(item: Element): string {
    const contentNode = item.querySelector(`.${ListRenderer.CSS.itemContent}`);
    if (!contentNode) {
      return '';
    }

    if (Dom.isEmpty(contentNode)) {
      return '';
    }

    return contentNode.innerHTML;
  }

  /**
   * Return meta object of certain element
   * @param {Element} item - item of the list to get meta from
   * @returns {ItemMeta} Item meta object
   */
  getItemMeta(item: Element): ItemMeta {
    const checkbox = item.querySelector(`.${ListRenderer.CSS.checkboxContainer}`);

    return {
      checked: checkbox ? checkbox.classList.contains(ListRenderer.CSS.itemChecked) : undefined,
    }
  }

  /**
   * Toggle checklist item state
   *
   * @private
   * @param {MouseEvent} event - click
   * @returns {void}
   */
  private toggleCheckbox(event: any): void {
    const checkbox = event.target.closest(`.${ListRenderer.CSS.checkboxContainer}`);

    if (checkbox && checkbox.contains(event.target)) {
      checkbox.classList.toggle(ListRenderer.CSS.itemChecked);
      checkbox.classList.add(ListRenderer.CSS.noHover);
      checkbox.addEventListener('mouseleave', () => this.removeSpecialHoverBehavior(checkbox), { once: true });
    }
  }

  /**
   * Removes class responsible for special hover behavior on an item
   *
   * @private
   * @param {Element} el - item wrapper
   * @returns {Element}
   */
  private removeSpecialHoverBehavior(el: HTMLElement) {
    el.classList.remove(ListRenderer.CSS.noHover);
  }
}

