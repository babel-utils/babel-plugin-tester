/**
 * A code formatter used to normalize the results of a babel transformation.
 */
export type ResultFormatter<
  AdditionalOptions extends Record<string, unknown> = Record<string, unknown>
> = (
  /**
   * The result of a babel transformation that should be formatted.
   */
  code: string,
  options: {
    /**
     * A directory path used to generate a default value for `filepath`. There
     * is no need to provide a `cwd` if you provide a `filepath` explicitly.
     *
     * Note that this path may not actually exist.
     */
    cwd?: string;
    /**
     * A path representing the file containing the original source that was
     * transformed into `code` by babel.
     *
     * Note that this file may not actually exist and, even if it does, it may
     * not contain the original source of `code`.
     */
    filepath?: string;
    /**
     * @deprecated Use `filepath` instead.
     */
    filename?: string;
  } & Partial<AdditionalOptions>
) => string;
