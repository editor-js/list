import type { OldListData, ListData, ListItem } from '../types/ListParams';

/**
 * Method that checks if data is related to the List or NestedListTool
 * @param data - data of the List or NestedListTool
 * @returns true if data related to the List tool, false if to Nested List tool
 */
function instanceOfListData(data: ListData | OldListData): data is OldListData {
  return (typeof data.items[0] === 'string');
}

/**
 * Method that normalizes checks if passed data is related to the List tool and normalizes it
 * @param data - data to be checked
 * @returns - normalized data, ready to be used by Nested List tool
 */
export default function normalizeData(data: ListData | OldListData): ListData {
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
  } else {
    return data;
  }
};
