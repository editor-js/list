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

  readOnly: boolean;

  constructor(readonly: boolean, config?: NestedListConfig) {
    super();
    this.config = config;
    this.readOnly = readonly;
  }

  /**
   * Renders ol wrapper for list
   * @param classes -
   * @returns - created html ol element
   */
  renderWrapper(classes: string[] = []): HTMLOListElement {
    classes.push(ListRenderer.CSS.wrapperChecklist);

    return Dom.make('ul', [ListRenderer.CSS.wrapper, ...classes]) as HTMLOListElement;
  }

  renderSublistWrapper(): HTMLElement {
    const divElement = Dom.make('ul', [ListRenderer.CSS.wrapperChecklist, ListRenderer.CSS.itemChildren]) as HTMLElement;

    return divElement;
  }

  /**
   * Redners list item element
   * @param content - content of the list item
   * @returns - created html list item element
   */
  renderItem(content: string): HTMLLIElement {
    const itemWrapper = Dom.make('li', [ListRenderer.CSS.item, ListRenderer.CSS.item]);
    const itemBody = Dom.make('div', ListRenderer.CSS.itemBody);
    const itemContent = Dom.make('div', ListRenderer.CSS.itemContent, {
      innerHTML: content,
      contentEditable: (!this.readOnly).toString(),
    });

    const checkbox = Dom.make('span', ListRenderer.CSS.checkbox);
    const checkboxContainer = Dom.make('div', ListRenderer.CSS.checkboxContainer);

    checkbox.innerHTML = IconCheck;
    checkboxContainer.appendChild(checkbox);

    checkboxContainer.addEventListener('click', (event) => {
      this.toggleCheckbox(event);
    });

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

  getItemMeta(item: HTMLElement): ItemMeta {
    return {
      checked: item.classList.contains(ListRenderer.CSS.itemChecked)
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
    const checkListItem = event.target.closest(`.${ListRenderer.CSS.item}`);
    const checkbox = checkListItem.querySelector(`.${ListRenderer.CSS.checkboxContainer}`);

    if (checkbox.contains(event.target)) {
      checkListItem.classList.toggle(ListRenderer.CSS.itemChecked);
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

