import { IconCheck } from '@codexteam/icons'
import type { ChecklistItemMeta } from "../types/itemMeta";
import { NestedListConfig } from "../types/listParams";
import * as Dom from '../utils/dom';
import { ListRenderer } from './ListRenderer';

interface ChecklistCssClasses {
  wrapper: string;
  wrapperChecklist: string;
  item: string;
  itemBody: string;
  itemContent: string;
  itemChildren: string;
  itemChecked: string;
  noHover: string;
  checkbox: string;
  checkboxContainer: string;
}

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
  private readOnly: boolean;

  static get CSS(): ChecklistCssClasses {
    const listCssClasses = super.CSS;

    return {
      ...listCssClasses,
      wrapperChecklist: 'cdx-nested-list--checklist',
      itemChecked: 'cdx-nested-list__checkbox--checked',
      noHover: 'cdx-nested-list__checkbox--no-hover',
      checkbox: 'cdx-nested-list__checkbox-check',
      checkboxContainer: 'cdx-nested-list__checkbox'
    }
  }

  constructor(readonly: boolean, config?: NestedListConfig) {
    super();
    this.config = config;
    this.readOnly = readonly;
  }

  /**
   * Renders ol wrapper for list
   * @param level - level of nesting (0 for the rool level)
   * @returns - created html ul element
   */
  renderWrapper(level: number): HTMLUListElement {
    let wrapperElement: HTMLUListElement;

    /**
     * Check if it's root level
     */
    if (level === 0) {
      wrapperElement = Dom.make('ul', [CheckListRenderer.CSS.wrapper, CheckListRenderer.CSS.wrapperChecklist]) as HTMLUListElement;

      /**
       * Listen to clicks on checkbox
       */
      wrapperElement.addEventListener('click', (event) => {
        const target = event.target as Element;
        if (target){
          const checkbox = target.closest(`.${CheckListRenderer.CSS.checkboxContainer}`);

          if (checkbox && checkbox.contains(target)) {
            this.toggleCheckbox(checkbox);
          }
        }
      });
    } else {
      wrapperElement = Dom.make('ul', [CheckListRenderer.CSS.wrapperChecklist, CheckListRenderer.CSS.itemChildren]) as HTMLUListElement;
    }

    return wrapperElement;
  }

  /**
   * Redners list item element
   * @param content - content of the list item
   * @returns - created html list item element
   */
  renderItem(content: string, meta: ChecklistItemMeta ): HTMLLIElement {
    const itemWrapper = Dom.make('li', [CheckListRenderer.CSS.item, CheckListRenderer.CSS.item]);
    const itemBody = Dom.make('div', CheckListRenderer.CSS.itemBody);
    const itemContent = Dom.make('div', CheckListRenderer.CSS.itemContent, {
      innerHTML: content,
      contentEditable: (!this.readOnly).toString(),
    });

    const checkbox = Dom.make('span', CheckListRenderer.CSS.checkbox);
    const checkboxContainer = Dom.make('div', CheckListRenderer.CSS.checkboxContainer);

    if (meta && meta.checked === true) {
      checkboxContainer.classList.add(CheckListRenderer.CSS.itemChecked);
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
    const contentNode = item.querySelector(`.${CheckListRenderer.CSS.itemContent}`);
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
  getItemMeta(item: Element): ChecklistItemMeta  {
    const checkbox = item.querySelector(`.${CheckListRenderer.CSS.checkboxContainer}`);

    return {
      checked: checkbox ? checkbox.classList.contains(CheckListRenderer.CSS.itemChecked) : false,
    }
  }

  /**
   * Toggle checklist item state
   *
   * @private
   * @param {MouseEvent} event - click
   * @returns {void}
   */
  private toggleCheckbox(checkbox: Element): void {
    checkbox.classList.toggle(CheckListRenderer.CSS.itemChecked);
    checkbox.classList.add(CheckListRenderer.CSS.noHover);
    checkbox.addEventListener('mouseleave', () => this.removeSpecialHoverBehavior(checkbox), { once: true });
    }

  /**
   * Removes class responsible for special hover behavior on an item
   *
   * @private
   * @param {Element} el - item wrapper
   * @returns {Element}
   */
  private removeSpecialHoverBehavior(el: Element) {
    el.classList.remove(CheckListRenderer.CSS.noHover);
  }
}

