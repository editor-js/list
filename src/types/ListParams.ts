import type { ChecklistItemMeta, OrderedListItemMeta, UnorderedListItemMeta } from './ItemMeta';
import type { OlCounterType } from './OlCounterType';

/**
 * list style to make list as ordered or unordered
 */
export type ListDataStyle = 'ordered' | 'unordered' | 'checklist';

/**
 * Interface that represents data of the List tool
 */
export interface ListData {
  /**
   * list type 'ordered' or 'unordered' or 'checklist'
   */
  style: ListDataStyle;
  /**
   * list of first-level elements
   */
  items: ListItem[];
  /**
   * Start property used only in ordered list
   */
  start?: number;
  /**
   * Counters type used only in ordered list
   */
  counterType?: OlCounterType;
}

/**
 * Interface that represents data of the List tool
 */
export interface OldListData {
  /**
   * Style of the List tool
   */
  style: 'ordered' | 'unordered';
  /**
   * Array of items of the List tool
   */
  items: string[];
}

/**
 * Interface that represents old checklist data format
 */
export interface OldChecklistData {
  /**
   * Checklist items
   */
  items: OldChecklistItem[];
}

/**
 * Interface that represents old checklist item format
 */
interface OldChecklistItem {
  /**
   * Text of the checklist item
   */
  text: string;
  /**
   * Checked state of the checklist item
   */
  checked: boolean;
}

/**
 * List item within the output data
 */
export interface ListItem {
  /**
   * list item text content
   */
  content: string;

  /**
   * Meta information of each list item
   */
  meta: OrderedListItemMeta | UnorderedListItemMeta | ChecklistItemMeta;

  /**
   * sublist items
   */
  items: ListItem[];
}

/**
 * Tool's configuration
 */
export interface ListConfig {
  /**
   * default list style: ordered or unordered
   * default is unordered
   */
  defaultStyle?: ListDataStyle;
  /**
   * Max level of the nesting in list
   * If nesting is not needed, it could be set to 1
   */
  maxLevel?: number;
}
