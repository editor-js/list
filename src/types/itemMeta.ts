/**
 * Meta information of each list item
 */
interface ItemMeta {};

/**
 * Meta information of checklist item
 */
export interface ChecklistItemMeta extends ItemMeta {
  /**
   * State of the checkbox of the item
   */
  checked: boolean;
};

export interface OrderedListItemMeta extends ItemMeta {};

export interface UnorderedListItemMeta extends ItemMeta {};
