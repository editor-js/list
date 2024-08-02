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

  /**
   * Rendered list of items
   */
  list: ListRendererTypes | undefined;

  /**
   * Wrapper of the whole list
   */
  listWrapper: HTMLElement | undefined;

  constructor(data: ListData, style: NestedListStyle, config?: NestedListConfig) {
    this.config = config;
    this.data = data;
    this.style = style;
  }

  render() {
    console.log(this.style);

    switch (this.style) {
      case 'ordered':
        this.list = new OrderedListRenderer(this.config);
        break
      case 'unordered':
        this.list = new UnorderedListRenderer(this.config);
        break
      case 'checklist':
        this.list = new CheckListRenderer(this.config);
        break
    }

    this.listWrapper = this.list.renderWrapper();

    // fill with data
    if (this.data.items.length) {
      this.appendItems(this.data.items, this.listWrapper);
    } else {
      this.appendItems(
        [
          {
            content: '',
            items: [],
          },
        ],
        this.listWrapper,
      );
    }

    return this.listWrapper;
  }

  /**
   * Renders children list
   *
   * @param list - initialized ListRenderer instance
   * @param {ListItem[]} items - items data to append
   * @param {Element} parentItem - where to append
   * @returns {void}
   */
  appendItems(items: ListItem[], parentItem: Element): void {
    if (this.list !== undefined) {
      items.forEach((item) => {
        const itemEl = this.list?.renderItem(item.content);

        parentItem.appendChild(itemEl!);

        if (item.items.length) {
          const sublistWrapper = this.list?.renderSublistWrapper()
          this.appendItems(item.items, sublistWrapper!);

          parentItem.appendChild(sublistWrapper!);
        }
      });
    }
  }

  save(): ListData {
    /**
     * The method for recursive collecting of the child items
     *
     * @param {Element} parent - where to find items
     * @returns {ListItem[]}
     */
    const getItems = (parent: Element): ListItem[] => {
      const children = Array.from(
        parent.querySelectorAll(`:scope > .cdx-nested-list__item`)
      );

      return children.map((el) => {
        const subItemsWrapper = el.querySelector(`.cdx-nested-list__item-children`);
        const content = this.list!.getItemContent(el);
        const subItems = subItemsWrapper ? getItems(subItemsWrapper) : [];

        return {
          content,
          items: subItems,
        };
      });
    };

    return {
      style: this.data.style,
      items: this.listWrapper ? getItems(this.listWrapper) : [],
    };
  }
}
