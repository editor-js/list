import type { OrderedListItemMeta } from "../types/itemMeta";
import { NestedListConfig } from "../types/listParams";
import * as Dom from '../utils/dom';
import { ListRenderer } from './ListRenderer';

/**
 * Class that is responsible for ordered list rendering
 */
export class OrderedListRenderer extends ListRenderer {
  /**
   * Tool's configuration
   */
  protected config?: NestedListConfig;

  /**
   * Is NestedList Tool read-only option
   */
  private readOnly: boolean;

  constructor(readonly: boolean, config?: NestedListConfig) {
    super();
    this.config = config;
    this.readOnly = readonly;
  }

  /**
   * Renders ol wrapper for list
   * @param level - level of nesting (0 for the rool level)
   * @returns - created html ol element
   */
  renderWrapper(level: number): HTMLOListElement {
    let wrapperElement: HTMLOListElement;

    /**
     * Check if it's root level
     */
    if (level === 0) {
      wrapperElement = Dom.make('ol', [ListRenderer.CSS.wrapper, ListRenderer.CSS.wrapperUnordered]) as HTMLOListElement;
    } else {
      wrapperElement = Dom.make('ol', [ListRenderer.CSS.wrapperUnordered, ListRenderer.CSS.itemChildren]) as HTMLOListElement;
    }

    return wrapperElement;
  }
  /**
   * Redners list item element
   * @param content - content of the list item
   * @returns - created html list item element
   */
  renderItem(content: string): HTMLLIElement {
    const itemWrapper = Dom.make('li', ListRenderer.CSS.item);
    const itemBody = Dom.make('div', ListRenderer.CSS.itemBody);
    const itemContent = Dom.make('div', ListRenderer.CSS.itemContent, {
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
   * Returns item meta, for ordered list
   * @returns Item meta object
   */
  getItemMeta(): OrderedListItemMeta  {
    return {}
  }
}
