/**
 * Meta information of each list item
 */
export interface ItemMeta {
  /**
   * Level of the current item nesting
   */
  level: number;
};

/**
 * Meta information of checklist item
 */
export interface ChecklistItemMeta extends ItemMeta {
  /**
   * State of the checkbox of the item
   */
  checked: boolean;
};

/**
 * Meta information of ordered list item
 */
export interface OrderedListItemMeta extends ItemMeta {};

/**
 * Meta information of unordered list item
 */
export interface UnorderedListItemMeta extends ItemMeta {};
