
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
}

/**
 * Interface that represents default list css classes
 */
export interface ListCssClasses {
  wrapper: string;
  item: string;
  itemContent: string;
  itemChildren: string;
}

/**
 * Interface that represents all list renderer classes
 */
export interface ListRendererInterface<ItemMeta> {
  /**
   * Renders wrapper for list
   * @param level - level of nesting (0 for the rool level)
   * @returns - created html ul element
   */
  renderWrapper: (level: number) => HTMLElement;

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
};
