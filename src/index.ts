import { BlockTool, BlockToolConstructorOptions } from '../../../../types/tools/block-tool';
import { BlockToolData } from '../../../../types/tools/block-tool-data';
import { ToolConfig } from '../../../../types/tools/tool-config';
import { API } from '../../../../types/index';

require('./../styles/index.css');

/**
 * NestedList Tool for EditorJS
 */
export default class NestedList implements BlockTool {
  /**
   * Notify core that read-only mode supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Get Tool toolbox settings
   *
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: 'SVG',
      title: 'NestedList',
    };
  }

  /**
   * Tools data
   */
  private data: BlockToolData = {};

  /**
   * Editors' configuration
   */
  private config: ToolConfig = {};

  /**
   * Editors' API object
   */
  private api: API;

  /**
   * Editors' readOnly mode flag
   */
  private readOnly = false;

  /**
   * @param {BlockToolData} data - Tools' data to render
   * @param {ToolConfig} config - editors' config
   * @param {API} api - editors' API object
   * @param {boolean} readOnly - read only mode flag
   */
  constructor({ data, config, api, readOnly }: BlockToolConstructorOptions) {
    this.data = data;
    this.config = config;
    this.api = api;
    this.readOnly = readOnly;
  }

  /**
   * @inheritDoc
   */
  public save(block: HTMLElement): BlockToolData {
    return this.data;
  }

  /**
   * @inheritDoc
   */
  public render(): HTMLElement {
    return document.createElement('DIV');
  }

  /**
   * @inheritDoc
   */
  public renderSettings(): HTMLElement {
    return document.createElement('DIV');
  }
}
