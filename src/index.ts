import type { API, BlockAPI, PasteConfig, ToolboxConfig } from '@editorjs/editorjs';
import type {
  BlockToolConstructorOptions,
  TunesMenuConfig
} from '@editorjs/editorjs/types/tools';
import { IconListBulleted, IconListNumbered, IconChecklist } from '@codexteam/icons';
import type { NestedListConfig, ListData, ListDataStyle, ListItem } from './types/ListParams';
import ListTabulator from './ListTabulator';
import { CheckListRenderer, OrderedListRenderer, UnorderedListRenderer } from './ListRenderer';
import type { ListRenderer } from './types/ListRenderer';

/**
 * Build styles
 */
import './../styles/index.pcss';

/**
 * Constructor Params for Nested List Tool, use to pass initial data and settings
 */
export type ListParams = BlockToolConstructorOptions<ListData, NestedListConfig>;

/**
 * Default class of the component used in editor
 */
export default class NestedList {
  /**
   * Notify core that read-only mode is supported
   * @returns
   */
  static get isReadOnlySupported(): boolean {
    return true;
  }

  /**
   * Allow to use native Enter behaviour
   * @returns
   */
  static get enableLineBreaks(): boolean {
    return true;
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   * @returns
   */
  static get toolbox(): ToolboxConfig {
    return {
      icon: IconListNumbered,
      title: 'List',
    };
  }

  /**
   * Get list style name
   * @returns
   */
  get listStyle(): ListDataStyle {
    return this.data.style || this.defaultListStyle;
  }

  /**
   * Set list style
   * @param style - new style to set
   */
  set listStyle(style: ListDataStyle) {
    this.data.style = style;

    this.changeTabulatorByStyle(style);

    /**
     * Create new list element
     */
    const newListElement = this.list!.render();

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
  private config: NestedListConfig;

  /**
   * Default list style
   */
  private defaultListStyle?: NestedListConfig['defaultStyle'];

  /**
   * Tool's data
   */
  private data: ListData;

  /**
   * Editor block api
   */
  private block: BlockAPI;

  /**
   * Class that is responsible for list complete list rendering and saving
   */
  list: ListTabulator<ListRenderer> | undefined;

  /**
   * Main constant wrapper of the whole list
   */
  listElement: HTMLElement | undefined;

  /**
   * Render plugin`s main Element and fill it with saved data
   * @param params - tool constructor options
   * @param params.data - previously saved data
   * @param params.config - user config for Tool
   * @param params.api - Editor.js API
   * @param params.readOnly - read-only mode flag
   */
  constructor({ data, config, api, readOnly, block }: ListParams) {
    this.api = api;
    this.readOnly = readOnly;
    this.config = config;
    this.block = block;

    /**
     * Set the default list style from the config or presetted 'ordered'.
     */
    this.defaultListStyle = this.config?.defaultStyle || 'ordered';

    const initialData = {
      style: this.defaultListStyle,
      items: [],
    };

    this.data = data && Object.keys(data).length ? data : initialData;

    this.changeTabulatorByStyle(this.defaultListStyle);
  }

  /**
   * Function that is responsible for content rendering
   * @returns rendered list wrapper with all contents
   */
  render() {
    this.listElement = this.list!.render();

    return this.listElement;
  }

  /**
   * Function that is responsible for content saving
   * @returns formatted content used in editor
   */
  save() {
    this.data = this.list!.save();

    return this.data;
  }

  merge(data: ListData) {
    this.list!.merge(data);
  }

  /**
   * Creates Block Tune allowing to change the list style
   * @returns array of tune configs
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
      },
    ];

    return tunes.map(tune => ({
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
   * This method allows changing
   * @param style
   */
  changeTabulatorByStyle(style: ListDataStyle) {
    switch (this.listStyle) {
      case 'ordered':
        this.list = new ListTabulator<OrderedListRenderer>({
          data: this.data,
          readOnly: this.readOnly,
          api: this.api,
          config: this.config,
          block: this.block,
        },
        new OrderedListRenderer(this.readOnly, this.config)
        );

        break;

      case 'unordered':
        this.list = new ListTabulator<UnorderedListRenderer>({
          data: this.data,
          readOnly: this.readOnly,
          api: this.api,
          config: this.config,
          block: this.block,
        },
        new UnorderedListRenderer(this.readOnly, this.config)
        );

        break;

      case 'checklist':
        this.list = new ListTabulator<CheckListRenderer>({
          data: this.data,
          readOnly: this.readOnly,
          api: this.api,
          config: this.config,
          block: this.block,
        },
        new CheckListRenderer(this.readOnly, this.config)
        );

        break;
    }
  }

  /**
   * On paste sanitzation config. Allow only tags that are allowed in the Tool.
   * @returns - paste config.
   */
  static get pasteConfig(): PasteConfig {
    return {
      tags: ['OL', 'UL', 'LI'],
    };
  }

  /**
   * Convert from list to text for conversionConfig
   * @param data
   * @returns
   */
  static joinRecursive(data: ListData | ListItem): string {
    return data.items
      .map(item => `${item.content} ${NestedList.joinRecursive(item)}`)
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
