import type { UnorderedListItemMeta } from "../types/ItemMeta";
import { NestedListConfig } from "../types/ListParams";
import * as Dom from '@editorjs/dom';
import { ListRendererInterface, DefaultListCssClasses, CssPrefix } from './ListRenderer';
import type { ListCssClasses } from './ListRenderer';

interface UnoderedListCssClasses extends ListCssClasses {
  unorderedList: string;
}

/**
 * Class that is responsible for unordered list rendering
 */
export class UnorderedListRenderer implements ListRendererInterface<UnorderedListItemMeta> {
  /**
   * Tool's configuration
   */
  protected config?: NestedListConfig;

  /**
   * Is NestedList Tool read-only option
   */
  private readOnly: boolean;

  /**
   * Getter for all CSS classes used in unordered list rendering
   */
  static get CSS(): UnoderedListCssClasses {
    return {
      ...DefaultListCssClasses,
      unorderedList: `${CssPrefix}-unordered`,
    }
  }

  constructor(readonly: boolean, config?: NestedListConfig) {
    this.config = config;
    this.readOnly = readonly;
  }

  /**
   * Renders ol wrapper for list
   * @param isRoot - boolean variable that represents level of the wrappre (root or childList)
   * @returns - created html ul element
   */
  renderWrapper(isRoot: boolean): HTMLUListElement {
    let wrapperElement: HTMLUListElement;

    /**
     * Check if it's root level
     */
    if (isRoot === true) {
      wrapperElement = Dom.make('ul', [UnorderedListRenderer.CSS.wrapper, UnorderedListRenderer.CSS.unorderedList]) as HTMLUListElement;
    } else {
      wrapperElement = Dom.make('ul', [UnorderedListRenderer.CSS.unorderedList, UnorderedListRenderer.CSS.itemChildren]) as HTMLUListElement;
    }

    return wrapperElement;
  }

  /**
   * Redners list item element
   * @param content - content of the list item
   * @returns - created html list item element
   */
  renderItem(content: string, meta: UnorderedListItemMeta): HTMLLIElement {
    const itemWrapper = Dom.make('li', UnorderedListRenderer.CSS.item);
    const itemContent = Dom.make('div', UnorderedListRenderer.CSS.itemContent, {
      innerHTML: content,
      contentEditable: (!this.readOnly).toString(),
    });

    itemWrapper.appendChild(itemContent);

    return itemWrapper as HTMLLIElement;
  }

  /**
   * Return the item content
   *
   * @param {Element} item - item wrapper (<li>)
   * @returns {string}
   */
  getItemContent(item: Element): string {
    const contentNode = item.querySelector(`.${UnorderedListRenderer.CSS.itemContent}`);
    if (!contentNode) {
      return '';
    }

    if (Dom.isEmpty(contentNode)) {
      return '';
    }

    return contentNode.innerHTML;
  }

  /**
   * Returns item meta, for unordered list
   * @returns Item meta object
   */
  getItemMeta(): UnorderedListItemMeta  {
    return {}
  }

  /**
   * Returns default item meta used on creation of the new item
   */
  composeDefaultMeta(): UnorderedListItemMeta {
    return {};
  }
}
