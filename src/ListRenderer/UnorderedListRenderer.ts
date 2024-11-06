import type { UnorderedListItemMeta } from '../types/ItemMeta';
import type { ListConfig } from '../types/ListParams';
import { make, isEmpty } from '@editorjs/dom';
import { DefaultListCssClasses } from './ListRenderer';
import type { ListCssClasses, ListRendererInterface } from './ListRenderer';
import { CssPrefix } from '../styles/CssPrefix';

/**
 * Interface that represents all list used only in unordered list rendering
 */
interface UnoderedListCssClasses extends ListCssClasses {
  /**
   * CSS class of the unordered list
   */
  unorderedList: string;
}

/**
 * Class that is responsible for unordered list rendering
 */
export class UnorderedListRenderer implements ListRendererInterface<UnorderedListItemMeta> {
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
  private static get CSS(): UnoderedListCssClasses {
    return {
      ...DefaultListCssClasses,
      unorderedList: `${CssPrefix}-unordered`,
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
   * @returns - created html ul element
   */
  public renderWrapper(isRoot: boolean): HTMLUListElement {
    let wrapperElement: HTMLUListElement;

    /**
     * Check if it's root level
     */
    if (isRoot === true) {
      wrapperElement = make('ul', [UnorderedListRenderer.CSS.wrapper, UnorderedListRenderer.CSS.unorderedList]) as HTMLUListElement;
    } else {
      wrapperElement = make('ul', [UnorderedListRenderer.CSS.unorderedList, UnorderedListRenderer.CSS.itemChildren]) as HTMLUListElement;
    }

    return wrapperElement;
  }

  /**
   * Redners list item element
   * @param content - content used in list item rendering
   * @param _meta - meta of the list item unused in rendering of the unordered list
   * @returns - created html list item element
   */
  public renderItem(content: string, _meta: UnorderedListItemMeta): HTMLLIElement {
    const itemWrapper = make('li', UnorderedListRenderer.CSS.item);
    const itemContent = make('div', UnorderedListRenderer.CSS.itemContent, {
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
    const contentNode = item.querySelector(`.${UnorderedListRenderer.CSS.itemContent}`);

    if (!contentNode) {
      return '';
    }

    if (isEmpty(contentNode)) {
      return '';
    }

    return contentNode.innerHTML;
  }

  /**
   * Returns item meta, for unordered list
   * @returns Item meta object
   */
  public getItemMeta(): UnorderedListItemMeta {
    return {};
  }

  /**
   * Returns default item meta used on creation of the new item
   */
  public composeDefaultMeta(): UnorderedListItemMeta {
    return {};
  }
}
