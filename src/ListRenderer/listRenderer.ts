/**
 * CSS classes for the Nested List Tool
 */
interface NestedListCssClasses {
  wrapper: string;
  wrapperOrdered: string;
  wrapperUnordered: string;
  wrapperChecklist: string;
  item: string;
  itemBody: string;
  itemContent: string;
  itemChildren: string;
  settingsWrapper: string;
  itemChecked: string;
  noHover: string;
  checkbox: string;
  checkboxContainer: string;
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
  protected get CSS(): NestedListCssClasses {
    return {
      wrapper: 'cdx-nested-list',
      wrapperOrdered: 'cdx-nested-list--ordered',
      wrapperUnordered: 'cdx-nested-list--unordered',
      wrapperChecklist: 'cdx-nested-list--checklist',
      item: 'cdx-nested-list__item',
      itemBody: 'cdx-nested-list__item-body',
      itemContent: 'cdx-nested-list__item-content',
      itemChildren: 'cdx-nested-list__item-children',
      settingsWrapper: 'cdx-nested-list__settings',
      itemChecked: 'cdx-nested-list__item--checked',
      noHover: 'cdx-nested-list__item-checkbox--no-hover',
      checkbox: 'cdx-nested-list__item-checkbox-check',
      checkboxContainer: 'cdx-nested-list__item-checkbox'
    };
  }
}
