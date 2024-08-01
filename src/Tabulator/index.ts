import { NestedListConfig, ListData } from "../types/listParams"

/**
 * Class that is responsible for list tabulation
 */
export default class Tabulator {
  /**
   * Tool's configuration
   */
  config: NestedListConfig

  data: ListData;

  constructor(data: ListData, config: NestedListConfig) {
    this.config = config;
    this.data = data;
  }
}
