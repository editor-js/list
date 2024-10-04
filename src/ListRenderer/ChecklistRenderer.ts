import { IconCheck } from '@codexteam/icons';
import type { ChecklistItemMeta } from '../types/ItemMeta';
import type { NestedListConfig } from '../types/ListParams';
import * as Dom from '@editorjs/dom';
import { DefaultListCssClasses, CssPrefix } from './ListRenderer';
import type { ListCssClasses, ListRendererInterface } from './ListRenderer';

interface ChecklistCssClasses extends ListCssClasses {
  checklist: string;
  itemChecked: string;
  noHover: string;
  checkbox: string;
  checkboxContainer: string;
}

/**
 * Class that is responsible for checklist rendering
 */
export class CheckListRenderer implements ListRendererInterface<ChecklistItemMeta> {
  /**
   * Tool's configuration
   */
  protected config?: NestedListConfig;

  /**
   * Is NestedList Tool read-only option
   */
  private readOnly: boolean;

  static get CSS(): ChecklistCssClasses {
    return {
      ...DefaultListCssClasses,
      checklist: `${CssPrefix}-checklist`,
      itemChecked: `${CssPrefix}__checkbox--checked`,
      noHover: `${CssPrefix}__checkbox--no-hover`,
      checkbox: `${CssPrefix}__checkbox-check`,
      checkboxContainer: `${CssPrefix}__checkbox`,
    };
  }

  constructor(readonly: boolean, config?: NestedListConfig) {
    this.config = config;
    this.readOnly = readonly;
  }

  /**
   * Renders ul wrapper for list
   * @param isRoot - boolean variable that represents level of the wrappre (root or childList)
   * @returns - created html ul element
   */
  renderWrapper(isRoot: boolean): HTMLUListElement {
    let wrapperElement: HTMLUListElement;

    /**
     * Check if it's root level
     */
    if (isRoot === true) {
      wrapperElement = Dom.make('ul', [CheckListRenderer.CSS.wrapper, CheckListRenderer.CSS.checklist]) as HTMLUListElement;

      /**
       * Delegate clicks from wrapper to items
       */
      wrapperElement.addEventListener('click', (event) => {
        const target = event.target as Element;

        if (target) {
          const checkbox = target.closest(`.${CheckListRenderer.CSS.checkboxContainer}`);

          if (checkbox && checkbox.contains(target)) {
            this.toggleCheckbox(checkbox);
          }
        }
      });
    } else {
      wrapperElement = Dom.make('ul', [CheckListRenderer.CSS.checklist, CheckListRenderer.CSS.itemChildren]) as HTMLUListElement;
    }

    return wrapperElement;
  }

  /**
   * Redners list item element
   * @param content - content of the list item
   * @param meta - meta of the list item used in rendering of the checklist
   * @returns - created html list item element
   */
  renderItem(content: string, meta: ChecklistItemMeta): HTMLLIElement {
    const itemWrapper = Dom.make('li', [CheckListRenderer.CSS.item, CheckListRenderer.CSS.item]);
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

    itemWrapper.appendChild(checkboxContainer);
    itemWrapper.appendChild(itemContent);

    return itemWrapper as HTMLLIElement;
  }

  /**
   * Return the item content
   * @param item - item wrapper (<li>)
   * @returns
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
   * @param item - item of the list to get meta from
   * @returns Item meta object
   */
  getItemMeta(item: Element): ChecklistItemMeta {
    const checkbox = item.querySelector(`.${CheckListRenderer.CSS.checkboxContainer}`);

    return {
      checked: checkbox ? checkbox.classList.contains(CheckListRenderer.CSS.itemChecked) : false,
    };
  }

  /**
   * Returns default item meta used on creation of the new item
   */
  composeDefaultMeta(): ChecklistItemMeta {
    return { checked: false };
  }

  /**
   * Toggle checklist item state
   * @param checkbox
   * @returns
   */
  private toggleCheckbox(checkbox: Element): void {
    checkbox.classList.toggle(CheckListRenderer.CSS.itemChecked);
    checkbox.classList.add(CheckListRenderer.CSS.noHover);
    checkbox.addEventListener('mouseleave', () => this.removeSpecialHoverBehavior(checkbox), { once: true });
  }

  /**
   * Removes class responsible for special hover behavior on an item
   * @param el - item wrapper
   * @returns
   */
  private removeSpecialHoverBehavior(el: Element) {
    el.classList.remove(CheckListRenderer.CSS.noHover);
  }
}
