import * as Dom from './utils/dom';
import Caret from './utils/caret';

/**
 * Build styles
 */
import './../styles/index.pcss';


/**
 * @typedef {Object} BlockToolData
 */

/**
 * @typedef {Object} ListData
 * @property {string} style - list type 'ordered' or 'unordered'
 * @property {ListItem[]} items
 */

/**
 * @typedef {Object} ListItem
 * @property {string} content
 * @property {ListItem[]} items
 */

/**
 * NestedList Tool for EditorJS
 */
export default class NestedList {

  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Allow to use native Enter behaviour
   *
   * @returns {boolean}
   * @public
   */
  static get enableLineBreaks() {
    return true;
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: '<svg width="17" height="13" viewBox="0 0 17 13" xmlns="http://www.w3.org/2000/svg"> <path d="M5.625 4.85h9.25a1.125 1.125 0 0 1 0 2.25h-9.25a1.125 1.125 0 0 1 0-2.25zm0-4.85h9.25a1.125 1.125 0 0 1 0 2.25h-9.25a1.125 1.125 0 0 1 0-2.25zm0 9.85h9.25a1.125 1.125 0 0 1 0 2.25h-9.25a1.125 1.125 0 0 1 0-2.25zm-4.5-5a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25zm0-4.85a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25zm0 9.85a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25z"/></svg>',
      title: 'List',
    };
  }

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {object} params - tool constructor options
   * @param {ListData} params.data - previously saved data
   * @param {object} params.config - user config for Tool
   * @param {object} params.api - Editor.js API
   * @param {boolean} params.readOnly - read-only mode flag
   */
  constructor({ data, config, api, readOnly }) {
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
     * This list-style will be used by default
     */
    this.defaultListStyle = 'ordered';

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
  render() {
    this.nodes.wrapper = this.makeListWrapper(this.data.style, [ this.CSS.baseBlock ]);

    // fill with data
    if (this.data.items.length) {
      this.appendItems(this.data.items, this.nodes.wrapper);
    } else {
      this.appendItems([{
        content: '',
      }], this.nodes.wrapper);
    }

    if (!this.readOnly) {
      // detect keydown on the last item to escape List
      this.nodes.wrapper.addEventListener('keydown', (event) => {
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
      }, false);
    }

    return this.nodes.wrapper;
  }

  /**
   * Renders children list
   *
   * @param {ListItem[]} items - items data to append
   * @param {Element} parentItem - where to append
   * @returns {void}
   */
  appendItems(items, parentItem) {
    items.forEach((item) => {
      const itemEl = this.createItem(item.content, item.items);

      parentItem.appendChild(itemEl);
    });
  };

  /**
   * Renders the single item
   *
   * @param {string} content - item content to render
   * @param {ListItem[]} [items] - children
   * @returns {Element}
   */
  createItem(content, items = []) {
    const itemWrapper = Dom.make('li', this.CSS.item);
    const itemBody = Dom.make('div', this.CSS.itemBody);
    const itemContent = Dom.make('div', this.CSS.itemContent, {
      innerHTML: content,
      contentEditable: true,
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
   * @returns {ListData}
   * @public
   */
  save() {
    return this.data;
  }

  /**
   * Append children list to passed item
   *
   * @param {Element} parentItem - item that should contain passed sub-items
   * @param {ListItem[]} items - sub items to append
   */
  addChildrenList(parentItem, items) {
    const itemBody = parentItem.querySelector(`.${this.CSS.itemBody}`);
    const sublistWrapper = this.makeListWrapper(undefined, [ this.CSS.itemChildren ]);

    this.appendItems(items, sublistWrapper);

    itemBody.appendChild(sublistWrapper);
  }

  /**
   * Creates main <ul> or <ol> tag depended on style
   *
   * @param {string} [style] - 'ordered' or 'unordered'
   * @param {string[]} [classes] - additional classes to append
   * @returns {HTMLOListElement|HTMLUListElement}
   */
  makeListWrapper(style = this.defaultListStyle, classes = []) {
    const tag = style === 'ordered' ? 'ol' : 'ul';

    return Dom.make(tag, [this.CSS.wrapper, ...classes]);
  }

  /**
   * Toggles List style
   *
   * @param {string} style - 'ordered'|'unordered'
   */
  // toggleTune(style) {
  //   this.data = this.data;
  //   this.data.style = style;
  //
  //   this.nodes.wrapper.replaceWith(this.render());
  // }

  /**
   * Styles
   *
   * @private
   */
  get CSS() {
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

  // /**
  //  * List data setter
  //  *
  //  * @param {ListData} listData
  //  */
  // set data(listData) {
  //   if (!listData) {
  //     listData = {};
  //   }
  //
  //   this.data.style = listData.style || 'ordered'
  //   this.data.items = listData.items || [];
  //
  //   const oldView = this.nodes.wrapper;
  //
  //   if (oldView) {
  //     oldView.parentNode.replaceChild(this.render(), oldView);
  //   }
  // }
  //
  // /**
  //  * Return List data
  //  *
  //  * @returns {ListData}
  //  */
  // get data() {
  //   this.data.items = [];
  //
  //   const itemSelector = `${this.CSS.item}`;
  //
  //   const serialize = (parent) => {
  //     const serialized = [];
  //     const children = [].slice.call(parent.children);
  //
  //     for (let i = 0; i < children.length; i++) {
  //       let items = [];
  //
  //       const nestedList = children[i].querySelectorAll('.' + this.CSS.wrapper);
  //
  //       if (nestedList.length > 0) {
  //         items = serialize(nestedList[0]);
  //       }
  //
  //       serialized.push({
  //         content: children[i].innerHTML,
  //         items: items
  //       });
  //     }
  //
  //     return serialized;
  //   }
  //
  //   this.data.items = serialize(this.nodes.wrapper);
  //
  //   return this.data;
  // }

  /**
   * Returns current List item by the caret position
   *
   * @returns {Element}
   */
  get currentItem() {
    let currentNode = window.getSelection().anchorNode;

    if (currentNode.nodeType !== Node.ELEMENT_NODE) {
      currentNode = currentNode.parentNode;
    }

    return currentNode.closest(`.${this.CSS.item}`);
  }

  /**
   * Handles Enter keypress
   *
   * @param {KeyboardEvent} event - keydown
   * @returns {void}
   */
  enterPressed(event) {
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
     * On Enter in the last empty item, get out of list
     */
    const isEmpty = this.getItemContent(currentItem).trim().length === 0;
    const isLastItem = currentItem.parentNode === this.nodes.wrapper && currentItem.nextElementSibling === null;

    if (isLastItem && isEmpty) {
      this.getOutOfList();

      return;
    }

    /**
     * On other Enters, get content from caret till the end of the block
     * And move it to the new item
     */
    const endingFragment = Caret.extractFragmentFromCaretPositionTillTheEnd();
    const endingHTML = Dom.fragmentToString(endingFragment);
    const itemChildren = currentItem.querySelector(`.${this.CSS.itemChildren}`);

    /**
     * Create the new list item
     */
    const itemEl = this.createItem(endingHTML, undefined);

    /**
     * If item has children, prepend to them
     * Otherwise, insert the new item after current
     */
    if (itemChildren) {
      itemChildren.prepend(itemEl);
    } else {
      currentItem.after(itemEl);
    }

    this.focusItem(itemEl);
  }

  /**
   * Return the item content
   *
   * @param {Element} item - item wrapper (<li>)
   * @returns {string}
   */
  getItemContent(item) {
    const contentNode = item.querySelector(`.${this.CSS.itemContent}`);

    return contentNode.innerHTML;
  }

  /**
   * Sets focus to the item's content
   *
   * @param {Element} item - item (<li>) to select
   * @param {boolean} atStart - where to set focus: at the start or at the end
   * @returns {void}
   */
  focusItem(item, atStart = true) {
    const itemContent = item.querySelector(`.${this.CSS.itemContent}`);

    Caret.focus(itemContent, atStart);
  }

  /**
   * Get out from List Tool by Enter on the empty last item
   *
   * @returns {void}
   */
  getOutOfList() {
    this.currentItem.remove();

    this.api.blocks.insert();
    this.api.caret.setToBlock(this.api.blocks.getCurrentBlockIndex());
  }

  /**
   * Handle backspace
   *
   * @param {KeyboardEvent} event
   */
  backspace(event) {
    const items = this.nodes.wrapper.querySelectorAll('.' + this.CSS.item),
        firstItem = items[0];

    if (!firstItem) {
      return;
    }

    /**
     * Save the last one.
     */
    if (items.length < 2 && !firstItem.innerHTML.replace('<br>', ' ').trim()) {
      event.preventDefault();
    }
  }

  /**
   * Add indentation to current item
   *
   * @param {KeyboardEvent} event - keydown
   */
  addTab(event) {
    /**
     * Prevent editor.js behaviour
     */
    event.stopPropagation();

    /**
     * Prevent browser tab behaviour
     */
    event.preventDefault();

    const currentItem = this.currentItem;
    const prevItem = currentItem.previousSibling;
    const isFirstChild = !prevItem;

    /**
     * In the first item we should not handle Tabs (because there is no parent item above)
     */
    if (isFirstChild) {
      return;
    }

    const prevItemChildrenList = prevItem.querySelector(`.${this.CSS.itemChildren}`);

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
      const sublistWrapper = this.makeListWrapper(undefined, [ this.CSS.itemChildren ]);
      const prevItemBody = prevItem.querySelector(`.${this.CSS.itemBody}`);

      sublistWrapper.appendChild(currentItem);
      prevItemBody.appendChild(sublistWrapper);
    }

    this.caret.restore();
  }

  /**
   * Reduce indentation for current item
   *
   * @param {KeyboardEvent} event - keydown
   * @returns {void}
   */
  shiftTab(event) {
    /**
     * Prevent editor.js behaviour
     */
    event.stopPropagation();

    /**
     * Prevent browser tab behaviour
     */
    event.preventDefault();

    const currentItem = this.currentItem;
    const parentItem = currentItem.parentNode.closest(`.${this.CSS.item}`);

    /**
     * If item in the first-level list then no need to do anything
     */
    if (!parentItem) {
      return;
    }

    this.caret.save();

    /**
     * Move item from current list to parent list
     */
    parentItem.after(currentItem);

    this.caret.restore();
  }
}
