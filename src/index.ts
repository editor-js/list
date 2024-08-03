import type { API, PasteConfig, ToolboxConfig } from '@editorjs/editorjs';
import type { PasteEvent } from './types';
import type {
  BlockToolConstructorOptions,
  TunesMenuConfig,
} from '@editorjs/editorjs/types/tools';
import Caret from './utils/caret';
import { IconListBulleted, IconListNumbered, IconChecklist } from '@codexteam/icons';
import { NestedListConfig, ListData, ListDataStyle, ListItem } from './types/listParams';
import ListTabulator from './ListTabulator';

/**
 * Build styles
 */
import './../styles/index.pcss';

/**
 * Constructor Params for Nested List Tool, use to pass initial data and settings
 */
export type NestedListParams = BlockToolConstructorOptions<ListData, NestedListConfig>;

/**
 * Default class of the component used in editor
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
   * Get list style name
   *
   * @returns {string}
   */
  get listStyle(): ListDataStyle {
    return this.data.style || this.defaultListStyle;
  }

  /**
   * Set list style
   *
   * @param {ListDataStyle} style - new style to set
   */
  set listStyle(style: ListDataStyle) {
    this.data.style = style;

    /**
     * Create new instance of list
     */
    this.list = new ListTabulator(
      {
        data: this.data,
        api: this.api,
        readOnly: this.readOnly,
        config: this.config,
      },
      this.listStyle
    );

    const newListElement = this.list.render()

    this.listElement?.replaceWith(newListElement);

    this.listElement = newListElement;
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
   * Tool's data
   */
  private data: ListData;

  /**
   * Class that is responsible for list complete list rendering and saving
   */
  list: ListTabulator | undefined;

  /**
   * Main constant wrapper of the whole list
   */
  listElement: HTMLElement | undefined;


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
    this.api = api;
    this.readOnly = readOnly;
    this.config = config;

    /**
     * Set the default list style from the config or presetted 'ordered'.
     */
    this.defaultListStyle = this.config?.defaultStyle || 'ordered';

    const initialData = {
      style: this.defaultListStyle,
      items: [],
    };

    this.data = data && Object.keys(data).length ? data : initialData;
  }

  /**
   * Function that is responsible for content rendering
   * @returns rendered list wrapper with all contents
   */
  render() {
    this.list = new ListTabulator({
      data: this.data,
      readOnly: this.readOnly,
      api: this.api,
      config: this.config,
    },
    this.listStyle
  );

    this.listElement = this.list.render();

    return this.listElement;
  }

  /**
   * Function that is responsible for content saving
   * @returns formatted content used in editor
   */
  save() {
    this.data = this.list!.save();

    return this.data
  }

  /**
   * Creates Block Tune allowing to change the list style
   *
   * @public
   * @returns {Array} array of tune configs
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
      {
        name: 'checklist' as const,
        label: this.api.i18n.t('Checklist'),
        icon: IconChecklist,
      }
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
              meta: {},
              items: [],
            },
          ],
          style: 'unordered',
        };
      },
    };
  }
}
