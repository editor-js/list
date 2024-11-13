import { IconCheck } from '@codexteam/icons';
import type { ChecklistItemMeta } from '../types/ItemMeta';
import type { ListConfig } from '../types/ListParams';
import { isEmpty, make } from '@editorjs/dom';
import { DefaultListCssClasses } from './ListRenderer';
import type { ListCssClasses, ListRendererInterface } from './ListRenderer';
import { CssPrefix } from '../styles/CssPrefix';

/**
 * Interface that represents all list used only in unordered list rendering
 */
interface ChecklistCssClasses extends ListCssClasses {
  /**
   * CSS class of the checklist
   */
  checklist: string;

  /**
   * CSS class of the checked checkbox
   */
  itemChecked: string;

  /**
   * CSS class for the special hover behavior of the checkboc
   */
  noHover: string;

  /**
   * CSS class of the checkbox
   */
  checkbox: string;

  /**
   * CSS class of the checkbox container
   */
  checkboxContainer: string;
}

/**
 * Class that is responsible for checklist rendering
 */
export class CheckListRenderer implements ListRendererInterface<ChecklistItemMeta> {
  /**
   * Tool's configuration
   */
  protected config?: ListConfig;

  /**
   * Is Editorjs List Tool read-only option
   */
  private readOnly: boolean;

  /**
   * Getter for all CSS classes used in unordered list rendering
   */
  private static get CSS(): ChecklistCssClasses {
    return {
      ...DefaultListCssClasses,
      checklist: `${CssPrefix}-checklist`,
      itemChecked: `${CssPrefix}__checkbox--checked`,
      noHover: `${CssPrefix}__checkbox--no-hover`,
      checkbox: `${CssPrefix}__checkbox-check`,
      checkboxContainer: `${CssPrefix}__checkbox`,
    };
  }

  /**
   * Assign passed readonly mode and config to relevant class properties
   * @param readonly - read-only mode flag
   * @param config - user config for Tool
   */
  constructor(readonly: boolean, config?: ListConfig) {
    this.config = config;
    this.readOnly = readonly;
  }

  /**
   * Renders ul wrapper for list
   * @param isRoot - boolean variable that represents level of the wrappre (root or childList)
   * @returns - created html ul element
   */
  public renderWrapper(isRoot: boolean): HTMLUListElement {
    let wrapperElement: HTMLUListElement;

    /**
     * Check if it's root level
     */
    if (isRoot === true) {
      wrapperElement = make('ul', [CheckListRenderer.CSS.wrapper, CheckListRenderer.CSS.checklist]) as HTMLUListElement;

      /**
       * Delegate clicks from wrapper to items
       */
      wrapperElement.addEventListener('click', (event) => {
        const target = event.target as Element | null;

        if (target) {
          const checkbox = target.closest(`.${CheckListRenderer.CSS.checkboxContainer}`);

          if (checkbox && checkbox.contains(target)) {
            this.toggleCheckbox(checkbox);
          }
        }
      });
    } else {
      wrapperElement = make('ul', [CheckListRenderer.CSS.checklist, CheckListRenderer.CSS.itemChildren]) as HTMLUListElement;
    }

    return wrapperElement;
  }

  /**
   * Redners list item element
   * @param content - content used in list item rendering
   * @param meta - meta of the list item used in rendering of the checklist
   * @returns - created html list item element
   */
  public renderItem(content: string, meta: ChecklistItemMeta): HTMLLIElement {
    const itemWrapper = make('li', [CheckListRenderer.CSS.item, CheckListRenderer.CSS.item]);
    const itemContent = make('div', CheckListRenderer.CSS.itemContent, {
      innerHTML: content,
      contentEditable: (!this.readOnly).toString(),
    });

    const checkbox = make('span', CheckListRenderer.CSS.checkbox);
    const checkboxContainer = make('div', CheckListRenderer.CSS.checkboxContainer);

    if (meta.checked === true) {
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
   * @returns - item content string
   */
  public getItemContent(item: Element): string {
    const contentNode = item.querySelector(`.${CheckListRenderer.CSS.itemContent}`);

    if (!contentNode) {
      return '';
    }

    if (isEmpty(contentNode)) {
      return '';
    }

    return contentNode.innerHTML;
  }

  /**
   * Return meta object of certain element
   * @param item - will be returned meta information of this item
   * @returns Item meta object
   */
  public getItemMeta(item: Element): ChecklistItemMeta {
    const checkbox = item.querySelector(`.${CheckListRenderer.CSS.checkboxContainer}`);

    return {
      checked: checkbox ? checkbox.classList.contains(CheckListRenderer.CSS.itemChecked) : false,
    };
  }

  /**
   * Returns default item meta used on creation of the new item
   */
  public composeDefaultMeta(): ChecklistItemMeta {
    return { checked: false };
  }

  /**
   * Toggle checklist item state
   * @param checkbox - checkbox element to be toggled
   */
  private toggleCheckbox(checkbox: Element): void {
    checkbox.classList.toggle(CheckListRenderer.CSS.itemChecked);
    checkbox.classList.add(CheckListRenderer.CSS.noHover);
    checkbox.addEventListener('mouseleave', () => this.removeSpecialHoverBehavior(checkbox), { once: true });
  }

  /**
   * Removes class responsible for special hover behavior on an item
   * @param el - item wrapper
   */
  private removeSpecialHoverBehavior(el: Element): void {
    el.classList.remove(CheckListRenderer.CSS.noHover);
  }
}
