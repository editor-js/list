import type { OrderedListItemMeta } from '../types/ItemMeta';
import type { ListConfig } from '../types/ListParams';
import { isEmpty, make } from '@editorjs/dom';
import { DefaultListCssClasses } from './ListRenderer';
import type { ListCssClasses, ListRendererInterface } from './ListRenderer';
import { CssPrefix } from '../styles/CssPrefix';

/**
 * Interface that represents all list used only in unordered list rendering
 */
interface OrderedListCssClasses extends ListCssClasses {
  /**
   * CSS class of the ordered list
   */
  orderedList: string;
}

/**
 * Class that is responsible for ordered list rendering
 */
export class OrderedListRenderer implements ListRendererInterface<OrderedListItemMeta> {
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
  private static get CSS(): OrderedListCssClasses {
    return {
      ...DefaultListCssClasses,
      orderedList: `${CssPrefix}-ordered`,
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
   * Renders ol wrapper for list
   * @param isRoot - boolean variable that represents level of the wrappre (root or childList)
   * @returns - created html ol element
   */
  public renderWrapper(isRoot: boolean): HTMLOListElement {
    let wrapperElement: HTMLOListElement;

    /**
     * Check if it's root level
     */
    if (isRoot === true) {
      wrapperElement = make('ol', [OrderedListRenderer.CSS.wrapper, OrderedListRenderer.CSS.orderedList]) as HTMLOListElement;
    } else {
      wrapperElement = make('ol', [OrderedListRenderer.CSS.orderedList, OrderedListRenderer.CSS.itemChildren]) as HTMLOListElement;
    }

    return wrapperElement;
  }

  /**
   * Redners list item element
   * @param content - content used in list item rendering
   * @param _meta - meta of the list item unused in rendering of the ordered list
   * @returns - created html list item element
   */
  public renderItem(content: string, _meta: OrderedListItemMeta): HTMLLIElement {
    const itemWrapper = make('li', OrderedListRenderer.CSS.item);
    const itemContent = make('div', OrderedListRenderer.CSS.itemContent, {
      innerHTML: content,
      contentEditable: (!this.readOnly).toString(),
    });

    itemWrapper.appendChild(itemContent);

    return itemWrapper as HTMLLIElement;
  }

  /**
   * Return the item content
   * @param item - item wrapper (<li>)
   * @returns - item content string
   */
  public getItemContent(item: Element): string {
    const contentNode = item.querySelector(`.${OrderedListRenderer.CSS.itemContent}`);

    if (!contentNode) {
      return '';
    }

    if (isEmpty(contentNode)) {
      return '';
    }

    return contentNode.innerHTML;
  }

  /**
   * Returns item meta, for ordered list
   * @returns item meta object
   */
  public getItemMeta(): OrderedListItemMeta {
    return {};
  }

  /**
   * Returns default item meta used on creation of the new item
   */
  public composeDefaultMeta(): OrderedListItemMeta {
    return {};
  }
}
