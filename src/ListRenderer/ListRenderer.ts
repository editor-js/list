
/**
 * Default css prefix for list
 */
export const CssPrefix = 'cdx-list';

/**
 * CSS classes for the List Tool
 */
export const DefaultListCssClasses = {
  wrapper: CssPrefix,
  item: `${CssPrefix}__item`,
  itemContent: `${CssPrefix}__item-content`,
  itemChildren: `${CssPrefix}__item-children`,
  itemAnchor: `${CssPrefix}-anchor`,
}

/**
 * Interface that represents default list css classes
 */
export interface ListCssClasses {
  wrapper: string;
  item: string;
  itemContent: string;
  itemChildren: string;
  itemAnchor: string;
}

/**
 * Interface that represents all list renderer classes
 */
export interface ListRendererInterface<ItemMeta> {
  /**
   * Renders wrapper for list
   * @returns - created html element
   */
  renderWrapper: () => HTMLElement;

  /**
   * Redners list item element
   * @param content - content of the list item
   * @returns - created html list item element
   */
  renderItem: (content: string, meta: ItemMeta, level: number) => HTMLElement | null;

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
   * Deletes item content with list bullet (could be checkbox or counter or bullet)
   * @param item - item, whose content would be cleared
   * @returns {void}
   */
  clearItemContent: (item: Element) => void;
};
