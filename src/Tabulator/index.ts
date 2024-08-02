import { CheckListRenderer } from "../ListRenderer/checklistRenderer";
import { OrderedListRenderer } from "../ListRenderer/orderedListRenderer";
import { UnorderedListRenderer } from "../ListRenderer/unorderedListRenderer";
import { NestedListConfig, ListData } from "../types/listParams"
import { ListItem } from "../types/listParams";

type NestedListStyle = 'ordered' | 'unordered' | 'checklist';

type ListRendererTypes = OrderedListRenderer | UnorderedListRenderer | CheckListRenderer;

/**
 * Class that is responsible for list tabulation
 */
export default class Tabulator {
  /**
   * Tool's configuration
   */
  config?: NestedListConfig;

  /**
   * Style of the nested list
   */
  style: NestedListStyle;

  /**
   * Full content of the list
   */
  data: ListData;

  constructor(data: ListData, style: NestedListStyle, config?: NestedListConfig) {
    this.config = config;
    this.data = data;
    this.style = style;
  }

  render() {
    let list;

    console.log('style', this.style)

    switch (this.style) {
      case 'ordered':
        list = new OrderedListRenderer(this.config);
      case 'unordered':
        list = new UnorderedListRenderer(this.config);
      case 'checklist':
        list = new CheckListRenderer(this.config);
    }

    const listWrapper = list.renderWrapper();

    // fill with data
    if (this.data.items.length) {
      this.appendItems(list, this.data.items, listWrapper);
    } else {
      this.appendItems(
        list,
        [
          {
            content: '',
            items: [],
          },
        ],
        listWrapper,
      );
    }

    return listWrapper;
  }

  /**
   * Renders children list
   *
   * @param list - initialized ListRenderer instance
   * @param {ListItem[]} items - items data to append
   * @param {Element} parentItem - where to append
   * @returns {void}
   */
  appendItems(list: ListRendererTypes, items: ListItem[], parentItem: Element): void {
    items.forEach((item) => {
      const itemEl = list.renderItem(item.content);

      console.log('rendered item', itemEl, itemEl instanceof HTMLLIElement)

      if (itemEl instanceof Node) {
        console.log(parentItem instanceof Node, itemEl instanceof Node);
        parentItem.appendChild(itemEl);
      } else {
        console.log(itemEl)
      }
    });
  }
}
