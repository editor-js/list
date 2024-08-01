import NestedListConfig from "./types/config";
import * as Dom from './utils/dom';

/**
 * CSS classes for the Nested List Tool
 */
interface NestedListCssClasses {
  wrapper: string;
  wrapperOrdered: string;
  wrapperUnordered: string;
  item: string;
  itemBody: string;
  itemContent: string;
  itemChildren: string;
  settingsWrapper: string;
}

/**
 * List renderer class
 * Used for storing css classes and
 */
abstract class ListRenderer {
  /**
   * Styles
   *
   * @returns {NestedListCssClasses} - CSS classes names by keys
   * @private
   */
  protected get CSS(): NestedListCssClasses {
    return {
      wrapper: 'cdx-nested-list',
      wrapperOrdered: 'cdx-nested-list--ordered',
      wrapperUnordered: 'cdx-nested-list--unordered',
      item: 'cdx-nested-list__item',
      itemBody: 'cdx-nested-list__item-body',
      itemContent: 'cdx-nested-list__item-content',
      itemChildren: 'cdx-nested-list__item-children',
      settingsWrapper: 'cdx-nested-list__settings',
    };
  }
}

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

/**
 * Class that is responsible for ordered list rendering
 */
export class OrderedListRenderer extends ListRenderer {
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

    return Dom.make('ol', [this.CSS.wrapper, ...classes]) as HTMLOListElement;
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

/**
 * Class that is responsible for checklist rendering
 */
export class CheckListRenderer extends ListRenderer {
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

    return Dom.make('ul', [this.CSS.wrapper, ...classes]) as HTMLOListElement;
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

