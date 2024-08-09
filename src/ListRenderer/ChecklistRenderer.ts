import { IconCheck } from '@codexteam/icons'
import type { ChecklistItemMeta } from "../types/ItemMeta";
import { NestedListConfig } from "../types/ListParams";
import * as Dom from '../utils/Dom';
import { ListRendererInterface, DefaultListCssClasses, CssPrefix } from './ListRenderer';
import type { ListCssClasses } from './ListRenderer';

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
      checkboxContainer: `${CssPrefix}__checkbox`
    }
  }

  constructor(readonly: boolean, config?: NestedListConfig) {
    this.config = config;
    this.readOnly = readonly;
  }

  /**
   * Renders ul wrapper for list
   * @param level - level of nesting (0 for the rool level)
   * @returns - created html ul element
   */
  renderWrapper(): HTMLUListElement {
    let wrapperElement: HTMLUListElement;

    wrapperElement = Dom.make('ul', [CheckListRenderer.CSS.wrapper, CheckListRenderer.CSS.checklist]) as HTMLUListElement;

    /**
     * Delegate clicks from wrapper to items
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

    return wrapperElement;
  }

  /**
   * Redners list item element
   * @param content - content of the list item
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

    itemWrapper.setAttribute('level', meta.level.toString());
    itemWrapper.setAttribute('style', `--level: ${meta.level};`);

    itemWrapper.appendChild(checkboxContainer);
    itemWrapper.appendChild(itemContent);

    return itemWrapper as HTMLLIElement;
  }

  /**
   * Return the item content
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

    const itemLevelAttribute = item.getAttribute('level');

    let itemLevel: number;

    if (itemLevelAttribute === null) {
      itemLevel = 0;
    } else {
      try {
        itemLevel = parseInt(itemLevelAttribute);
      } catch {
        itemLevel = 0;
      };
    }

    return {
      level: itemLevel,
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

  clearItemContent(item: Element): void {
    const itemContent = item.querySelector(`.${CheckListRenderer.CSS.itemContent}`);

    itemContent?.remove();

    const itemCheckbox = item.querySelector(`.${CheckListRenderer.CSS.checkboxContainer}`);

    itemCheckbox?.remove();
  };
}

