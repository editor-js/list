/**
 * Build styles
 */
require('./../styles/index.pcss');

import DomUtil from "./utils/dom";

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
     * HTML nodes
     *
     * @private
     */
    this._elements = {
      wrapper: null,
    };

    this.api = api;
    this.readOnly = readOnly;

    /**
     * Tool's data
     *
     * @type {ListData}
     */
    this._data = {
      style: 'ordered', //this.settings.find((tune) => tune.default === true).name,
      items: [],
    };

    this.data = data;
  }

  /**
   * Returns list tag with items
   *
   * @returns {Element}
   * @public
   */
  render() {
    this._elements.wrapper = this.makeMainTag(this._data.style);

    const renderList = (items, element) => {
      items.forEach((item) => {
        const itemWrapper = DomUtil.make('DIV', this.CSS.item, {
          innerHTML: item.content,
          contentEditable: !this.readOnly,
        })

        if (item.items && item.items.length > 0) {
          const sublistWrapper = this.makeMainTag(this._data.style);

          renderList(item.items, sublistWrapper);

          itemWrapper.appendChild(sublistWrapper);
        }

        element.appendChild(itemWrapper);
      });
    }

    // fill with data
    if (this._data.items.length) {
      renderList(this._data.items, this._elements.wrapper);
    } else {
      this._elements.wrapper.appendChild(DomUtil.make('li', this.CSS.item));
    }

    if (!this.readOnly) {
      // detect keydown on the last item to escape List
      this._elements.wrapper.addEventListener('keydown', (event) => {
        const [ENTER, BACKSPACE, TAB] = [13, 8, 9]; // key codes

        switch (event.keyCode) {
          case ENTER:
            this.getOutOfList(event);
            break;
          case BACKSPACE:
            this.backspace(event);
            break;
          case TAB:
            this.addTab(event);
            break;
        }
      }, false);
    }

    return this._elements.wrapper;
  }

  /**
   * @returns {ListData}
   * @public
   */
  save() {
    return this.data;
  }

  // /**
  //  * Sanitizer rules
  //  *
  //  * @returns {object}
  //  */
  // static get sanitize() {
  //   return {
  //     style: {},
  //     items: {
  //       br: true,
  //     },
  //   };
  // }

  /**
   * Creates main <ul> or <ol> tag depended on style
   *
   * @param {string} style - 'ordered' or 'unordered'
   * @returns {HTMLOListElement|HTMLUListElement}
   */
  makeMainTag(style){
    const styleClass = style === 'ordered' ? this.CSS.wrapperOrdered : this.CSS.wrapperUnordered;
    // const tag = style === 'ordered' ? 'ol' : 'ul';

    return DomUtil.make('DIV', [this.CSS.baseBlock, this.CSS.wrapper, styleClass], {
      contentEditable: !this.readOnly,
    });
  }

  /**
   * Toggles List style
   *
   * @param {string} style - 'ordered'|'unordered'
   */
  toggleTune(style) {
    this._data = this.data;
    this._data.style = style;

    this._elements.wrapper.replaceWith(this.render());
  }

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

  /**
   * List data setter
   *
   * @param {ListData} listData
   */
  set data(listData) {
    if (!listData) {
      listData = {};
    }

    this._data.style = listData.style || 'ordered'
    this._data.items = listData.items || [];

    const oldView = this._elements.wrapper;

    if (oldView) {
      oldView.parentNode.replaceChild(this.render(), oldView);
    }
  }

  /**
   * Return List data
   *
   * @returns {ListData}
   */
  get data() {
    this._data.items = [];

    const itemSelector = `${this.CSS.item}`;

    function serialize(parent) {
      const serialized = [];
      const children = [].slice.call(parent.children);

      for (let i = 0; i < children.length; i++) {
        if (!children[i].classList.contains(itemSelector)) continue;

        let items = [];

        try {
          const isNextNested = !children[i + 1].classList.contains(itemSelector);

          if (isNextNested) {
            items = serialize(children[i + 1]);
          }
        } catch (e) {}

        serialized.push({
          content: children[i].innerHTML,
          items: items
        });
      }

      return serialized;
    }

    this._data.items = serialize(this._elements.wrapper);

    return this._data;
  }



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
    const items = this._elements.wrapper.querySelectorAll('.' + this.CSS.item);

    /**
     * Save the last one.
     */
    if (items.length < 2) {
      return;
    }

    const lastItem = items[items.length - 1];
    const currentItem = this.currentItem;

    const isNestedList = currentItem.parentElement !== this._elements.wrapper;

    console.log('currentItem.parentElement !== this._elements.wrapper', currentItem.parentElement !== this._elements.wrapper);

    if (isNestedList && !currentItem.textContent.trim().length && currentItem !== lastItem) {
      console.info('IS IN NESTED LIST');

      // event.preventDefault();
      // event.stopPropagation();
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
    const items = this._elements.wrapper.querySelectorAll('.' + this.CSS.item),
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
    if (this.currentItem === this.currentItem.parentNode.childNodes[0]) {
      return
    }

    const style = this._data.style === 'ordered' ? this.CSS.wrapperOrdered : this.CSS.wrapperUnordered;
    let ol = DomUtil.make('DIV', [this.CSS.baseBlock, this.CSS.wrapper, style], {
      contentEditable: true,
    });

    if (this.currentItem.nextSibling != null) {
      this.currentItem.parentNode.insertBefore(ol, this.currentItem.nextSibling)
    } else {
      this.currentItem.parentNode.appendChild(ol)
    }

    ol.appendChild(this.currentItem)

    event.preventDefault();
    event.stopPropagation();
  }
}
