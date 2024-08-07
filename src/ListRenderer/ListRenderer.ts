/**
 * CSS classes for the Nested List Tool
 */
export interface ListCssClasses {
  wrapper: string;
  item: string;
  itemContent: string;
  itemChildren: string;
}

/**
 * List renderer class
 * Used for storing css classes and
 */
export abstract class ListRenderer {
  /**
   * Styles
   *
   * @returns {NestedListCssClasses} - CSS classes names by keys
   * @private
   */
  static get CSS(): ListCssClasses {
    return {
      wrapper: 'cdx-nested-list',
      item: 'cdx-nested-list__item',
      itemContent: 'cdx-nested-list__item-content',
      itemChildren: 'cdx-nested-list__item-children',
    };
  }
}