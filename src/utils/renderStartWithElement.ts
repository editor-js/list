import * as Dom from '@editorjs/dom';
import { CssPrefix } from '../ListRenderer';

const css = {
  wrapper: `${CssPrefix}-start-with-field`,
  input: `${CssPrefix}-start-with-field__input`,
  inputInvalid: `${CssPrefix}-start-with-field__input--invalid`,
};

/**
 * Method that renders html element for popover start with item
 * @param start - current value of the start property, it displayes inside of the input by default
 * @param changeStartWith - method that will change start html attribute of the ordered list
 * @returns - rendered html element
 */
export function renderStartWithElement(start: number | undefined, changeStartWith: (index: number) => void): HTMLElement {
  const startWithElementWrapper = Dom.make('div', css.wrapper);

  const input = Dom.make('input', css.input, {
    placeholder: 'List with start with',
    /**
     * Used to prevent focusing on the input by Tab key
     * (Popover in the Toolbar lays below the blocks,
     * so Tab in the last block will focus this hidden input if this property is not set)
     */
    tabIndex: -1,
    /**
     * Value of the start property, if it is not specified, then it is set to one
     */
    value: start ?? 1,
  }) as HTMLInputElement;

  /**
   * Start with can take only integer numbers
   */
  input.setAttribute('type', 'number');
  input.setAttribute('pattern', '\d*');
  input.setAttribute('required', 'true');

  startWithElementWrapper.appendChild(input);

  input.addEventListener('input', () => {
    const validInput = input.checkValidity();

    /**
     * If input is invalid and classlist does not contain invalid class, add it
     */
    if (!validInput && !input.classList.contains(css.inputInvalid)) {
      input.classList.add(css.inputInvalid);
    }

    /**
     * If input is valid and classlist contains invalid class, remove it
     */
    if (validInput && input.classList.contains(css.inputInvalid)) {
      input.classList.remove(css.inputInvalid);
    }

    /**
     * If input is invalid, than do not change start with attribute
     */
    if (!validInput) {
      return;
    }

    changeStartWith(Number(input.value));
  });

  return startWithElementWrapper;
}
