import type { ListConfig } from '../types/ListParams';

/**
 * Method that will validate config object
 * @param config - user configuration object for the List tool
 */
export default function validateConfig(config: ListConfig | undefined): void {
  if (config === undefined) {
    return;
  }

  const { styles, defaultStyle } = config;

  if (defaultStyle !== undefined && Array.isArray(styles) && styles.length > 0 && !styles.includes(defaultStyle)) {
    throw new Error(`Invalid config: defaultStyle '${defaultStyle}' must be included in 'styles' ${JSON.stringify(styles)}.`);
  }
}
