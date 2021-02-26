require('./../styles/index.css');

/**
 * @typedef {Object} BlockToolData
 */

/**
 * NestedList Tool for EditorJS
 */
export default class NestedList {
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
   * @param {BlockToolData} data - Tools' data to render
   * @param config - editors' config
   * @param api - editors' API object
   * @param {boolean} readOnly - read only mode flag
   */
  constructor({ data, config, api, readOnly }) {
    this.data = data;
    this.config = config;
    this.api = api;
    this.readOnly = readOnly;
  }

  /**
   * @inheritDoc
   */
  save(block) {
    return this.data;
  }

  /**
   * @inheritDoc
   */
  render() {
    return document.createElement('DIV');
  }

  /**
   * @inheritDoc
   */
  renderSettings() {
    return document.createElement('DIV');
  }
}
