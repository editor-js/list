import * as dom from './dom';

/**
 * Helper for working with caret
 */
export default class Caret {
  /**
   * Store internal properties
   */
  constructor() {
    /**
     * The <span> for caret saving/restoring
     */
    this.savedFakeCaret = undefined;
  }

  /**
   * Saves caret position using hidden <span>
   *
   * @returns {void}
   */
  save() {
    const range = Caret.range;
    const cursor = dom.make('span');

    cursor.hidden = true;

    range.insertNode(cursor);

    this.savedFakeCaret = cursor;
  }

  /**
   * Restores the caret position saved by the save() method
   *
   * @returns {void}
   */
  restore() {
    if (!this.savedFakeCaret) {
      return;
    }

    const sel = window.getSelection();
    const range = new Range();

    range.setStartAfter(this.savedFakeCaret);
    range.setEndAfter(this.savedFakeCaret);

    sel.removeAllRanges();
    sel.addRange(range);

    /**
     * A little timeout uses to allow browser to set caret after element before we remove it.
     */
    setTimeout(() => {
      this.savedFakeCaret.remove();
    }, 150);
  }

  /**
   * Returns the first range
   *
   * @returns {Range|null}
   */
  static get range() {
    const selection = window.getSelection();

    return selection && selection.rangeCount ? selection.getRangeAt(0) : null;
  }
}
