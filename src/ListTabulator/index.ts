import { OrderedListRenderer } from "../ListRenderer/OrderedListRenderer";
import { UnorderedListRenderer } from "../ListRenderer/UnorderedListRenderer";
import { NestedListConfig, ListData, ListDataStyle } from "../types/ListParams"
import { ListItem, ListItemElement } from "../types/ListParams";
import { isHtmlElement } from '../utils/type-guards';
import { getContenteditableSlice, getCaretNodeAndOffset, focus, isCaretAtStartOfInput } from '@editorjs/caret';
import { save } from '@editorjs/caret';
import { DefaultListCssClasses } from "../ListRenderer";
import type { PasteEvent } from '../types';
import type { API, BlockAPI, PasteConfig } from '@editorjs/editorjs';
import { ListParams } from "..";
import { ChecklistItemMeta, OrderedListItemMeta, UnorderedListItemMeta } from "../types/ItemMeta";
import type { ListRenderer } from '../types/ListRenderer'
import { getSiblings } from '../utils/getSiblings';

/**
 * Class that is responsible for list tabulation
 */
export default class ListTabulator<Renderer extends ListRenderer> {
  /**
   * The Editor.js API
   */
  private api: API;

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
   * Editor block api
   */
  private block: BlockAPI;

  /**
   * Rendered list of items
   */
  renderer: Renderer;

  /**
   * Wrapper of the whole list
   */
  listWrapper: HTMLElement | undefined;

  /**
   * Returns current List item by the caret position
   *
   * @returns {Element}
   */
  get currentItem(): HTMLElement | null {
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

  constructor({data, config, api, readOnly, block}: ListParams, renderer: Renderer) {
    this.config = config;
    this.data = data;
    this.readOnly = readOnly;
    this.api = api;
    this.block = block;

    this.renderer = renderer;
  }

  /**
   * Get all child items of the current list item
   */
  private getChildItems(element: HTMLElement): ListItemElement[] | null {
    let itemChildWrapper: HTMLElement = element;

    /**
     * If passed element is list item than get item's child wrapper
     */
    if (element.classList.contains(DefaultListCssClasses.item)) {
      itemChildWrapper = element.querySelector(`.${DefaultListCssClasses.itemChildren}`) as HTMLElement;
    }

    /**
     * Check if itemChildWrapper is not null
     * It could be null if current item has no child items
     * Or if passed element is not item and not childItemWrapper element
     */
    if (itemChildWrapper === null) {
      return null;
    }

    /**
     * Filter child items of the curret child item wrapper
     * In case that child could be not only list item
     */
    return Array.from(itemChildWrapper.querySelectorAll(`:scope > .${DefaultListCssClasses.item}`))
  }

  /**
   * Function that is responsible for rendering nested list with contents
   * @returns Filled with content wrapper element of the list
   */
  render() {
    this.listWrapper = this.renderer.renderWrapper(true);

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
  appendItems(items: ListItem[], parentElement: Element): void {
    if (this.renderer !== undefined) {
      items.forEach((item) => {
        const itemEl = this.renderItem(item.content, item.meta);

        parentElement.appendChild(itemEl);

        /**
         * Check if there are child items
         */
        if (item.items.length) {
          const sublistWrapper = this.renderer?.renderWrapper(false);

          /**
           * Recursively render child items, it will increase currentLevel varible
           * after filling level with items we will need to decrease currentLevel
           */
          this.appendItems(item.items, sublistWrapper!);

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
        const content = this.renderer!.getItemContent(el);
        const meta = this.renderer!.getItemMeta(el);
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
   * Method that specified hot to merge two List blocks.
   * Called by Editor.js by backspace at the beginning of the Block
   *
   * Content of the first item of the next List would be merged with deepest item in current list
   * Other items of the next List would be appended to the current list without any changes in nesting levels
   *
   * @param {ListData} data - data of the second list to be merged with current
   * @public
   */
  merge(data: ListData): void {
    const blockItems = this.block.holder.querySelectorAll(`.${DefaultListCssClasses.item}`);

    const deepestBlockItem = blockItems[blockItems.length - 1] as HTMLElement;
    const deepestBlockItemContent = deepestBlockItem.querySelector(`.${DefaultListCssClasses.itemContent}`) as HTMLElement;

    if (deepestBlockItem === null || deepestBlockItemContent === null) {
      return;
    }

    focus(deepestBlockItemContent);

    const restore = save();
    /**
     * Insert trailing html to the deepest block item content
     */
    deepestBlockItemContent.insertAdjacentHTML('beforeend', data.items[0].content);

    restore();

    if (this.listWrapper === undefined) {
      return;
    }

    const firstLevelItems = this.getChildItems(this.listWrapper);

    if (firstLevelItems === null) {
      return;
    }

    /**
     * Get last item of the first level of the list
     */
    const lastFirstLevelItem = firstLevelItems[firstLevelItems.length - 1];

    /**
     * Get child items wrapper of the last item
     */
    let lastFirstLevelItemChildWrapper = lastFirstLevelItem.querySelector(`.${DefaultListCssClasses.itemChildren}`);

    /**
     * Get first item of the list to be merged with current one
     */
    const firstItem = data.items.shift();

    /**
     * Check that first item exists
     */
    if (firstItem === undefined) {
      return;
    }

    /**
     * Append child items of the first element
     */
    if (firstItem.items.length !== 0) {
      /**
       * Render child wrapper of the last item if it does not exist
       */
      if (lastFirstLevelItemChildWrapper === null) {
        lastFirstLevelItemChildWrapper = this.renderer.renderWrapper(false);
      }

      this.appendItems(firstItem.items, lastFirstLevelItemChildWrapper);
    }

    if (data.items.length > 0) {
      this.appendItems(data.items, this.listWrapper);
    }
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

    const isEmpty = currentItem
      ? this.renderer?.getItemContent(currentItem).trim().length === 0
      : true;
    const isFirstLevelItem = currentItem.parentNode === this.listWrapper;
    const isLastItem = currentItem.nextElementSibling === null;
    const hasSublist = currentItem.querySelector(`.${DefaultListCssClasses.itemChildren}`) !== null;


    /**
     * On Enter in the last empty item, get out of list
     */
    if (isFirstLevelItem && isEmpty) {
      if (isLastItem && !hasSublist) {
        this.getOutOfList();

        return;
      }
      /**
       * If enter is pressed in the сenter of the list item we should split it
       */
      else {
        this.splitList(currentItem);

        return;
      }
    }
    /**
     * If currnet item is empty and is in the middle of the list
     * And if current item is not on the first level
     * Then unshift current item
     */
    else if (isEmpty) {
      this.unshiftItem(currentItem);

      return;
    }
    /**
     * If current item is not empty than split current item
     */
    else {
      this.splitItem(currentItem);
    }
  }

  /**
   * Handle backspace
   *
   * @param {KeyboardEvent} event - keydown
   */
  backspace(event: KeyboardEvent): void {
    const currentItem = this.currentItem;

    if (currentItem === null) {
      return;
    }

    /**
     * Caret is not at start of the item
     * Then backspace button should remove letter as usual
     */
    if (!isCaretAtStartOfInput(currentItem)) {
      return;
    }

    /**
     * Prevent default backspace behaviour
     */
    event.preventDefault();

    this.mergeItemWithPrevious(currentItem);
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
     * Check that current item exists
     */
    if (this.currentItem === null) {
      return;
    }

    /**
     * Move item from current list to parent list
     */
    this.unshiftItem(this.currentItem);
  }

  /**
   * Decrease indentation of the passed item
   *
   * @returns {void}
   */
  unshiftItem(item: ListItemElement): void {
    if (!item.parentNode) {
      return;
    }
    if (!isHtmlElement(item.parentNode)) {
      return;
    }

    const parentItem = item.parentNode.closest(`.${DefaultListCssClasses.item}`);

    /**
     * If item in the first-level list then no need to do anything
     */
    if (!parentItem) {
      return;
    }

    let currentItemWrapper = item.querySelector(`.${DefaultListCssClasses.itemChildren}`);

    if (item.parentElement === null) {
      return;
    }

    const siblings = getSiblings(item as HTMLElement);

    /**
     * If current item has no childs, than render child wrapper
     * After that trailing siblings would be appended to the child wrapper
     */
    if (currentItemWrapper === null) {
      currentItemWrapper = this.renderer!.renderWrapper(false);
    }

    siblings?.forEach((sibling) => {
      currentItemWrapper.appendChild(sibling);
    })

    /**
     * Check that we have any trailing items appended to the currentItemWrapper
     * If currentItemWrapper has no child items, than remove currentItemWrapper
     */
    if (currentItemWrapper.childElementCount !== 0) {
      item.appendChild(currentItemWrapper);
    } else {
      currentItemWrapper.remove();
    }

    const restore = save();

    parentItem.after(item);

    restore();

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
   * Method that is used for list splitting and moving trailing items to the new separated list
   * @param item - current item html element
   */
  splitList(item: ListItemElement): void {
    const currentItemChildrenList = this.getChildItems(item);

    /**
     * First child item should be unshifted because separated list should start
     * with item with first nesting level
     */
    if (currentItemChildrenList !== null) {
      const firstChildItem = currentItemChildrenList[0];

      this.unshiftItem(firstChildItem);
    }

    /**
     * Get trailing siblings of the current item
     */
    const newListItems = getSiblings(item);

    if (newListItems === null) {
      return;
    }

    /**
     * Render new wrapper for list that would be separated
     */
    const newListWrapper = this.renderer!.renderWrapper(true);

    /**
     * Append new list wrapper with trailing elements
     */
    newListItems.forEach((item) => {
      newListWrapper.appendChild(item);
    })

    const newListContent = this.save(newListWrapper);

    /**
     * Get current list block index
     */
    const currentBlock = this.block;

    const currentBlockIndex = this.api.blocks.getCurrentBlockIndex()

    /**
     * Insert separated list with trailing items
     * Insertion will be applied after paragraph block inserted in getOutOfList method
     * this is why we need to increase currentBlock index by 1 (current block index is index of the paragraph block)
     */
    this.api.blocks.insert(currentBlock?.name, newListContent, this.config, currentBlockIndex + 1);

    /**
     * Insert paragraph
     */
    this.getOutOfList(currentBlockIndex + 1);

    /**
     * Remove temporary new list wrapper used for content save
     */
    newListWrapper.remove();
  }

  /**
   * Method that is used for splitting item content and moving trailing content to the new sibling item
   * @param currentItem - current item html element
   */
  splitItem(currentItem: ListItemElement): void {
    const [ currentNode, offset ] = getCaretNodeAndOffset();

    if ( currentNode === null ) {
      return;
    }

    const currentItemContent = currentItem.querySelector<HTMLElement>(`.${DefaultListCssClasses.itemContent}`);

    let endingHTML: string;

    /**
     * If current item has no content, we should pass an empty string to the next created list item
     */
    if (currentItemContent === null) {
      endingHTML = '';
    } else {
      /**
       * On other Enters, get content from caret till the end of the block
       * And move it to the new item
       */
      endingHTML = getContenteditableSlice(currentItemContent, currentNode, offset, 'right', true);
    }

    const itemChildren = currentItem?.querySelector(
      `.${DefaultListCssClasses.itemChildren}`
    );

    /**
     * Create the new list item
     */
    const itemEl = this.renderItem(endingHTML);

    /**
     * Move new item after current
     */
    currentItem?.after(itemEl);

    /**
     * If current item has children, move them to the new item
     */
    if (itemChildren) {
      itemEl.appendChild(itemChildren);
    }

    this.focusItem(itemEl);
  }

  /**
   * Method that is used for merging current item with previous one
   * Content of the current item would be appended to the previous item
   * Current item children would not change nesting level
   * @param currentItem - current item html element
   */
  mergeItemWithPrevious(item: ListItemElement): void {
    const previousItem = item.previousElementSibling;

    const currentItemParentNode = item.parentNode;

    /**
     * Check that parent node of the current element exists
     */
    if (currentItemParentNode === null) {
      return;
    }
    if (!isHtmlElement(currentItemParentNode)) {
      return;
    }

    const parentItem = currentItemParentNode.closest<ListItemElement>(`.${DefaultListCssClasses.item}`);

    /**
     * Check that current item has any previous siblings to be merged with
     */
    if (!previousItem && !parentItem) {
      return;
    }

    /**
     * Make sure previousItem is an HTMLElement
     */
    if (previousItem && !isHtmlElement(previousItem)) {
      return;
    }

    /**
     * Lets compute the item which will be merged with current item text
     */
    let targetItem: ListItemElement | null;

    /**
     * If there is a previous item then we get a deepest item in its sublists
     *
     * Otherwise we will use the parent item
     */
    if (previousItem) {
      /**
       * Get list of all levels children of the previous item
       */
      const childrenOfPreviousItem = previousItem.querySelectorAll<ListItemElement>(`.${DefaultListCssClasses.item}`);

      /**
       * Target item would be deepest child of the previous item or previous item itself
       */
      targetItem = childrenOfPreviousItem[childrenOfPreviousItem.length - 1] || previousItem;
    } else {
      targetItem = parentItem;
    }

    /**
     * Get current item content
     */
    const currentItemContent = this.renderer.getItemContent(item);

    /**
     * Get the target item content element
     */
    if (!targetItem) {
      return;
    }

    /**
     * Get target item content element
     */
    const targetItemContentElement = targetItem.querySelector<HTMLElement>(`.${DefaultListCssClasses.itemContent}`);

    /**
     * Set a new place for caret
     */
    if (!targetItemContentElement) {
      return;
    }
    focus(targetItemContentElement, false);

    /**
     * Save the caret position
     */
    const restore = save();

    /**
     * Update target item content by merging with current item html content
     */
    targetItemContentElement.insertAdjacentHTML('beforeend', currentItemContent);

    /**
     * Get child list of the currentItem
     */
    const currentItemChildrenList = this.getChildItems(item);

    /**
     * Check that current item has any children
     */
    if (currentItemChildrenList == null) {
      /**
       * Remove current item element
       */
      item.remove();

      /**
       * Restore the caret position
       */
      restore();

      return;
    }

    /**
     * Get target for child list of the currentItem
     * Note that previous item and parent item could not be null at the same time
     * This case is checked before
     */
    const targetForChildItems = previousItem ? previousItem : parentItem!;

    const targetChildWrapper = targetForChildItems.querySelector(`.${DefaultListCssClasses.itemChildren}`) ?? this.renderer.renderWrapper(false);

    currentItemChildrenList.forEach(childItem => {
      targetChildWrapper.appendChild(childItem);
    })

    /**
     * Remove current item element
     */
    item.remove();

    /**
     * Restore the caret position
     */
    restore();
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
     * Previous sibling is potential parent in case of adding tab
     * After adding tab current item would be moved to the previous sibling's child list
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

    const restore = save();

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
       * Get all current item child to be moved to previous nesting level
       */
      const currentItemChildrenList = this.getChildItems(currentItem);

      /**
       * Move current item sublists one level back
       */
      if (currentItemChildrenList !== null) {
        currentItemChildrenList.forEach((child) => {
          prevItemChildrenList.appendChild(child);
        })
      }
    } else {
      const prevItemChildrenListWrapper = this.renderer!.renderWrapper(false);

      /**
       * Previous item would be appended with current item and it's sublists
       * After that sublists would be moved one level back
       */
      prevItemChildrenListWrapper.appendChild(currentItem);

      /**
       * Get all current item child to be moved to previous nesting level
       */
      const currentItemChildrenList = this.getChildItems(currentItem);

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

    restore();
  }

  /**
   * Sets focus to the item's content
   *
   * @param {Element} item - item (<li>) to select
   * @param {boolean} atStart - where to set focus: at the start or at the end
   * @returns {void}
   */
  focusItem(item: ListItemElement, atStart: boolean = true): void {
    const itemContent = item.querySelector<HTMLElement>(
      `.${DefaultListCssClasses.itemContent}`
    );
    if (!itemContent) {
      return;
    }

    focus(itemContent, atStart);
  }

  /**
   * Get out from List Tool by Enter on the empty last item
   * @param index - optional parameter represents index, where would be inseted default block
   * @returns {void}
   */
  getOutOfList(index?: number): void {
    let newBlock;

    /**
     * Check that index passed
     */
    if (index !== undefined) {
      newBlock = this.api.blocks.insert(undefined, undefined, undefined, index);
    } else {
      newBlock = this.api.blocks.insert();
    }

    this.currentItem?.remove();
    this.api.caret.setToBlock(newBlock);
  }

  /**
   * Method that calls render function of the renderer with a necessary item meta cast
   * @param item - item to be rendered
   * @returns html element of the rendered item
   */
  renderItem(itemContent: ListItem['content'], meta?: ListItem['meta']): HTMLElement {
    const itemMeta = meta ?? this.renderer.composeDefaultMeta();

    switch (true) {
      case this.renderer instanceof OrderedListRenderer:
        return this.renderer.renderItem(itemContent, itemMeta as OrderedListItemMeta);

      case this.renderer instanceof UnorderedListRenderer:
        return this.renderer.renderItem(itemContent, itemMeta as UnorderedListItemMeta);

      default:
        return this.renderer.renderItem(itemContent, itemMeta as ChecklistItemMeta);
    }
  }
}
