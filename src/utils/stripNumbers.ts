/**
 * Removes everything except numbers in passed string
 * @param input - string to be striped
 */
export default function stripNumbers(input: string): string {
  return input.replace(/\D+/g, '');
}
