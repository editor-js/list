import * as Dom from '@editorjs/dom';
import { CssPrefix } from '../styles/CssPrefix';

/**
 * Options used in input rendering
 */
interface InputOptions {
  /**
   * Placeholder, that will be displayed in input
   */
  placeholder: string;
  /**
   * Input will be rendered with this value inside
   */
  value?: string;
  /**
   * Html attributes, that would be added to the input element
   */
  attributes?: {
    [key: string]: string;
  };
}

const css = {
  wrapper: `${CssPrefix}-start-with-field`,
  input: `${CssPrefix}-start-with-field__input`,
  inputInvalid: `${CssPrefix}-start-with-field__input--invalid`,
};

/**
 * Method that renders html element for popover start with item
 * @param inputCallback - callback method that could change nested list attributes on input
 * @param inputOptions - options used in input rendering
 * @param inputOptions.value - input will be rendered with this value inside
 * @param inputOptions.placeholder - placeholder, that will be displayed in input
 * @param inputOptions.attributes - html attributes, that would be added to the input element
 * @returns - rendered html element
 */
export function renderToolboxInput(inputCallback: (index: number) => void,
  { value, placeholder, attributes }: InputOptions): HTMLElement {
  const startWithElementWrapper = Dom.make('div', css.wrapper);

  const input = Dom.make('input', css.input, {
    placeholder,
    /**
     * Used to prevent focusing on the input by Tab key
     * (Popover in the Toolbar lays below the blocks,
     * so Tab in the last block will focus this hidden input if this property is not set)
     */
    tabIndex: -1,
    /**
     * Value of the start property, if it is not specified, then it is set to one
     */
    value,
  }) as HTMLInputElement;

  /**
   * Add passed attributes to the input
   */
  for (const attribute in attributes) {
    input.setAttribute(attribute, attributes[attribute]);
  }

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

    inputCallback(Number(input.value));
  });

  return startWithElementWrapper;
}
