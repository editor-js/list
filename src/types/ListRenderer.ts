import { CheckListRenderer, OrderedListRenderer, UnorderedListRenderer } from '../ListRenderer';

/**
 * Type that represents all possible list renderer types
 */
export type ListRenderer = CheckListRenderer | OrderedListRenderer | UnorderedListRenderer;
