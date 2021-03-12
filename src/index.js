import * as Dom from './utils/dom';

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

    const initialData = {
      style: 'ordered',
      items: [],
    };

    this.data = data || initialData;
  }

  /**
   * Returns list tag with items
   *
   * @returns {Element}
   * @public
   */
  render() {
    this.nodes.wrapper = this.makeMainTag(this.data.style);



    // fill with data
    if (this.data.items.length) {
      this.renderItems(this.data.items);
    } else {
      this.nodes.wrapper.appendChild(Dom.make('li', this.CSS.item));
    }

    if (!this.readOnly) {
      // detect keydown on the last item to escape List
      this.nodes.wrapper.addEventListener('keydown', (event) => {
        const [ENTER, BACKSPACE, TAB] = [13, 8, 9]; // key codes

        switch (event.keyCode) {
          case ENTER:
            this.getOutOfList(event);
            break;
          case BACKSPACE:
            this.backspace(event);
            break;
          case TAB:
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
   */
  renderItems(items, parentItem) {
    items.forEach((item) => {
      this.renderItem(item, parentItem);
    });
  };

  /**
   * Renders the single item
   */
  renderItem(item, parentItem = this.nodes.wrapper){
    const itemWrapper = Dom.make('DIV', this.CSS.item, {
      innerHTML: item.content,
      contentEditable: !this.readOnly,
    })

    if (item.items && item.items.length > 0) {
      const sublistWrapper = Dom.make('DIV', this.CSS.wrapper)

      this.renderItems(item.items, sublistWrapper);

      itemWrapper.appendChild(sublistWrapper);
    }

    parentItem.appendChild(itemWrapper);
  }

  /**
   * @returns {ListData}
   * @public
   */
  save() {
    return this.data;
  }

  /**
   * Creates main <ul> or <ol> tag depended on style
   *
   * @param {string} style - 'ordered' or 'unordered'
   * @returns {HTMLOListElement|HTMLUListElement}
   */
  makeMainTag(style){
    return Dom.make('DIV', [this.CSS.baseBlock, this.CSS.wrapper], {
      contentEditable: !this.readOnly,
    });
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
   * Get out from List Tool
   * by Enter on the empty last item
   *
   * @param {KeyboardEvent} event
   */
  getOutOfList(event) {
    const items = this.currentItem.parentNode.querySelectorAll('.' + this.CSS.item);

    /**
     * Save the last one.
     */
    if (items.length < 2) {
      return;
    }

    const lastItem = items[items.length - 1];
    const currentItem = this.currentItem;

    const isNestedList = currentItem.parentElement !== this.nodes.wrapper;

    if (isNestedList && !currentItem.textContent.trim().length && currentItem === lastItem) {
      this.shiftTab(event);
      return;
    }

    /** Prevent Default li generation if item is empty */
    if (currentItem === lastItem && !lastItem.textContent.trim().length) {
      /** Insert New Block and set caret */
      currentItem.parentElement.removeChild(currentItem);
      this.api.blocks.insert();
      this.api.caret.setToBlock(this.api.blocks.getCurrentBlockIndex());
      event.preventDefault();
      event.stopPropagation();
    }
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

  addTab(event){
    event.preventDefault();
    event.stopPropagation();

    if (this.currentItem === this.currentItem.parentNode.childNodes[0]) return;

    const prevItemLastChild = this.currentItem.previousSibling.lastChild;
    const item = Dom.make('DIV', this.CSS.item, {
      contentEditable: true,
    });

    item.innerHTML = this.currentItem.innerHTML;

    if (prevItemLastChild.classList && prevItemLastChild.classList.contains(this.CSS.wrapper)) {
      prevItemLastChild.appendChild(item)
    } else {
      const sublist = Dom.make('DIV', this.CSS.wrapper);

      this.currentItem.previousSibling.appendChild(sublist);

      sublist.appendChild(item);
    }

    this.currentItem.parentNode.removeChild(this.currentItem);

    Dom.focus(item);
  }

  shiftTab(event){
    event.preventDefault();
    event.stopPropagation();

    if (this.currentItem.parentNode === this.nodes.wrapper) return;

    const item = Dom.make('DIV', this.CSS.item, {
      contentEditable: true,
    });

    item.innerHTML = this.currentItem.innerHTML;

    this.currentItem.parentNode.parentNode.after(item);
    this.currentItem.parentNode.removeChild(this.currentItem);

    if (!this.currentItem.parentNode.childElementCount) {
      this.currentItem.parentNode.parentNode.removeChild(this.currentItem.parentNode);
    }

    Dom.focus(item);
  }
}
