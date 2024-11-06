import { CssPrefix } from '../styles/CssPrefix';
/**
 * CSS classes for the List Tool
 */
export const DefaultListCssClasses = {
  wrapper: CssPrefix,
  item: `${CssPrefix}__item`,
  itemContent: `${CssPrefix}__item-content`,
  itemChildren: `${CssPrefix}__item-children`,
};

/**
 * Interface that represents default list css classes
 */
export interface ListCssClasses {
  /**
   * CSS class of the whole list wrapper
   */
  wrapper: string;

  /**
   * CSS class of the list item
   */
  item: string;

  /**
   * CSS class of the list item content element
   */
  itemContent: string;

  /**
   * CSS class of the children item wrapper
   */
  itemChildren: string;
}

/**
 * Interface that represents all list renderer classes
 */
export interface ListRendererInterface<ItemMeta> {
  /**
   * Renders wrapper for list
   * @param isRoot - boolean variable that represents level of the wrappre (root or childList)
   * @returns - created html ul element
   */
  renderWrapper: (isRoot: boolean) => HTMLElement;

  /**
   * Redners list item element
   * @param content - content of the list item
   * @returns - created html list item element
   */
  renderItem: (content: string, meta: ItemMeta) => HTMLElement;

  /**
   * Return the item content
   * @param {Element} item - item wrapper (<li>)
   * @returns {string}
   */
  getItemContent: (item: Element) => string;

  /**
   * Return meta object of certain element
   * @param {Element} item - item of the list to get meta from
   * @returns {ItemMeta} Item meta object
   */
  getItemMeta: (item: Element) => ItemMeta;

  /**
   * Returns default item meta used on creation of the new item
   */
  composeDefaultMeta: () => ItemMeta;
};
