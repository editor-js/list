import type { UnorderedListItemMeta } from "../types/ItemMeta";
import { NestedListConfig } from "../types/ListParams";
import * as Dom from '../utils/Dom';
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
   * @param level - level of nesting (0 for the rool level)
   * @returns - created html ul element
   */
  renderWrapper(): HTMLUListElement {
    let wrapperElement: HTMLUListElement;

    wrapperElement = Dom.make('ul', [UnorderedListRenderer.CSS.wrapper, UnorderedListRenderer.CSS.unorderedList]) as HTMLUListElement;

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
   * @param {Element} item - item of the list to get meta from
   * @returns Item meta object
   */
  getItemMeta(item: Element): UnorderedListItemMeta  {
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
    const itemContent = item.querySelector(`.${UnorderedListRenderer.CSS.itemContent}`);

    itemContent?.remove();
  };
}
