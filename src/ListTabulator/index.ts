import { OrderedListRenderer } from '../ListRenderer/OrderedListRenderer';
import { UnorderedListRenderer } from '../ListRenderer/UnorderedListRenderer';
import type { ListConfig, ListData, ListDataStyle } from '../types/ListParams';
import type { ListItem } from '../types/ListParams';
import type { ItemElement, ItemChildWrapperElement } from '../types/Elements';
import { isHtmlElement } from '../utils/type-guards';
import { getContenteditableSlice, getCaretNodeAndOffset, isCaretAtStartOfInput, isCaretAtEndOfInput } from '@editorjs/caret';
import { DefaultListCssClasses } from '../ListRenderer';
import type { PasteEvent } from '../types';
import type { API, BlockAPI, PasteConfig } from '@editorjs/editorjs';
import type { ListParams } from '..';
import type { ChecklistItemMeta, ItemMeta, OrderedListItemMeta, UnorderedListItemMeta } from '../types/ItemMeta';
import type { ListRenderer } from '../types/ListRenderer';
import { getSiblings } from '../utils/getSiblings';
import { getChildItems } from '../utils/getChildItems';
import { isLastItem } from '../utils/isLastItem';
import { itemHasSublist } from '../utils/itemHasSublist';
import { getItemChildWrapper } from '../utils/getItemChildWrapper';
import { removeChildWrapperIfEmpty } from '../utils/removeChildWrapperIfEmpty';
import { getItemContentElement } from '../utils/getItemContentElement';
import { focusItem } from '../utils/focusItem';
import type { OlCounterType } from '../types/OlCounterType';

/**
 * Class that is responsible for list tabulation
 */
export default class ListTabulator<Renderer extends ListRenderer> {
  /**
   * The Editor.js API
   */
  private api: API;

  /**
   * Is Editorjs List Tool read-only option
   */
  private readOnly: boolean;

  /**
   * Tool's configuration
   */
  private config?: ListConfig;

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
  private renderer: Renderer;

  /**
   * Wrapper of the whole list
   */
  private listWrapper: ItemChildWrapperElement | undefined;

  /**
   * Getter method to get current item
   * @returns current list item or null if caret position is not undefined
   */
  private get currentItem(): ItemElement | null {
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

  /**
   * Method that returns nesting level of the current item, null if there is no selection
   */
  private get currentItemLevel(): number | null {
    const currentItem = this.currentItem;

    if (currentItem === null) {
      return null;
    }

    let parentNode = currentItem.parentNode;

    let levelCounter = 0;

    while (parentNode !== null && parentNode !== this.listWrapper) {
      if (isHtmlElement(parentNode) && parentNode.classList.contains(DefaultListCssClasses.item)) {
        levelCounter += 1;
      }

      parentNode = parentNode.parentNode;
    }

    /**
     * Level counter is number of the parent element, so it should be increased by one
     */
    return levelCounter + 1;
  }

  /**
   * Assign all passed params and renderer to relevant class properties
   * @param params - tool constructor options
   * @param params.data - previously saved data
   * @param params.config - user config for Tool
   * @param params.api - Editor.js API
   * @param params.readOnly - read-only mode flag
   * @param renderer - renderer instance initialized in tool class
   */
  constructor({ data, config, api, readOnly, block }: ListParams, renderer: Renderer) {
    this.config = config;
    this.data = data as ListData;
    this.readOnly = readOnly;
    this.api = api;
    this.block = block;

    this.renderer = renderer;
  }

  /**
   * Function that is responsible for rendering list with contents
   * @returns Filled with content wrapper element of the list
   */
  public render(): ItemChildWrapperElement {
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
        this.listWrapper
      );
    }

    if (!this.readOnly) {
      // detect keydown on the last item to escape List
      this.listWrapper.addEventListener(
        'keydown',
        (event) => {
          switch (event.key) {
            case 'Enter':
              if (event.shiftKey) {
                this.enterBreakPressed(event);
              } else {
                this.enterPressed(event);
              }
              break;
            case 'Backspace':
              this.backspace(event);
              break;
            case 'Delete':
              this.delete(event);
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

    /**
     * Set start property value from initial data
     */
    if ('start' in this.data.meta && this.data.meta.start !== undefined) {
      this.changeStartWith(this.data.meta.start);
    }

    /**
     * Set counterType value from initial data
     */
    if ('counterType' in this.data.meta && this.data.meta.counterType !== undefined) {
      this.changeCounters(this.data.meta.counterType);
    }

    return this.listWrapper;
  }

  /**
   * Function that is responsible for list content saving
   * @param wrapper - optional argument wrapper
   * @returns whole list saved data if wrapper not passes, otherwise will return data of the passed wrapper
   */
  public save(wrapper?: ItemChildWrapperElement): ListData {
    const listWrapper = wrapper ?? this.listWrapper;

    /**
     * The method for recursive collecting of the child items
     * @param parent - where to find items
     */
    const getItems = (parent: ItemChildWrapperElement): ListItem[] => {
      const children = getChildItems(parent);

      return children.map((el) => {
        const subItemsWrapper = getItemChildWrapper(el);
        const content = this.renderer.getItemContent(el);
        const meta = this.renderer.getItemMeta(el);
        const subItems = subItemsWrapper ? getItems(subItemsWrapper) : [];

        return {
          content,
          meta,
          items: subItems,
        };
      });
    };

    const composedListItems = listWrapper ? getItems(listWrapper) : [];

    let dataToSave: ListData = {
      style: this.data.style,
      meta: {} as ItemMeta,
      items: composedListItems,
    };

    if (this.data.style === 'ordered') {
      dataToSave.meta = {
        start: (this.data.meta as OrderedListItemMeta).start,
        counterType: (this.data.meta as OrderedListItemMeta).counterType,
      };
    }

    return dataToSave;
  }

  /**
   * On paste sanitzation config. Allow only tags that are allowed in the Tool.
   * @returns - config that determines tags supposted by paste handler
   * @todo - refactor and move to list instance
   */
  public static get pasteConfig(): PasteConfig {
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
   * @param data - data of the second list to be merged with current
   */
  public merge(data: ListData): void {
    /**
     * Get list of all levels children of the previous item
     */
    const items = this.block.holder.querySelectorAll<ItemElement>(`.${DefaultListCssClasses.item}`);

    const deepestBlockItem = items[items.length - 1];
    const deepestBlockItemContentElement = getItemContentElement(deepestBlockItem);

    if (deepestBlockItem === null || deepestBlockItemContentElement === null) {
      return;
    }

    /**
     * Insert trailing html to the deepest block item content
     */
    deepestBlockItemContentElement.insertAdjacentHTML('beforeend', data.items[0].content);

    if (this.listWrapper === undefined) {
      return;
    }

    const firstLevelItems = getChildItems(this.listWrapper);

    if (firstLevelItems.length === 0) {
      return;
    }

    /**
     * Get last item of the first level of the list
     */
    const lastFirstLevelItem = firstLevelItems[firstLevelItems.length - 1];

    /**
     * Get child items wrapper of the last item
     */
    let lastFirstLevelItemChildWrapper = getItemChildWrapper(lastFirstLevelItem);

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
   * @param event - event with pasted data
   * @todo - refactor and move to list instance
   */
  public onPaste(event: PasteEvent): void {
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
   * @param element - html element that contains whole list
   * @todo - refactor and move to list instance
   */
  public pasteHandler(element: PasteEvent['detail']['data']): ListData {
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
      meta: {} as ItemMeta,
      items: [],
    };

    /**
     * Set default ordered list atributes if style is ordered
     */
    if (style === 'ordered') {
      (this.data.meta as OrderedListItemMeta).counterType = 'numeric';
      (this.data.meta as OrderedListItemMeta).start = 1;
    }

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
        let content = child.innerHTML.trim();

        if (subItemsWrapper) {
          // Get Copy of Child and remove any nested OL or UL tags from the content
          const childCopy = child.cloneNode(true) as HTMLElement;

          childCopy.querySelector(`:scope > ${tagToSearch}`)?.remove();

          content = childCopy.innerHTML;
        }

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
   * Changes ordered list start property value
   * @param index - new value of the start property
   */
  public changeStartWith(index: number): void {
    this.listWrapper!.style.setProperty('counter-reset', `item ${index - 1}`);

    (this.data.meta as OrderedListItemMeta).start = index;
  }

  /**
   * Changes ordered list counterType property value
   * @param counterType - new value of the counterType value
   */
  public changeCounters(counterType: OlCounterType): void {
    this.listWrapper!.style.setProperty('--list-counter-type', counterType);

    (this.data.meta as OrderedListItemMeta).counterType = counterType;
  }

  /**
   * Handles Enter keypress
   * @param event - keydown
   */
  private enterPressed(event: KeyboardEvent): void {
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

    const isEmpty = this.renderer?.getItemContent(currentItem).trim().length === 0;
    const isFirstLevelItem = currentItem.parentNode === this.listWrapper;
    const isFirstItem = currentItem.previousElementSibling === null;

    const currentBlockIndex = this.api.blocks.getCurrentBlockIndex();

    /**
     * On Enter in the last empty item, get out of list
     */
    if (isFirstLevelItem && isEmpty) {
      if (isLastItem(currentItem) && !itemHasSublist(currentItem)) {
        /**
         * If current item is first and last item of the list, then empty list should be deleted after deletion of the item
         */
        if (isFirstItem) {
          this.convertItemToDefaultBlock(currentBlockIndex, true);
        } else {
          /**
           * If there are other items in the list, just remove current item and get out of the list
           */
          this.convertItemToDefaultBlock();
        }

        return;
      } else {
        /**
         * If enter is pressed in the сenter of the list item we should split it
         */
        this.splitList(currentItem);

        return;
      }
    } else if (isEmpty) {
      /**
       * If currnet item is empty and is in the middle of the list
       * And if current item is not on the first level
       * Then unshift current item
       */
      this.unshiftItem(currentItem);

      return;
    } else {
      /**
       * If current item is not empty than split current item
       */
      this.splitItem(currentItem);
    }
  }


  /**
   * Handles Enter break keypress
   * @param event - keydown
   */
  private enterBreakPressed(event: KeyboardEvent): void {
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

    const isEmpty = this.renderer?.getItemContent(currentItem).trim().length === 0;

    /**
     * On Enter in the last empty item, get out of list
     */
    if (isEmpty) {

      return;
    } else {
      /**
       * If current item is not empty than split current item
       */
      this.insertLineBreakAtCaret(currentItem);
    }
  }


  /**
   * Handle backspace
   * @param event - keydown
   */
  private backspace(event: KeyboardEvent): void {
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
     * If backspace is pressed with selection, it should be handled as usual
     */
    if (window.getSelection()?.isCollapsed === false) {
      return;
    }

    /**
     * Prevent Editor.js backspace handling
     */
    event.stopPropagation();

    /**
     * First item of the list should become paragraph on backspace
     */
    if (currentItem.parentNode === this.listWrapper && currentItem.previousElementSibling === null) {
      /**
       * If current item is first item of the list, then we need to merge first item content with previous block
       */
      this.convertFirstItemToDefaultBlock();

      return;
    }

    /**
     * Prevent default backspace behaviour
     */
    event.preventDefault();

    this.mergeItemWithPrevious(currentItem);
  }

  /**
   * Handle delete
   * @param event - keydown
   */
  private delete(event: KeyboardEvent): void {
    const currentItem = this.currentItem;

    if (currentItem === null) {
      return;
    }

    /**
     * Caret is not at end of the item
     * Then delete button should remove letter as usual
     */
    if (!isCaretAtEndOfInput(currentItem)) {
      return;
    }

    /**
     * If backspace is pressed with selection, it should be handled as usual
     */
    if (window.getSelection()?.isCollapsed === false) {
      return;
    }

    /**
     * Prevent Editor.js backspace handling
     */
    event.stopPropagation();

    /**
     * Prevent default backspace behaviour
     */
    event.preventDefault();

    this.mergeItemWithCurrent(currentItem);
  }

  /**
   * Reduce indentation for current item
   * @param event - keydown
   */
  private shiftTab(event: KeyboardEvent): void {
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
   * @param item - list item to be unshifted
   */
  private unshiftItem(item: ItemElement): void {
    if (!item.parentNode) {
      return;
    }
    if (!isHtmlElement(item.parentNode)) {
      return;
    }

    const parentItem = item.parentNode.closest<ItemElement>(`.${DefaultListCssClasses.item}`);

    /**
     * If item in the first-level list then no need to do anything
     */
    if (!parentItem) {
      return;
    }

    let currentItemChildWrapper = getItemChildWrapper(item);

    if (item.parentElement === null) {
      return;
    }

    const siblings = getSiblings(item);

    /**
     * If item has any siblings, they should be appended to item child wrapper
     */
    if (siblings !== null) {
      /**
       * Render child wrapper if it does no exist
       */
      if (currentItemChildWrapper === null) {
        currentItemChildWrapper = this.renderer.renderWrapper(false);
      }

      /**
       * Append siblings to item child wrapper
       */
      siblings.forEach((sibling) => {
        currentItemChildWrapper!.appendChild(sibling);
      });

      item.appendChild(currentItemChildWrapper);
    }

    parentItem.after(item);

    focusItem(item, false);

    /**
     * If parent item has empty child wrapper after unshifting of the current item, then we need to remove child wrapper
     * This case could be reached if the only child item of the parent was unshifted
     */
    removeChildWrapperIfEmpty(parentItem);
  }

  /**
   * Method that is used for list splitting and moving trailing items to the new separated list
   * @param item - current item html element
   */
  private splitList(item: ItemElement): void {
    const currentItemChildrenList = getChildItems(item);

    /**
     * Get current list block index
     */
    const currentBlock = this.block;

    const currentBlockIndex = this.api.blocks.getCurrentBlockIndex();

    /**
     * First child item should be unshifted because separated list should start
     * with item with first nesting level
     */
    if (currentItemChildrenList.length !== 0) {
      const firstChildItem = currentItemChildrenList[0];

      this.unshiftItem(firstChildItem);

      /**
       * If first child item was been unshifted, that caret would be set to the end of the first child item
       * Then we should set caret to the actual current item
       */
      focusItem(item, false);
    }

    /**
     * If item is first item of the list, we should just get out of the list
     * It means, that we would not split on two lists, if one of them would be empty
     */
    if (item.previousElementSibling === null && item.parentNode === this.listWrapper) {
      this.convertItemToDefaultBlock(currentBlockIndex);

      return;
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
    const newListWrapper = this.renderer.renderWrapper(true);

    /**
     * Append new list wrapper with trailing elements
     */
    newListItems.forEach((newListItem) => {
      newListWrapper.appendChild(newListItem);
    });

    const newListContent = this.save(newListWrapper);

    (newListContent.meta as OrderedListItemMeta).start = this.data.style == 'ordered' ? 1 : undefined;

    /**
     * Insert separated list with trailing items
     */
    this.api.blocks.insert(currentBlock?.name, newListContent, this.config, currentBlockIndex + 1);

    /**
     * Insert paragraph
     */
    this.convertItemToDefaultBlock(currentBlockIndex + 1);

    /**
     * Remove temporary new list wrapper used for content save
     */
    newListWrapper.remove();
  }

  /**
   * Method that is used for splitting item content and moving trailing content to the new sibling item
   * @param currentItem - current item html element
   */
  private splitItem(currentItem: ItemElement): void {
    const [currentNode, offset] = getCaretNodeAndOffset();

    if (currentNode === null) {
      return;
    }

    const currentItemContent = getItemContentElement(currentItem);

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

    const itemChildren = getItemChildWrapper(currentItem);
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

    focusItem(itemEl);
  }

  /**
   * Method that is used for merging current item with previous one
   * Content of the current item would be appended to the previous item
   * Current item children would not change nesting level
   * @param item - current item html element
   */
  private mergeItemWithPrevious(item: ItemElement): void {
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

    const parentItem = currentItemParentNode.closest<ItemElement>(`.${DefaultListCssClasses.item}`);

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
    let targetItem: ItemElement | null;

    /**
     * If there is a previous item then we get a deepest item in its sublists
     *
     * Otherwise we will use the parent item
     */
    if (previousItem) {
      /**
       * Get list of all levels children of the previous item
       */
      const childrenOfPreviousItem = getChildItems(previousItem, false);

      /**
       * Target item would be deepest child of the previous item or previous item itself
       */
      if (childrenOfPreviousItem.length !== 0 && childrenOfPreviousItem.length !== 0) {
        targetItem = childrenOfPreviousItem[childrenOfPreviousItem.length - 1];
      } else {
        targetItem = previousItem;
      }
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
     * Set caret to the end of the target item
     */
    focusItem(targetItem, false);

    /**
     * Get target item content element
     */
    const targetItemContentElement = getItemContentElement(targetItem);

    /**
     * Set a new place for caret
     */
    if (targetItemContentElement === null) {
      return;
    }

    /**
     * Update target item content by merging with current item html content
     */
    targetItemContentElement.insertAdjacentHTML('beforeend', currentItemContent);

    /**
     * Get child list of the currentItem
     */
    const currentItemChildrenList = getChildItems(item);

    /**
     * If item has no children, just remove item
     * Else children of the item should be prepended to the target item child list
     */
    if (currentItemChildrenList.length === 0) {
      /**
       * Remove current item element
       */
      item.remove();

      /**
       * If target item has empty child wrapper after merge, we need to remove child wrapper
       * This case could be reached if the only child item of the target was merged with target
       */
      removeChildWrapperIfEmpty(targetItem);

      return;
    }

    /**
     * Get target for child list of the currentItem
     * Note that previous item and parent item could not be null at the same time
     * This case is checked before
     */
    const targetForChildItems = previousItem ? previousItem : parentItem!;

    const targetChildWrapper = getItemChildWrapper(targetForChildItems) ?? this.renderer.renderWrapper(false);

    /**
     * Add child current item children to the target childWrapper
     */
    if (previousItem) {
      currentItemChildrenList.forEach((childItem) => {
        targetChildWrapper.appendChild(childItem);
      });
    } else {
      currentItemChildrenList.forEach((childItem) => {
        targetChildWrapper.prepend(childItem);
      });
    }

    /**
     * If we created new wrapper, then append childWrapper to the target item
     */
    if (getItemChildWrapper(targetForChildItems) === null) {
      targetItem.appendChild(targetChildWrapper);
    }

    /**
     * Remove current item element
     */
    item.remove();
  }

  /**
   * Method that is used for merging current item with current one
   * Content of the current item would be appended to the current item
   * Current item children would not change nesting level
   * @param item - current item html element
   */
  private mergeItemWithCurrent(item: ItemElement): void {
    console.log(item)
    const nextItem = item.nextElementSibling;
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

    let parentItem = currentItemParentNode.closest<ItemElement>(`.${DefaultListCssClasses.item}`);

    if (parentItem === null) {
      parentItem = item;
    }

    const nextParentItem = parentItem?.nextElementSibling;

    if (nextParentItem === undefined) {
      return;
    }

    /**
     * Check that current item has any next siblings to be merged with
     */
    if (!nextItem && !nextParentItem) {
      return;
    }

    /**
     * Make sure previousItem is an HTMLElement
     */
    if (nextItem && !isHtmlElement(nextItem)) {
      return;
    }

    /**
     * Make sure previousItem is an HTMLElement
     */
    if (nextParentItem && !isHtmlElement(nextParentItem)) {
      return;
    }

    /**
     * Lets compute the item which will be merged with current item text
     */
    let targetItem: ItemElement | null;

    /**
     * If there is a next item then we get a deepest item in its sublists
     *
     * Otherwise we will use the parent item
     */
    if (nextItem) {
      /**
       * Get list of all levels children of the next item
       */
      const childrenOfNextItem = getChildItems(nextItem, false);

      /**
       * Target item would be deepest child of the next item or next item itself
       */
      if (childrenOfNextItem.length !== 0 && childrenOfNextItem.length !== 0) {
        targetItem = childrenOfNextItem[childrenOfNextItem.length - 1];
      } else {
        targetItem = nextItem;
      }
    } else {
      targetItem = nextParentItem;
    }


    /**
     * Get the target item content element
     */
    if (!targetItem) {
      return;
    }

    /**
     * Set caret to the end of the target item
     */
    focusItem(item, false);

    /**
     * Get next item content
     */
    const nextItemContent = this.renderer.getItemContent(targetItem);

    /**
     * Get target item content element
     */
    const targetItemContentElement = getItemContentElement(item);

    /**
     * Set a new place for caret
     */
    if (targetItemContentElement === null) {
      return;
    }

    /**
     * Update target item content by merging with current item html content
     */
    targetItemContentElement.insertAdjacentHTML('beforeend', nextItemContent);
    /**
     * Get child list of the currentItem
     */
    const nextItemChildrenList = getChildItems(targetItem);
    const currentItemChildrenList = getChildItems(parentItem);

    /**
     * If item has no children, just remove item
     * Else children of the item should be prepended to the target item child list
     */
    if (nextItemChildrenList.length === 0) {
      /**
       * Remove current item element
       */
      targetItem.remove();

      /**
       * If target item has empty child wrapper after merge, we need to remove child wrapper
       * This case could be reached if the only child item of the target was merged with target
       */
      removeChildWrapperIfEmpty(targetItem);

      return;
    }

    /**
     * Get target for child list of the currentItem
     * Note that previous item and parent item could not be null at the same time
     * This case is checked before
     */
    const targetForChildItems = nextItem ? nextItem : parentItem!;

    const targetChildWrapper = getItemChildWrapper(targetForChildItems) ?? this.renderer.renderWrapper(false);

    /**
     * Add child current item children to the target childWrapper
     */
    if (nextItem) {
      nextItemChildrenList.forEach((childItem) => {
        targetChildWrapper.appendChild(childItem);
      });
    } else {
      nextItemChildrenList.forEach((childItem) => {
        targetChildWrapper.append(childItem);
      });
    }

    /**
     * If we created new wrapper, then append childWrapper to the target item
     */
    if (getItemChildWrapper(targetForChildItems) === null) {
      item.appendChild(targetChildWrapper);
    }

    /**
     * Remove current item element
     */
    targetItem.remove();
  }

  private insertLineBreakAtCaret(currentItem: ItemElement): void {
    const [currentNode, offset] = getCaretNodeAndOffset();

    if (currentNode === null) {
      return;
    }

    const currentItemContent = getItemContentElement(currentItem);

    if (currentItemContent === null) {
      return;
    }

    const br = document.createElement('br');

    const range = document.createRange();
    const selection = window.getSelection();

    range.setStart(currentNode, offset);
    range.setEnd(currentNode, offset);
    range.insertNode(br);

    // Posun kurzor za <br>
    range.setStartAfter(br);
    range.setEndAfter(br);
    const zwsp = document.createTextNode("\u200B");
    br.after(zwsp);
    range.setStartAfter(zwsp);
    range.setEndAfter(zwsp);

    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  /**
   * Add indentation to current item
   * @param event - keydown
   */
  private addTab(event: KeyboardEvent): void {
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
     * Check that maxLevel specified in config
     */
    if (this.config?.maxLevel !== undefined) {
      const currentItemLevel = this.currentItemLevel;

      /**
       * Check that current item is not in the maximum nesting level
       */
      if (currentItemLevel !== null && currentItemLevel === this.config.maxLevel) {
        return;
      }
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

    const prevItemChildrenList = getItemChildWrapper(prevItem);

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
      const currentItemChildrenList = getChildItems(currentItem);

      /**
       * Move current item sublists one level back
       */
      currentItemChildrenList.forEach((child) => {
        prevItemChildrenList.appendChild(child);
      });
    } else {
      const prevItemChildrenListWrapper = this.renderer.renderWrapper(false);

      /**
       * Previous item would be appended with current item and it's sublists
       * After that sublists would be moved one level back
       */
      prevItemChildrenListWrapper.appendChild(currentItem);

      /**
       * Get all current item child to be moved to previous nesting level
       */
      const currentItemChildrenList = getChildItems(currentItem);

      /**
       * Move current item sublists one level back
       */
      currentItemChildrenList.forEach((child) => {
        prevItemChildrenListWrapper.appendChild(child);
      });

      prevItem.appendChild(prevItemChildrenListWrapper);
    }

    /**
     * Remove child wrapper of the current item if it is empty after adding the tab
     * This case would be reached, because after adding tab current item will have same nesting level with children
     * So its child wrapper would be empty
     */
    removeChildWrapperIfEmpty(currentItem);

    focusItem(currentItem, false);
  }

  /**
   * Convert current item to default block with passed index
   * @param newBloxkIndex - optional parameter represents index, where would be inseted default block
   * @param removeList - optional parameter, that represents condition, if List should be removed
   */
  private convertItemToDefaultBlock(newBloxkIndex?: number, removeList?: boolean): void {
    let newBlock;

    const currentItem = this.currentItem;

    const currentItemContent = currentItem !== null ? this.renderer.getItemContent(currentItem) : '';

    if (removeList === true) {
      this.api.blocks.delete();
    }

    /**
     * Check that index have passed
     */
    if (newBloxkIndex !== undefined) {
      newBlock = this.api.blocks.insert(undefined, { text: currentItemContent }, undefined, newBloxkIndex);
    } else {
      newBlock = this.api.blocks.insert();
    }

    currentItem?.remove();
    this.api.caret.setToBlock(newBlock, 'start');
  }

  /**
   * Convert first item of the list to default block
   * This method could be called when backspace button pressed at start of the first item of the list
   * First item of the list would be converted to the paragraph and first item children would be unshifted
   */
  private convertFirstItemToDefaultBlock(): void {
    const currentItem = this.currentItem;

    if (currentItem === null) {
      return;
    }

    const currentItemChildren = getChildItems(currentItem);

    /**
     * Check that current item have at least one child
     * If current item have no children, we can guarantee,
     * that after deletion of the first item of the list, children would not be removed
     */
    if (currentItemChildren.length !== 0) {
      const firstChildItem = currentItemChildren[0];

      /**
       * Unshift first child item, to guarantee, that after deletion of the first item
       * list will start with first level of nesting
       */
      this.unshiftItem(firstChildItem);

      /**
       * Set focus back to the current item after unshifting child
       */
      focusItem(currentItem);
    }

    /**
     * Get all first level items of the list
     */
    const currentItemSiblings = getSiblings(currentItem);

    const currentBlockIndex = this.api.blocks.getCurrentBlockIndex();

    /**
     * If current item has no siblings, than List is empty, and it should be deleted
     */
    const removeList = currentItemSiblings === null;

    this.convertItemToDefaultBlock(currentBlockIndex, removeList);
  }

  /**
   * Method that calls render function of the renderer with a necessary item meta cast
   * @param itemContent - content to be rendered in new item
   * @param meta - meta used in list item rendering
   * @returns html element of the rendered item
   */
  private renderItem(itemContent: ListItem['content'], meta?: ListItem['meta']): ItemElement {
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

  /**
   * Renders children list
   * @param items - list data used in item rendering
   * @param parentElement - where to append passed items
   */
  private appendItems(items: ListItem[], parentElement: Element): void {
    items.forEach((item) => {
      const itemEl = this.renderItem(item.content, item.meta);

      parentElement.appendChild(itemEl);

      /**
       * Check if there are child items
       */
      if (item.items.length) {
        const sublistWrapper = this.renderer?.renderWrapper(false);

        /**
         * Recursively render child items
         */
        this.appendItems(item.items, sublistWrapper);

        itemEl.appendChild(sublistWrapper);
      }
    });
  }
}
