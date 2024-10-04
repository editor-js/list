/**
 * Paste event for tag substitution, similar to editor.js PasteEvent but with a different data type
 */
export interface PasteEvent extends CustomEvent {
  /**
   * Pasted element
   */
  detail: {
    /**
     * Supported elements fir the paste event
     */
    data: HTMLUListElement | HTMLOListElement | HTMLLIElement;
  };
}
