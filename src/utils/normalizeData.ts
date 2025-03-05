import type { OldListData, ListData, ListItem, OldChecklistData, OldNestedListData } from '../types/ListParams';

/**
 * Method that checks if data is result of the Old list tool save mtehod
 * @param data - data of the OldList, Checklist, OldNestedList or Editorjs List tool
 * @returns true if data related to the List tool, false otherwise
 */
function instanceOfOldListData(data: ListData | OldListData | OldChecklistData | OldNestedListData): data is OldListData {
  return (typeof data.items[0] === 'string');
}

/**
 * Method that checks if data is result of the Old nested list tool save method
 * @param data - data of the OldList, Checklist, OldNestedList or Editorjs List tool
 * @returns true if data is related to the Nested List tool, false otherwise
 */
function instanceOfOldNestedListData(data: ListData | OldListData | OldChecklistData | OldNestedListData): data is OldNestedListData {
  return !('meta' in data);
}

/**
 * Method that checks if data is result of the Old checklist tool save method
 * @param data - data of the Checklist, OldList, OldNestedList or Editorjs List tool
 * @returns true if data is related to the Checklist tool, false otherwise
 */
function instanceOfChecklistData(data: ListData | OldListData | OldChecklistData | OldNestedListData): data is OldChecklistData {
  return (
    typeof data.items[0] !== 'string'
    && 'text' in data.items[0]
    && 'checked' in data.items[0]
    && typeof data.items[0].text === 'string'
    && typeof data.items[0].checked === 'boolean'
  );
}

/**
 * Method that checks if passed data is related to the legacy format and normalizes it
 * @param data - data to be checked
 * @returns - normalized data, ready to be used by Editorjs List tool
 */
export default function normalizeData(data: ListData | OldListData | OldChecklistData): ListData {
  const normalizedDataItems: ListItem[] = [];

  if (instanceOfOldListData(data)) {
    data.items.forEach((item) => {
      normalizedDataItems.push({
        content: item,
        meta: {},
        items: [],
      });
    });

    return {
      style: data.style,
      meta: {},
      items: normalizedDataItems,
    };
  } else if (instanceOfChecklistData(data)) {
    data.items.forEach((item) => {
      normalizedDataItems.push({
        content: item.text,
        meta: {
          checked: item.checked,
        },
        items: [],
      });
    });

    return {
      style: 'checklist',
      meta: {},
      items: normalizedDataItems,
    };
  } else if (instanceOfOldNestedListData(data)) {
    return {
      style: data.style,
      meta: {},
      items: data.items,
    };
  } else {
    return data;
  }
};
