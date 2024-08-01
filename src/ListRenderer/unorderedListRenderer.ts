import NestedListConfig from "../types/config";
import * as Dom from '../utils/dom';

/**
 * Class that is responsible for unordered list rendering
 */
export class UnorderedListRenderer extends ListRenderer {
  /**
   * Tool's configuration
   */
  protected config?: NestedListConfig;

  constructor(config: NestedListConfig) {
    super();
    this.config = config;
  }

  /**
   * Renders ol wrapper for list
   * @param classes -
   * @returns - created html ol element
   */
  renderWrapper(classes: string[] = []): HTMLOListElement {
    classes.push(this.CSS.wrapperOrdered);

    const olElement = Dom.make('ul', [this.CSS.wrapper, ...classes]) as HTMLOListElement;

    return olElement;
  }

  /**
   * Redners list item element
   * @param content - content of the list item
   * @returns - created html list item element
   */
  renderItem(content: string): HTMLLIElement {
    const itemWrapper = Dom.make('li', this.CSS.item);
    const itemBody = Dom.make('div', this.CSS.itemBody);
    const itemContent = Dom.make('div', this.CSS.itemContent, {
      innerHTML: content,
    });

    itemBody.appendChild(itemContent);
    itemWrapper.appendChild(itemBody);

    return itemWrapper as HTMLLIElement;
  }

  /**
   * Return the item content
   *
   * @param {Element} item - item wrapper (<li>)
   * @returns {string}
   */
  getItemContent(item: Element): string {
    const contentNode = item.querySelector(`.${this.CSS.itemContent}`);
    if (!contentNode) {
      return '';
    }

    if (Dom.isEmpty(contentNode)) {
      return '';
    }

    return contentNode.innerHTML;
  }
}
