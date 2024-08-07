import { ChecklistItemMeta, OrderedListItemMeta, UnorderedListItemMeta } from "./ItemMeta";

/**
 * list style to make list as ordered or unordered
 */
export type ListDataStyle = 'ordered' | 'unordered' | 'checklist';

/**
 * Output data
 */
export interface ListData {
  /**
   * list type 'ordered' or 'unordered'
   */
  style: ListDataStyle;
  /**
   * list of first-level elements
   */
  items: ListItem[];
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
export interface NestedListConfig {
  /**
   * default list style: ordered or unordered
   * default is unordered
   */
  defaultStyle?: ListDataStyle;
}
