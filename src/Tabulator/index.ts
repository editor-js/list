import NestedListConfig from "../types/config"

/**
 * Class that is responsible for list tabulation
 */
export default class Tabulator {
  /**
   * Tool's configuration
   */
  config: NestedListConfig

  constructor(config: NestedListConfig) {
    this.config = config;
  }
}
