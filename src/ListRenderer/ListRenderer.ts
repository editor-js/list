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
 * List renderer interface
 * It is implemented by all renderer classes
 */
export interface ListRendererInterface {

}
