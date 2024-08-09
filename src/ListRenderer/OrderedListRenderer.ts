import type { OrderedListItemMeta } from "../types/ItemMeta";
import { NestedListConfig } from "../types/ListParams";
import * as Dom from '../utils/Dom';
import { ListRendererInterface, DefaultListCssClasses, CssPrefix } from './ListRenderer';
import type { ListCssClasses } from './ListRenderer';

/**
 * CSS classes for the Ordered list
 */
interface OrderedListCssClasses extends ListCssClasses {
  orderedList: string;
}

/**
 * Class that is responsible for ordered list rendering
 */
export class OrderedListRenderer implements ListRendererInterface<OrderedListItemMeta> {
  /**
   * Tool's configuration
   */
  protected config?: NestedListConfig;

  /**
   * Is NestedList Tool read-only option
   */
  private readOnly: boolean;

  static get CSS(): OrderedListCssClasses {
    return {
      ...DefaultListCssClasses,
      orderedList: `${CssPrefix}-ordered`,
    }
  }

  constructor(readonly: boolean, config?: NestedListConfig) {
    this.config = config;
    this.readOnly = readonly;
  }

  /**
   * Renders ol wrapper for list
   * @param level - level of nesting (0 for the rool level)
   * @returns - created html ol element
   */
  renderWrapper(): HTMLOListElement {
    let wrapperElement: HTMLOListElement;

    wrapperElement = Dom.make('ol', [OrderedListRenderer.CSS.wrapper, OrderedListRenderer.CSS.orderedList]) as HTMLOListElement;

    return wrapperElement;
  }
  /**
   * Redners list item element
   * @param content - content of the list item
   * @returns - created html list item element
   */
  renderItem(content: string, meta: OrderedListItemMeta): HTMLLIElement {
    const itemWrapper = Dom.make('li', OrderedListRenderer.CSS.item);
    const itemContent = Dom.make('div', OrderedListRenderer.CSS.itemContent, {
      innerHTML: content,
      contentEditable: (!this.readOnly).toString(),
    });

    itemWrapper.setAttribute('level', meta.level.toString());
    itemWrapper.setAttribute('style', `--level: ${meta.level};`);

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
    const contentNode = item.querySelector(`.${OrderedListRenderer.CSS.itemContent}`);
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
   * @param {Element} item - item of the list to get meta from
   * @returns Item meta object
   */
  getItemMeta(item: Element): OrderedListItemMeta  {
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
    }
  }

  clearItemContent(item: Element): void {
    const itemContent = item.querySelector(`.${OrderedListRenderer.CSS.itemContent}`);

    itemContent?.remove();
  };
}
