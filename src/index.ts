import type { API, BlockAPI, PasteConfig, ToolboxConfig } from '@editorjs/editorjs';
import type {
  BlockToolConstructorOptions,
  MenuConfigItem,
  ToolConfig
} from '@editorjs/editorjs/types/tools';
import { IconListBulleted, IconListNumbered, IconChecklist } from '@codexteam/icons';
import type { NestedListConfig, ListData, ListDataStyle, ListItem } from './types/ListParams';
import ListTabulator from './ListTabulator';
import { CheckListRenderer, OrderedListRenderer, UnorderedListRenderer } from './ListRenderer';
import type { ListRenderer } from './types/ListRenderer';
import { renderToolboxInput } from './utils/renderToolboxInput';
import { type OlCounterType, OlCounterTypesMap } from './types/OlCounterType';

/**
 * Build styles
 */
import './styles/list.pcss';
import './styles/input.pcss';
import stripNumbers from './utils/stripNumbers';

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
   */
  public static get isReadOnlySupported(): boolean {
    return true;
  }

  /**
   * Allow to use native Enter behaviour
   */
  public static get enableLineBreaks(): boolean {
    return true;
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   */
  public static get toolbox(): ToolboxConfig {
    return [
      {
        icon: IconListBulleted,
        title: 'Unordered List',
        data: {
          style: 'unordered',
        },
      },
      {
        icon: IconListNumbered,
        title: 'Ordered List',
        data: {
          style: 'ordered',
        },
      },
      {
        icon: IconChecklist,
        title: 'Checklist',
        data: {
          style: 'checklist',
        },
      },
    ];
  }

  /**
   * On paste sanitzation config. Allow only tags that are allowed in the Tool.
   *
   * @returns - paste config object used in editor
   */
  public static get pasteConfig(): PasteConfig {
    return {
      tags: ['OL', 'UL', 'LI'],
    };
  }

  /**
   * Convert from text to list with import and export list to text
   */
  public static get conversionConfig(): {
    /**
     * Method that is responsible for conversion from data to string
     *
     * @param data - current list data
     * @returns - contents string formed from list data
     */
    export: (data: ListData) => string;

    /**
     * Method that is responsible for conversion from string to data
     *
     * @param content - contents string
     * @returns - list data formed from contents string
     */
    import: (content: string, config: ToolConfig<NestedListConfig>) => ListData;
    } {
    return {
      export: (data) => {
        return NestedList.joinRecursive(data);
      },
      import: (content, config) => {
        return {
          items: [
            {
              content,
              meta: {},
              items: [],
            },
          ],
          style: config?.defaultStyle !== undefined ? config.defaultStyle : 'unordered',
        };
      },
    };
  }

  /**
   * Get list style name
   */
  private get listStyle(): ListDataStyle {
    return this.data.style || this.defaultListStyle;
  }

  /**
   * Set list style
   *
   * @param style - new style to set
   */
  private set listStyle(style: ListDataStyle) {
    this.data.style = style;

    this.changeTabulatorByStyle();

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
  private config: NestedListConfig | undefined;

  /**
   * Default list style formes as passed default list style from config or 'ordered' as default
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
   * Class that is responsible for complete list rendering and saving
   */
  private list: ListTabulator<ListRenderer> | undefined;

  /**
   * Main constant wrapper of the whole list
   */
  private listElement: HTMLElement | undefined;

  /**
   * Render plugin`s main Element and fill it with saved data
   *
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
     * Set the default list style from the config or presetted 'unordered'.
     */
    this.defaultListStyle = this.config?.defaultStyle || 'unordered';

    const initialData = {
      style: this.defaultListStyle,
      items: [],
    };

    this.data = Object.keys(data).length ? data : initialData;

    /**
     * Assign default value of the property for the ordered list
     */
    if (this.listStyle === 'ordered' && this.data.counterType === undefined) {
      this.data.counterType = 'numeric';
    }

    this.changeTabulatorByStyle();
  }

  /**
   * Convert from list to text for conversionConfig
   *
   * @param data - current data of the list
   * @returns - string of the recursively merged contents of the items of the list
   */
  private static joinRecursive(data: ListData | ListItem): string {
    return data.items
      .map(item => `${item.content} ${NestedList.joinRecursive(item)}`)
      .join('');
  }

  /**
   * Function that is responsible for content rendering
   *
   * @returns rendered list wrapper with all contents
   */
  public render(): HTMLElement {
    this.listElement = this.list!.render();

    return this.listElement;
  }

  /**
   * Function that is responsible for content saving
   *
   * @returns formatted content used in editor
   */
  public save(): ListData {
    this.data = this.list!.save();

    return this.data;
  }

  /**
   * Function that is responsible for mergind two lists into one
   *
   * @param data - data of the next standing list, that should be merged with current
   */
  public merge(data: ListData): void {
    this.list!.merge(data);
  }

  /**
   * Creates Block Tune allowing to change the list style
   *
   * @returns array of tune configs
   */
  public renderSettings(): MenuConfigItem[] {
    const defaultTunes: MenuConfigItem[] = [
      {
        label: this.api.i18n.t('Unordered'),
        icon: IconListBulleted,
        closeOnActivate: true,
        isActive: this.listStyle == 'unordered',
        onActivate: () => {
          this.listStyle = 'unordered';
        },
      },
      {
        label: this.api.i18n.t('Ordered'),
        icon: IconListNumbered,
        closeOnActivate: true,
        isActive: this.listStyle == 'ordered',
        onActivate: () => {
          this.listStyle = 'ordered';
        },
      },
      {
        label: this.api.i18n.t('Checklist'),
        icon: IconChecklist,
        closeOnActivate: true,
        isActive: this.listStyle == 'checklist',
        onActivate: () => {
          this.listStyle = 'checklist';
        },
      },
    ];

    if (this.listStyle === 'ordered') {
      const startWithElement = renderToolboxInput(
        (index: string) => this.changeStartWith(Number(index)),
        {
          value: String(this.data.start ?? 1),
          placeholder: '',
          attributes: {
            required: 'true',
          },
          sanitize: input => stripNumbers(input),
        });

      const orderedListTunes: MenuConfigItem[] = [
        {
          label: this.api.i18n.t('Start with'),
          children: {
            items: [
              {
                element: startWithElement,
                // @ts-expect-error ts(2820) can not use PopoverItem enum from editor.js types
                type: 'html',
              },
            ],
          },
        },
      ];

      const orderedListCountersTunes: MenuConfigItem = {
        label: this.api.i18n.t('Counters type'),
        children: {
          items: [],
        },
      };

      /**
       * For each counter type in OlCounterType create toolbox item
       */
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call

      OlCounterTypesMap.forEach((_, counterType: string) => {
        orderedListCountersTunes.children.items!.push({
          title: this.api.i18n.t(counterType),
          isActive: this.data.counterType === OlCounterTypesMap.get(counterType),
          closeOnActivate: true,
          onActivate: () => {
            this.changeCounters(OlCounterTypesMap.get(counterType) as OlCounterType);
          },
        });
      });

      defaultTunes.push(...orderedListTunes, orderedListCountersTunes);
    }

    return defaultTunes;
  }

  /**
   * Changes ordered list counterType property value
   *
   * @param counterType - new value of the counterType value
   */
  private changeCounters(counterType: OlCounterType): void {
    this.list?.changeCounters(counterType);

    this.data.counterType = counterType;
  }

  /**
   * Changes ordered list start property value
   *
   * @param index - new value of the start property
   */
  private changeStartWith(index: number): void {
    this.list?.changeStartWith(index);

    this.data.start = index;
  }

  /**
   * This method allows changing tabulator respectfully to passed style
   */
  private changeTabulatorByStyle(): void {
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
}
