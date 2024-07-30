import type { API, PasteConfig, ToolboxConfig } from '@editorjs/editorjs';
import type { PasteEvent } from './types';
import type {
  BlockToolConstructorOptions,
  TunesMenuConfig,
} from '@editorjs/editorjs/types/tools';

import { isHtmlElement } from './utils/type-guards';

import * as Dom from './utils/dom';
import Caret from './utils/caret';
import { IconListBulleted, IconListNumbered } from '@codexteam/icons';

/**
 * Build styles
 */
import './../styles/index.pcss';

/**
 * list style to make list as ordered or unordered
 */
type ListDataStyle = 'ordered' | 'unordered';

/**
 * Output data
 */
interface ListData {
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
interface ListItem {
  /**
   * list item text content
   */
  content: string;
  /**
   * sublist items
   */
  items: ListItem[];
}

/**
 * Tool's configuration
 */
interface NestedListConfig {
  /**
   * default list style: ordered or unordered
   * default is unordered
   */
  defaultStyle?: ListDataStyle;
}

/**
 * Constructor Params for Nested List Tool, use to pass initial data and settings
 */
export type NestedListParams = BlockToolConstructorOptions<
  ListData,
  NestedListConfig
>;

/**
 * CSS classes for the Nested List Tool
 */
interface NestedListCssClasses {
  baseBlock: string;
  wrapper: string;
  wrapperOrdered: string;
  wrapperUnordered: string;
  item: string;
  itemBody: string;
  itemContent: string;
  itemChildren: string;
  settingsWrapper: string;
  settingsButton: string;
  settingsButtonActive: string;
}

/**
 * NestedList Tool for EditorJS
 */
export default class NestedList {
  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported(): boolean {
    return true;
  }

  /**
   * Allow to use native Enter behaviour
   *
   * @returns {boolean}
   * @public
   */
  static get enableLineBreaks(): boolean {
    return true;
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {ToolboxConfig}
   */
  static get toolbox(): ToolboxConfig {
    return {
      icon: IconListNumbered,
      title: 'List',
    };
  }

  /**
   * The Editor.js API
   */
  private api: API;

  /**
   * Is NestedList Tool read-only
   */
  private readOnly: boolean;

  /**
   * Tool's configuration
   */
  private config?: NestedListConfig;

  /**
   * Default list style
   */
  private defaultListStyle?: NestedListConfig['defaultStyle'];

  /**
   * Corresponds to UiNodes type from Editor.js but with wrapper being nullable
   */
  private nodes: { wrapper: HTMLElement | null };

  /**
   * Tool's data
   */
  private data: ListData;

  /**
   * Caret helper
   */
  private caret: Caret;

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {object} params - tool constructor options
   * @param {ListData} params.data - previously saved data
   * @param {object} params.config - user config for Tool
   * @param {object} params.api - Editor.js API
   * @param {boolean} params.readOnly - read-only mode flag
   */
  constructor({ data, config, api, readOnly }: NestedListParams) {
    /**
     * HTML nodes used in tool
     */
    this.nodes = {
      wrapper: null,
    };

    this.api = api;
    this.readOnly = readOnly;
    this.config = config;

    /**
     * Set the default list style from the config.
     */
    this.defaultListStyle =
      this.config?.defaultStyle === 'ordered' ? 'ordered' : 'unordered';

    const initialData = {
      style: this.defaultListStyle,
      items: [],
    };
    this.data = data && Object.keys(data).length ? data : initialData;

    /**
     * Instantiate caret helper
     */
    this.caret = new Caret();
  }

  /**
   * Returns list tag with items
   *
   * @returns {Element}
   * @public
   */
  render(): Element {
    this.nodes.wrapper = this.makeListWrapper(this.data.style, [
      this.CSS.baseBlock,
    ]);

    // fill with data
    if (this.data.items.length) {
      this.appendItems(this.data.items, this.nodes.wrapper);
    } else {
      this.appendItems(
        [
          {
            content: '',
            items: [],
          },
        ],
        this.nodes.wrapper
      );
    }

    if (!this.readOnly) {
      // detect keydown on the last item to escape List
      this.nodes.wrapper.addEventListener(
        'keydown',
        (event) => {
          switch (event.key) {
            case 'Enter':
              this.enterPressed(event);
              break;
            case 'Backspace':
              this.backspace(event);
              break;
            case 'Tab':
              if (event.shiftKey) {
                this.shiftTab(event);
              } else {
                this.addTab(event);
              }
              break;
          }
        },
        false
      );
    }

    return this.nodes.wrapper;
  }

  /**
   * Creates Block Tune allowing to change the list style
   *
   * @public
   * @returns {Array}
   */
  renderSettings(): TunesMenuConfig {
    const tunes = [
      {
        name: 'unordered' as const,
        label: this.api.i18n.t('Unordered'),
        icon: IconListBulleted,
      },
      {
        name: 'ordered' as const,
        label: this.api.i18n.t('Ordered'),
        icon: IconListNumbered,
      },
    ];

    return tunes.map((tune) => ({
      name: tune.name,
      icon: tune.icon,
      label: tune.label,
      isActive: this.data.style === tune.name,
      closeOnActivate: true,
      onActivate: () => {
        this.listStyle = tune.name;
      },
    }));
  }

  /**
   * On paste sanitzation config. Allow only tags that are allowed in the Tool.
   *
   * @returns {PasteConfig} - paste config.
   */
  static get pasteConfig(): PasteConfig {
    return {
      tags: ['OL', 'UL', 'LI'],
    };
  }

  /**
   * On paste callback that is fired from Editor.
   *
   * @param {PasteEvent} event - event with pasted data
   */
  onPaste(event: PasteEvent): void {
    const list = event.detail.data;

    this.data = this.pasteHandler(list);

    // render new list
    const oldView = this.nodes.wrapper;

    if (oldView && oldView.parentNode) {
      oldView.parentNode.replaceChild(this.render(), oldView);
    }
  }

  /**
   * Handle UL, OL and LI tags paste and returns List data
   *
   * @param {HTMLUListElement|HTMLOListElement|HTMLLIElement} element
   * @returns {ListData}
   */
  pasteHandler(element: PasteEvent['detail']['data']): ListData {
    const { tagName: tag } = element;
    let style: ListDataStyle = 'unordered';
    let tagToSearch: string;

    // set list style and tag to search.
    switch (tag) {
      case 'OL':
        style = 'ordered';
        tagToSearch = 'ol';
        break;
      case 'UL':
      case 'LI':
        style = 'unordered';
        tagToSearch = 'ul';
    }

    const data: ListData = {
      style,
      items: [],
    };

    // get pasted items from the html.
    const getPastedItems = (parent: Element): ListItem[] => {
      // get first level li elements.
      const children = Array.from(parent.querySelectorAll(`:scope > li`));

      return children.map((child) => {
        // get subitems if they exist.
        const subItemsWrapper = child.querySelector(`:scope > ${tagToSearch}`);
        // get subitems.
        const subItems = subItemsWrapper ? getPastedItems(subItemsWrapper) : [];
        // get text content of the li element.
        const content = child?.firstChild?.textContent || '';

        return {
          content,
          items: subItems,
        };
      });
    };

    // get pasted items.
    data.items = getPastedItems(element);

    return data;
  }

  /**
   * Renders children list
   *
   * @param {ListItem[]} items - items data to append
   * @param {Element} parentItem - where to append
   * @returns {void}
   */
  appendItems(items: ListItem[], parentItem: Element): void {
    items.forEach((item) => {
      const itemEl = this.createItem(item.content, item.items);

      parentItem.appendChild(itemEl);
    });
  }

  /**
   * Renders the single item
   *
   * @param {string} content - item content to render
   * @param {ListItem[]} [items] - children
   * @returns {Element}
   */
  createItem(content: string, items: ListItem[] = []): Element {
    const itemWrapper = Dom.make('li', this.CSS.item);
    const itemBody = Dom.make('div', this.CSS.itemBody);
    const itemContent = Dom.make('div', this.CSS.itemContent, {
      innerHTML: content,
      contentEditable: (!this.readOnly).toString(),
    });

    itemBody.appendChild(itemContent);
    itemWrapper.appendChild(itemBody);

    /**
     * Append children if we have some
     */
    if (items && items.length > 0) {
      this.addChildrenList(itemWrapper, items);
    }

    return itemWrapper;
  }

  /**
   * Extracts tool's data from the DOM
   *
   * @returns {ListData}
   */
  save(): ListData {
    /**
     * The method for recursive collecting of the child items
     *
     * @param {Element} parent - where to find items
     * @returns {ListItem[]}
     */
    const getItems = (parent: Element): ListItem[] => {
      const children = Array.from(
        parent.querySelectorAll(`:scope > .${this.CSS.item}`)
      );

      return children.map((el) => {
        const subItemsWrapper = el.querySelector(`.${this.CSS.itemChildren}`);
        const content = this.getItemContent(el);
        const subItems = subItemsWrapper ? getItems(subItemsWrapper) : [];

        return {
          content,
          items: subItems,
        };
      });
    };

    return {
      style: this.data.style,
      items: this.nodes.wrapper ? getItems(this.nodes.wrapper) : [],
    };
  }

  /**
   * Append children list to passed item
   *
   * @param {Element} parentItem - item that should contain passed sub-items
   * @param {ListItem[]} items - sub items to append
   */
  addChildrenList(parentItem: Element, items: ListItem[]): void {
    const itemBody = parentItem.querySelector(`.${this.CSS.itemBody}`);
    const sublistWrapper = this.makeListWrapper(undefined, [
      this.CSS.itemChildren,
    ]);

    this.appendItems(items, sublistWrapper);

    if (!itemBody) {
      return;
    }

    itemBody.appendChild(sublistWrapper);
  }

  /**
   * Creates main <ul> or <ol> tag depended on style
   *
   * @param {string} [style] - 'ordered' or 'unordered'
   * @param {string[]} [classes] - additional classes to append
   * @returns {HTMLOListElement|HTMLUListElement}
   */
  makeListWrapper(
    style: string = this.listStyle,
    classes: string[] = []
  ): HTMLOListElement | HTMLUListElement {
    const tag = style === 'ordered' ? 'ol' : 'ul';
    const styleClass =
      style === 'ordered' ? this.CSS.wrapperOrdered : this.CSS.wrapperUnordered;

    classes.push(styleClass);

    // since tag is either 'ol' or 'ul' we can safely cast it to HTMLOListElement | HTMLUListElement
    return Dom.make(tag, [this.CSS.wrapper, ...classes]) as
      | HTMLOListElement
      | HTMLUListElement;
  }

  /**
   * Styles
   *
   * @returns {NestedListCssClasses} - CSS classes names by keys
   * @private
   */
  get CSS(): NestedListCssClasses {
    return {
      baseBlock: this.api.styles.block,
      wrapper: 'cdx-nested-list',
      wrapperOrdered: 'cdx-nested-list--ordered',
      wrapperUnordered: 'cdx-nested-list--unordered',
      item: 'cdx-nested-list__item',
      itemBody: 'cdx-nested-list__item-body',
      itemContent: 'cdx-nested-list__item-content',
      itemChildren: 'cdx-nested-list__item-children',
      settingsWrapper: 'cdx-nested-list__settings',
      settingsButton: this.api.styles.settingsButton,
      settingsButtonActive: this.api.styles.settingsButtonActive,
    };
  }

  /**
   * Get list style name
   *
   * @returns {string}
   */
  get listStyle(): string {
    return this.data.style || this.defaultListStyle;
  }

  /**
   * Set list style
   *
   * @param {ListDataStyle} style - new style to set
   */
  set listStyle(style: ListDataStyle) {
    if (!this.nodes) {
      return;
    }
    if (!this.nodes.wrapper) {
      return;
    }
    /**
     * Get lists elements
     *
     * @type {Element[]}
     */
    const lists: Element[] = Array.from(
      this.nodes.wrapper.querySelectorAll(`.${this.CSS.wrapper}`)
    );

    /**
     * Add main wrapper to the list
     */
    lists.push(this.nodes.wrapper);

    /**
     * For each list we need to update classes
     */
    lists.forEach((list) => {
      list.classList.toggle(this.CSS.wrapperUnordered, style === 'unordered');
      list.classList.toggle(this.CSS.wrapperOrdered, style === 'ordered');
    });

    /**
     * Update the style in data
     *
     * @type {ListDataStyle}
     */
    this.data.style = style;
  }

  /**
   * Returns current List item by the caret position
   *
   * @returns {Element}
   */
  get currentItem(): Element | null {
    const selection = window.getSelection();

    if (!selection) {
      return null;
    }
    let currentNode = selection.anchorNode;

    if (!currentNode) {
      return null;
    }

    if (!isHtmlElement(currentNode)) {
      currentNode = currentNode.parentNode;
    }
    if (!currentNode) {
      return null;
    }
    if (!isHtmlElement(currentNode)) {
      return null;
    }

    return currentNode.closest(`.${this.CSS.item}`);
  }

  /**
   * Handles Enter keypress
   *
   * @param {KeyboardEvent} event - keydown
   * @returns {void}
   */
  enterPressed(event: KeyboardEvent): void {
    const currentItem = this.currentItem;

    /**
     * Prevent editor.js behaviour
     */
    event.stopPropagation();

    /**
     * Prevent browser behaviour
     */
    event.preventDefault();

    /**
     * Prevent duplicated event in Chinese, Japanese and Korean languages
     */
    if (event.isComposing) {
      return;
    }

    /**
     * On Enter in the last empty item, get out of list
     */
    const isEmpty = currentItem
      ? this.getItemContent(currentItem).trim().length === 0
      : true;
    const isFirstLevelItem = currentItem?.parentNode === this.nodes.wrapper;
    const isLastItem = currentItem?.nextElementSibling === null;

    if (isFirstLevelItem && isLastItem && isEmpty) {
      this.getOutOfList();

      return;
    } else if (isLastItem && isEmpty) {
      this.unshiftItem();

      return;
    }

    /**
     * On other Enters, get content from caret till the end of the block
     * And move it to the new item
     */
    const endingFragment = Caret.extractFragmentFromCaretPositionTillTheEnd();
    if (!endingFragment) {
      return;
    }
    const endingHTML = Dom.fragmentToString(endingFragment);
    const itemChildren = currentItem?.querySelector(
      `.${this.CSS.itemChildren}`
    );

    /**
     * Create the new list item
     */
    const itemEl = this.createItem(endingHTML, undefined);

    /**
     * Check if child items exist
     *
     * @type {boolean}
     */
    const childrenExist =
      itemChildren &&
      Array.from(itemChildren.querySelectorAll(`.${this.CSS.item}`)).length > 0;

    /**
     * If item has children, prepend to them
     * Otherwise, insert the new item after current
     */
    if (childrenExist) {
      itemChildren.prepend(itemEl);
    } else {
      currentItem?.after(itemEl);
    }

    this.focusItem(itemEl);
  }

  /**
   * Decrease indentation of the current item
   *
   * @returns {void}
   */
  unshiftItem(): void {
    const currentItem = this.currentItem;
    if (!currentItem) {
      return;
    }
    if (!currentItem.parentNode) {
      return;
    }
    if (!isHtmlElement(currentItem.parentNode)) {
      return;
    }

    const parentItem = currentItem.parentNode.closest(`.${this.CSS.item}`);

    /**
     * If item in the first-level list then no need to do anything
     */
    if (!parentItem) {
      return;
    }

    this.caret.save();

    parentItem.after(currentItem);

    this.caret.restore();

    /**
     * If previous parent's children list is now empty, remove it.
     */
    const prevParentChildrenList = parentItem.querySelector(
      `.${this.CSS.itemChildren}`
    );
    if (!prevParentChildrenList) {
      return;
    }
    const isPrevParentChildrenEmpty =
      prevParentChildrenList.children.length === 0;

    if (isPrevParentChildrenEmpty) {
      prevParentChildrenList.remove();
    }
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

  /**
   * Sets focus to the item's content
   *
   * @param {Element} item - item (<li>) to select
   * @param {boolean} atStart - where to set focus: at the start or at the end
   * @returns {void}
   */
  focusItem(item: Element, atStart: boolean = true): void {
    const itemContent = item.querySelector<HTMLElement>(
      `.${this.CSS.itemContent}`
    );
    if (!itemContent) {
      return;
    }

    Caret.focus(itemContent, atStart);
  }

  /**
   * Get out from List Tool by Enter on the empty last item
   *
   * @returns {void}
   */
  getOutOfList(): void {
    this.currentItem?.remove();

    this.api.blocks.insert();
    this.api.caret.setToBlock(this.api.blocks.getCurrentBlockIndex());
  }

  /**
   * Handle backspace
   *
   * @param {KeyboardEvent} event - keydown
   */
  backspace(event: KeyboardEvent): void {
    /**
     * Caret is not at start of the item
     * Then backspace button should remove letter as usual
     */
    if (!Caret.isAtStart()) {
      return;
    }

    /**
     * Prevent default backspace behaviour
     */
    event.preventDefault();

    const currentItem = this.currentItem;
    if (!currentItem) {
      return;
    }
    const previousItem = currentItem.previousSibling;
    if (!currentItem.parentNode) {
      return;
    }
    if (!isHtmlElement(currentItem.parentNode)) {
      return;
    }
    const parentItem = currentItem.parentNode.closest(`.${this.CSS.item}`);

    /**
     * Do nothing with the first item in the first-level list.
     * No previous sibling means that this is the first item in the list.
     * No parent item means that this is a first-level list.
     *
     * Before:
     * 1. |Hello
     * 2. World!
     *
     * After:
     * 1. |Hello
     * 2. World!
     *
     * If it this item and the while list is empty then editor.js should
     * process this behaviour and remove the block completely
     *
     * Before:
     * 1. |
     *
     * After: block has been removed
     *
     */
    if (!previousItem && !parentItem) {
      return;
    }

    // make sure previousItem is an HTMLElement
    if (previousItem && !isHtmlElement(previousItem)) {
      return;
    }

    /**
     * Prevent editor.js behaviour
     */
    event.stopPropagation();

    /**
     * Lets compute the item which will be merged with current item text
     */
    let targetItem: Element | null;

    /**
     * If there is a previous item then we get a deepest item in its sublists
     *
     * Otherwise we will use the parent item
     */
    if (previousItem) {
      const childrenOfPreviousItem = previousItem.querySelectorAll(
        `.${this.CSS.item}`
      );

      targetItem = Array.from(childrenOfPreviousItem).pop() || previousItem;
    } else {
      targetItem = parentItem;
    }

    /**
     * Get content from caret till the end of the block to move it to the new item
     */
    const endingFragment = Caret.extractFragmentFromCaretPositionTillTheEnd();
    if (!endingFragment) {
      return;
    }
    const endingHTML = Dom.fragmentToString(endingFragment);

    /**
     * Get the target item content element
     */
    if (!targetItem) {
      return;
    }
    const targetItemContent = targetItem.querySelector<HTMLElement>(
      `.${this.CSS.itemContent}`
    );

    /**
     * Set a new place for caret
     */
    if (!targetItemContent) {
      return;
    }
    Caret.focus(targetItemContent, false);

    /**
     * Save the caret position
     */
    this.caret.save();

    /**
     * Update target item content by merging with current item html content
     */
    targetItemContent.insertAdjacentHTML('beforeend', endingHTML);

    /**
     * Get the sublist first-level items for current item
     */
    let currentItemSublistItems: NodeListOf<Element> | Element[] =
      currentItem.querySelectorAll(
        `.${this.CSS.itemChildren} > .${this.CSS.item}`
      );

    /**
     * Create an array from current item sublist items
     */
    currentItemSublistItems = Array.from(currentItemSublistItems);

    /**
     * Filter items for sublist first-level
     * No need to move deeper items
     */
    currentItemSublistItems = currentItemSublistItems.filter((node) => {
      // make sure node.parentNode is an HTMLElement
      if (!node.parentNode) {
        return false;
      }
      if (!isHtmlElement(node.parentNode)) {
        return false;
      }
      return node.parentNode.closest(`.${this.CSS.item}`) === currentItem;
    });

    /**
     * Reverse the array to insert items
     */
    currentItemSublistItems.reverse().forEach((item) => {
      /**
       * Check if we need to save the indent for current item children
       *
       * If this is the first item in the list then place its children to the same level as currentItem.
       * Same as shift+tab for all of these children.
       *
       * If there is a previous sibling then place children right after target item
       */
      if (!previousItem) {
        /**
         * The first item in the list
         *
         * Before:
         * 1. Hello
         *   1.1. |My
         *     1.1.1. Wonderful
         *     1.1.2. World
         *
         * After:
         * 1. Hello|My
         *   1.1. Wonderful
         *   1.2. World
         */
        currentItem.after(item);
      } else {
        /**
         * Not the first item
         *
         * Before:
         * 1. Hello
         *   1.1. My
         *   1.2. |Dear
         *     1.2.1. Wonderful
         *     1.2.2. World
         *
         * After:
         * 1. Hello
         *   1.1. My|Dear
         *   1.2. Wonderful
         *   1.3. World
         */
        targetItem.after(item);
      }
    });

    /**
     * Remove current item element
     */
    currentItem.remove();

    /**
     * Restore the caret position
     */
    this.caret.restore();
  }

  /**
   * Add indentation to current item
   *
   * @param {KeyboardEvent} event - keydown
   */
  addTab(event: KeyboardEvent): void {
    /**
     * Prevent editor.js behaviour
     */
    event.stopPropagation();

    /**
     * Prevent browser tab behaviour
     */
    event.preventDefault();

    const currentItem = this.currentItem;
    if (!currentItem) {
      return;
    }
    const prevItem = currentItem.previousSibling;
    if (!prevItem) {
      return;
    }
    if (!isHtmlElement(prevItem)) {
      return;
    }
    const isFirstChild = !prevItem;

    /**
     * In the first item we should not handle Tabs (because there is no parent item above)
     */
    if (isFirstChild) {
      return;
    }

    const prevItemChildrenList = prevItem.querySelector(
      `.${this.CSS.itemChildren}`
    );

    this.caret.save();

    /**
     * If prev item has child items, just append current to them
     */
    if (prevItemChildrenList) {
      prevItemChildrenList.appendChild(currentItem);
    } else {
      /**
       * If prev item has no child items
       * - Create and append children wrapper to the previous item
       * - Append current item to it
       */
      const sublistWrapper = this.makeListWrapper(undefined, [
        this.CSS.itemChildren,
      ]);
      const prevItemBody = prevItem.querySelector(`.${this.CSS.itemBody}`);

      sublistWrapper.appendChild(currentItem);
      prevItemBody?.appendChild(sublistWrapper);
    }

    this.caret.restore();
  }

  /**
   * Reduce indentation for current item
   *
   * @param {KeyboardEvent} event - keydown
   * @returns {void}
   */
  shiftTab(event: KeyboardEvent): void {
    /**
     * Prevent editor.js behaviour
     */
    event.stopPropagation();

    /**
     * Prevent browser tab behaviour
     */
    event.preventDefault();

    /**
     * Move item from current list to parent list
     */
    this.unshiftItem();
  }

  /**
   * Convert from list to text for conversionConfig
   *
   * @param {ListData} data
   * @returns {string}
   */
  static joinRecursive(data: ListData | ListItem): string {
    return data.items
      .map((item) => `${item.content} ${NestedList.joinRecursive(item)}`)
      .join('');
  }

  /**
   * Convert from text to list with import and export list to text
   */
  static get conversionConfig(): {
    export: (data: ListData) => string;
    import: (content: string) => ListData;
  } {
    return {
      export: (data) => {
        return NestedList.joinRecursive(data);
      },
      import: (content) => {
        return {
          items: [
            {
              content,
              items: [],
            },
          ],
          style: 'unordered',
        };
      },
    };
  }
}
