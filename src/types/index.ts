/**
 * Paste event for tag substitution, similar to editor.js PasteEvent but with a different data type
 */
export interface PasteEvent extends CustomEvent {
  /**
   * Pasted element
   */
  detail: {
    data: HTMLUListElement | HTMLOListElement | HTMLLIElement;
  };
}
