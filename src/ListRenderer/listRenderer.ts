/**
 * CSS classes for the Nested List Tool
 */
interface ListCssClasses {
  wrapper: string;
  item: string;
  itemBody: string;
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
      itemBody: 'cdx-nested-list__item-body',
      itemContent: 'cdx-nested-list__item-content',
      itemChildren: 'cdx-nested-list__item-children',
    };
  }
}
