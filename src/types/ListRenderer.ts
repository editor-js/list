import { CheckListRenderer, OrderedListRenderer, UnorderedListRenderer } from '../ListRenderer';

/**
 * @todo move to types
 * Type that represents all possible list renderer types
 */
export type ListRendererTypes = OrderedListRenderer | UnorderedListRenderer | CheckListRenderer;
