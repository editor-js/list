import { CheckListRenderer } from "../ListRenderer/ChecklistRenderer";
import { OrderedListRenderer } from "../ListRenderer/OrderedListRenderer";
import { UnorderedListRenderer } from "../ListRenderer/UnorderedListRenderer";
import { NestedListConfig, ListData, ListDataStyle } from "../types/ListParams"
import { ListItem } from "../types/ListParams";
import { isHtmlElement } from '../utils/type-guards';
import Caret from '../utils/Caret';
import { DefaultListCssClasses } from "../ListRenderer";
import * as Dom from '../utils/Dom'
import type { PasteEvent } from '../types';
import type { API, PasteConfig } from '@editorjs/editorjs';
import { ListParams } from "..";
import { ChecklistItemMeta, OrderedListItemMeta, UnorderedListItemMeta } from "../types/ItemMeta";

type ListRendererTypes = OrderedListRenderer | UnorderedListRenderer | CheckListRenderer;

/**
 * Class that is responsible for list tabulation
 */
export default class ListTabulator {
  /**
   * The Editor.js API
   */
  private api: API;

  /**
   * Caret helper
   */
  private caret: Caret;

  /**
   * Is NestedList Tool read-only option
   */
  private readOnly: boolean;

  /**
   * Tool's configuration
   */
  private config?: NestedListConfig;

  /**
   * Full content of the list
   */
  private data: ListData;

  /**
   * Current level of nesting for dynamyc updates
   */
  private currentLevel: number;

  /**
   * Style of the nested list
   */
  style: ListDataStyle;

  /**
   * Rendered list of items
   */
  list: ListRendererTypes | undefined;

  /**
   * Wrapper of the whole list
   */
  listWrapper: HTMLElement | undefined;

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

    return currentNode.closest(`.${DefaultListCssClasses.item}`);
  }

  constructor({data, config, api, readOnly}: ListParams, style: ListDataStyle) {
    this.config = config;
    this.data = data;
    this.style = style;
    this.readOnly = readOnly;
    this.api = api;
    this.currentLevel = 0;

    /**
     * Instantiate caret helper
     */
    this.caret = new Caret();
  }

  /**
   * Function that is responsible for rendering nested list with contents
   * @returns Filled with content wrapper element of the list
   */
  render() {
    switch (this.style) {
      case 'ordered':
        this.list = new OrderedListRenderer(this.readOnly, this.config);
        break
      case 'unordered':
        this.list = new UnorderedListRenderer(this.readOnly, this.config);
        break
      case 'checklist':
        this.list = new CheckListRenderer(this.readOnly, this.config);
        break
    }

    this.listWrapper = this.list.renderWrapper(this.currentLevel);

    // fill with data
    if (this.data.items.length) {
      this.appendItems(this.data.items, this.listWrapper);
    } else {
      this.appendItems(
        [
          {
            content: '',
            meta: {},
            items: [],
          },
        ],
        this.listWrapper,
      );
    }

    if (!this.readOnly) {
      // detect keydown on the last item to escape List
      this.listWrapper.addEventListener(
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
    /**
     * Update current nesting level
     */
    this.currentLevel += 1;

    if (this.list !== undefined) {
      items.forEach((item) => {
        let itemEl: Element;

        if (this.list instanceof OrderedListRenderer) {
          itemEl = this.list!.renderItem(item.content, item.meta as OrderedListItemMeta);
        }
        else if (this.list instanceof UnorderedListRenderer) {
          itemEl = this.list!.renderItem(item.content, item.meta as UnorderedListItemMeta);
        }
        else {
          itemEl = this.list!.renderItem(item.content, item.meta as ChecklistItemMeta);
        }

        parentItem.appendChild(itemEl);

        /**
         * Check if there are child items
         */
        if (item.items.length) {
          const sublistWrapper = this.list?.renderWrapper(this.currentLevel);

          /**
           * Recursively render child items, it will increase currentLevel varible
           * after filling level with items we will need to decrease currentLevel
           */
          this.appendItems(item.items, sublistWrapper!);
          this.currentLevel -= 1;

          if (itemEl) {
            itemEl.appendChild(sublistWrapper!);
          }
        }
      });
    }
  }

  /**
   * Function that is responsible for list content saving
   * @param wrapper - optional argument wrapper
   * @returns whole list saved data if wrapper not passes, otherwise will return data of the passed wrapper
   */
  save(wrapper?: HTMLElement): ListData {
    const listWrapper = wrapper ?? this.listWrapper;

    /**
     * The method for recursive collecting of the child items
     *
     * @param {Element} parent - where to find items
     * @returns {ListItem[]}
     */
    const getItems = (parent: Element): ListItem[] => {
      const children = Array.from(
        parent.querySelectorAll(`:scope > .${DefaultListCssClasses.item}`)
      );

      return children.map((el) => {
        const subItemsWrapper = el.querySelector(`.${DefaultListCssClasses.itemChildren}`);
        const content = this.list!.getItemContent(el);
        const meta = this.list!.getItemMeta(el);
        const subItems = subItemsWrapper ? getItems(subItemsWrapper) : [];

        return {
          content,
          meta,
          items: subItems,
        };
      });
    };

    return {
      style: this.data.style,
      items: listWrapper ? getItems(listWrapper) : [],
    };
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
    const oldView = this.listWrapper;

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
          meta: {},
          items: subItems,
        };
      });
    };

    // get pasted items.
    data.items = getPastedItems(element);

    return data;
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
    if (currentItem === null) {
      return;
    }

    /**
     * On Enter in the last empty item, get out of list
     */
    const isEmpty = currentItem
      ? this.list?.getItemContent(currentItem).trim().length === 0
      : true;
    const isFirstLevelItem = currentItem.parentNode === this.listWrapper;
    const isLastItem = currentItem.nextElementSibling === null;

    if (isFirstLevelItem && isEmpty) {
      if (isLastItem) {
        this.getOutOfList();
      }
      /**
       * If enter is pressed in the senter of the list we should split it
       */
      else {
        const currentItemChildWrapper = currentItem.querySelector(`.${DefaultListCssClasses.itemChildren}`);

        let firstChildItem: Element | null = null;

        /**
         * We should unshift child items to the first level before splitting
         */
        if (currentItemChildWrapper !== null) {
          firstChildItem = currentItemChildWrapper.querySelector(`.${DefaultListCssClasses.item}`);

          if (firstChildItem !== null) {
            this.unshiftItem(firstChildItem);
          }
        }

        /**
         * Render new wrapper for list that would be separated
         */
        const newListWrapper = this.list!.renderWrapper(0);

        let trailingElement: Element | null = currentItem.nextElementSibling;

        const newListItems: Element[] = [];

        while (trailingElement !== null) {
          newListItems.push(trailingElement);

          trailingElement = trailingElement.nextElementSibling;
        }

        newListItems.forEach((item) => {
          newListWrapper.appendChild(item);
        })

        const newListContent = this.save(newListWrapper);

        const currentBlockIndex = this.api.blocks.getCurrentBlockIndex();
        const currentBlock = this.api.blocks.getBlockByIndex(currentBlockIndex);

        this.getOutOfList();

        this.api.blocks.insert(currentBlock?.name, newListContent, this.config, currentBlockIndex + 2);

        newListWrapper.remove();
      }

      return;
    } else if (isEmpty) {
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
      `.${DefaultListCssClasses.itemChildren}`
    );

    /**
     * Create the new list item
     */
    const itemEl = this.list!.renderItem(endingHTML, { checked: false });

    /**
     * Check if child items exist
     *
     * @type {boolean}
     */
    const childrenExist =
      itemChildren &&
      Array.from(itemChildren.querySelectorAll(`.${DefaultListCssClasses.item}`)).length > 0;

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
    const parentItem = currentItem.parentNode.closest(`.${DefaultListCssClasses.item}`);

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
        `.${DefaultListCssClasses.item}`
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
      `.${DefaultListCssClasses.itemContent}`
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
        `.${DefaultListCssClasses.itemChildren} > .${DefaultListCssClasses.item}`
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
      return node.parentNode.closest(`.${DefaultListCssClasses.item}`) === currentItem;
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
   * Decrease indentation of the current item
   *
   * @returns {void}
   */
  unshiftItem(item?: Element): void {
    const currentItem = item ?? this.currentItem;
    if (!currentItem) {
      return;
    }
    if (!currentItem.parentNode) {
      return;
    }
    if (!isHtmlElement(currentItem.parentNode)) {
      return;
    }

    const parentItem = currentItem.parentNode.closest(`.${DefaultListCssClasses.item}`);

    /**
     * If item in the first-level list then no need to do anything
     */
    if (!parentItem) {
      return;
    }


    let currentItemWrapper = currentItem.querySelector(`.${DefaultListCssClasses.itemChildren}`);

    /**
     * If there is no child wrapper, render one
     */
    if (currentItemWrapper === null) {
      currentItemWrapper = this.list!.renderWrapper(1);
    }

    let sibling = currentItem.nextElementSibling;

    const trailingSiblings: Element[] = [];

    /**
     * Form trailing siblings array
     */
    while (sibling) {
      if (sibling.classList.contains(DefaultListCssClasses.item)) {
        trailingSiblings.push(sibling);
      }
      sibling = sibling.nextElementSibling;
    }

    trailingSiblings.forEach((sibling) => {
      currentItemWrapper.appendChild(sibling);
    })

    currentItem.appendChild(currentItemWrapper);

    this.caret.save();

    parentItem.after(currentItem);

    this.caret.restore();

    /**
     * If previous parent's children list is now empty, remove it.
     */
    const prevParentChildrenList = parentItem.querySelector(
      `.${DefaultListCssClasses.itemChildren}`
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

    /**
     * Check that the item has potential parent
     */
    const prevItem = currentItem.previousSibling;

    if (prevItem === null) {
      return;
    }
    if (!isHtmlElement(prevItem)) {
      return;
    }

    const prevItemChildrenList = prevItem.querySelector(
      `.${DefaultListCssClasses.itemChildren}`
    );

    this.caret.save();

    /**
     * If prev item has child items, just append current to them
     * Else render new child wrapper for previous item
     */
    if (prevItemChildrenList) {
      /**
       * Previous item would be appended with current item and it's sublists
       * After that sublists would be moved one level back
       */
      prevItemChildrenList.appendChild(currentItem);

      /**
       * Get current item child wrapper
       */
      const currentItemChildWrapper = currentItem.querySelector(`.${DefaultListCssClasses.itemChildren}`);

      /**
       * Get all current item child to be moved to previous nesting level
       */
      const currentItemChildrenList = Array.from(currentItemChildWrapper?.children ?? []).filter(child =>
        child.classList.contains(`${DefaultListCssClasses.item}`)
      );

      /**
       * Move current item sublists one level back
       */
      if (currentItemChildrenList !== null) {
        currentItemChildrenList.forEach((child) => {
          prevItemChildrenList.appendChild(child);
        })
      }
    } else {
      const prevItemChildrenListWrapper = this.list!.renderWrapper(1);

      /**
       * Previous item would be appended with current item and it's sublists
       * After that sublists would be moved one level back
       */
      prevItemChildrenListWrapper.appendChild(currentItem);

      /**
       * Get current item child wrapper
       */
      const currentItemChildWrapper = currentItem.querySelector(`.${DefaultListCssClasses.itemChildren}`);

      /**
       * Get all current item child to be moved to previous nesting level
       */
      const currentItemChildrenList = Array.from(currentItemChildWrapper?.children ?? []).filter(child =>
        child.classList.contains(`${DefaultListCssClasses.item}`)
      );

      /**
       * Move current item sublists one level back
       */
      if (currentItemChildrenList !== null) {
        currentItemChildrenList.forEach((child) => {
          prevItemChildrenListWrapper.appendChild(child);
        })
      }

      prevItem.appendChild(prevItemChildrenListWrapper);
    }

    this.caret.restore();
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
      `.${DefaultListCssClasses.itemContent}`
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
}
