
/**
 * list style to make list as ordered or unordered
 */
type ListDataStyle = 'ordered' | 'unordered';

/**
 * Tool's configuration
 */
export default interface NestedListConfig {
  /**
   * default list style: ordered or unordered
   * default is unordered
   */
  defaultStyle?: ListDataStyle;

  starts: number;
}
