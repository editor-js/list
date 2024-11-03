import type { OldListData, ListData, ListItem, OldChecklistData } from '../types/ListParams';

/**
 * Method that checks if data is related to the List Tool
 * @param data - data of the List or NestedList tool
 * @returns true if data related to the List tool, false otherwise
 */
function instanceOfListData(data: ListData | OldListData | OldChecklistData): data is OldListData {
  return (typeof data.items[0] === 'string');
}

/**
 * Method that checks if data is related to the Checklist tool
 * @param data - data of the Checklist of NestedList tool
 * @returns true if data is related to the Checklist tool, false otherwise
 */
function instanceOfChecklistData(data: ListData | OldListData | OldChecklistData): data is OldChecklistData {
  console.log('check for checklist');

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
 * @returns - normalized data, ready to be used by Nested List tool
 */
export default function normalizeData(data: ListData | OldListData | OldChecklistData): ListData {
  const normalizedDataItems: ListItem[] = [];

  if (instanceOfListData(data)) {
    data.items.forEach((item) => {
      normalizedDataItems.push({
        content: item,
        meta: {},
        items: [],
      });
    });

    return {
      style: data.style,
      items: normalizedDataItems,
    };
  } else if (instanceOfChecklistData(data)) {
    console.log('data normaizedd');

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
      items: normalizedDataItems,
    };
  } else {
    return data;
  }
};
