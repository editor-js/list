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

  constructor(config?: NestedListConfig) {
    super();
    this.config = config;
  }

  /**
   * Renders ol wrapper for list
   * @param classes -
   * @returns - created html ol element
   */
  renderWrapper(classes: string[] = []): HTMLOListElement {
    classes.push(this.CSS.wrapperChecklist);

    return Dom.make('ul', [this.CSS.wrapper, ...classes]) as HTMLOListElement;
  }

  renderSublistWrapper(): HTMLElement {
    const divElement = Dom.make('ul', [this.CSS.wrapperChecklist, this.CSS.itemChildren]) as HTMLElement;

    return divElement;
  }

  /**
   * Redners list item element
   * @param content - content of the list item
   * @returns - created html list item element
   */
  renderItem(content: string): HTMLLIElement {
    const itemWrapper = Dom.make('li', [this.CSS.item, this.CSS.item]);
    const itemBody = Dom.make('div', this.CSS.itemBody);
    const itemContent = Dom.make('div', this.CSS.itemContent, {
      innerHTML: content,
    });

    const checkbox = Dom.make('span', this.CSS.checkbox);
    const checkboxContainer = Dom.make('div', this.CSS.checkboxContainer);

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
    const contentNode = item.querySelector(`.${this.CSS.itemContent}`);
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
      checked: item.classList.contains(this.CSS.itemChecked)
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
    const checkListItem = event.target.closest(`.${this.CSS.item}`);
    const checkbox = checkListItem.querySelector(`.${this.CSS.checkboxContainer}`);

    if (checkbox.contains(event.target)) {
      checkListItem.classList.toggle(this.CSS.itemChecked);
      checkbox.classList.add(this.CSS.noHover);
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
    el.classList.remove(this.CSS.noHover);
  }
}

