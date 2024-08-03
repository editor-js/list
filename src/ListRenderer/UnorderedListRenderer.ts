import type { UnorderedListItemMeta } from "../types/itemMeta";
import { NestedListConfig } from "../types/listParams";
import * as Dom from '../utils/dom';
import { ListRenderer } from './ListRenderer';
import type { ListCssClasses } from './ListRenderer';

interface UnoderedListCssClasses extends ListCssClasses {
  wrapperUnordered: string;
}

/**
 * Class that is responsible for unordered list rendering
 */
export class UnorderedListRenderer extends ListRenderer {
  /**
   * Tool's configuration
   */
  protected config?: NestedListConfig;

  /**
   * Is NestedList Tool read-only option
   */
  private readOnly: boolean;


  static get CSS(): UnoderedListCssClasses {
    const listCssClasses = super.CSS;

    return {
      ...listCssClasses,
      wrapperUnordered: 'cdx-nested-list--unordered',
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
      wrapperElement = Dom.make('ul', [UnorderedListRenderer.CSS.wrapper, UnorderedListRenderer.CSS.wrapperUnordered]) as HTMLUListElement;
    } else {
      wrapperElement = Dom.make('ul', [UnorderedListRenderer.CSS.wrapperUnordered, UnorderedListRenderer.CSS.itemChildren]) as HTMLUListElement;
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
    const itemBody = Dom.make('div', UnorderedListRenderer.CSS.itemBody);
    const itemContent = Dom.make('div', UnorderedListRenderer.CSS.itemContent, {
      innerHTML: content,
      contentEditable: (!this.readOnly).toString(),
    });

    itemBody.appendChild(itemContent);
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
}
