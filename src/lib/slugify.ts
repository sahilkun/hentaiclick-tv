/**
 * Convert a string to a URL-safe slug.
 * Lowercase, strips diacritics, replaces non-alphanumeric chars with dashes.
 *
 * Examples:
 *   slugify("Hello World!")        // "hello-world"
 *   slugify("Café Münchën")        // "cafe-munchen"
 *   slugify("foo  bar -- baz")     // "foo-bar-baz"
 *   slugify("---trim me---")       // "trim-me"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritical marks
    .replace(/[^a-z0-9]+/g, "-")     // non-alphanumeric → dash
    .replace(/^-+|-+$/g, "");         // trim leading/trailing dashes
}
