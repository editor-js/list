import type { API, PasteConfig, ToolboxConfig } from '@editorjs/editorjs';
import type { PasteEvent } from './types';
import type {
  BlockToolConstructorOptions,
  TunesMenuConfig,
} from '@editorjs/editorjs/types/tools';

import * as Dom from './utils/dom';
import Caret from './utils/caret';
import { IconListBulleted, IconListNumbered } from '@codexteam/icons';
import { NestedListConfig, ListData, ListDataStyle, ListItem } from './types/listParams';
import Tabulator from './Tabulator';

/**
 * Build styles
 */
import './../styles/index.pcss';

/**
 * CSS classes for the Nested List Tool
 */
interface NestedListCssClasses {
  wrapper: string;
  wrapperOrdered: string;
  wrapperUnordered: string;
  wrapperChecklist: string;
  item: string;
  itemBody: string;
  itemContent: string;
  itemChildren: string;
  settingsWrapper: string;
  itemChecked: string;
  noHover: string;
  checkbox: string;
  checkboxContainer: string;
}

/**
 * Constructor Params for Nested List Tool, use to pass initial data and settings
 */
export type NestedListParams = BlockToolConstructorOptions<
  ListData,
  NestedListConfig
>;

type NestedListStyle = 'ordered' | 'unordered' | 'checklist';

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

  private style: NestedListStyle;

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
    this.defaultListStyle = 'checklist';

    this.style = this.defaultListStyle;

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

  render() {
    const list = new Tabulator(this.data, this.style, this.config);
    const rendered = list.render();

    return rendered;
  }

  /**
   * Styles
   *
   * @returns {NestedListCssClasses} - CSS classes names by keys
   * @private
   */
  get CSS(): NestedListCssClasses {
    return {
      wrapper: 'cdx-nested-list',
      wrapperOrdered: 'cdx-nested-list--ordered',
      wrapperUnordered: 'cdx-nested-list--unordered',
      wrapperChecklist: 'cdx-nested-list--checklist',
      item: 'cdx-nested-list__item',
      itemBody: 'cdx-nested-list__item-body',
      itemContent: 'cdx-nested-list__item-content',
      itemChildren: 'cdx-nested-list__item-children',
      settingsWrapper: 'cdx-nested-list__settings',
      itemChecked: 'cdx-nested-list__item--checked',
      noHover: 'cdx-nested-list__item-checkbox--no-hover',
      checkbox: 'cdx-nested-list__item-checkbox-check',
      checkboxContainer: 'cdx-nested-list__item-checkbox'
    };
  }
}
