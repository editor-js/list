import type { OlCounterType } from './OlCounterType';

/**
 * Meta information of each list item
 */
export interface ItemMetaBase {}

/**
 * Meta information of checklist item
 */
export interface ChecklistItemMeta extends ItemMetaBase {
  /**
   * State of the checkbox of the item
   */
  checked: boolean;
}

/**
 * Meta information of ordered list item
 */
export interface OrderedListItemMeta extends ItemMetaBase {
  /**
   * If passed, ordered list counters will start with this index
   */
  start?: number;
  /**
   * Counters type used only in ordered list
   */
  counterType?: OlCounterType;
}

/**
 * Meta information of unordered list item
 */
export interface UnorderedListItemMeta extends ItemMetaBase {}

/**
 * Type that represents all available meta objects for list item
 */
export type ItemMeta = ChecklistItemMeta | OrderedListItemMeta | UnorderedListItemMeta;
