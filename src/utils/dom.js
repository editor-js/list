export default class DomUtil {
    /**
     * Helper for making Elements with attributes
     *
     * @param  {string} tagName           - new Element tag name
     * @param  {Array|string} classNames  - list or name of CSS classname(s)
     * @param  {object} attributes        - any attributes
     * @returns {Element}
     */
    static make(tagName, classNames = null, attributes = {}) {
        const el = document.createElement(tagName);

        if (Array.isArray(classNames)) {
            el.classList.add(...classNames);
        } else if (classNames) {
            el.classList.add(classNames);
        }

        for (const attrName in attributes) {
            el[attrName] = attributes[attrName];
        }

        return el;
    }

    /**
     * Set focus to contenteditable or native input element
     *
     * @param {HTMLElement} element - element where to set focus
     * @param {number} offset - offset of cursor
     *
     * @returns {DOMRect} of range
     */
    static focus(element, offset= 0) {
        const range = document.createRange();
        const selection = window.getSelection();

        range.setStart(element, offset);
        range.setEnd(element, offset);

        selection.removeAllRanges();
        selection.addRange(range);
    }
}
