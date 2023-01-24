// * These are prettier's defaults as of 01/02/2023
// * https://gist.github.com/adbutterfield/6b91625b5b07ca2c29f6322245e3e2bb?permalink_comment_id=3865049#gistcomment-3865049

module.exports = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  quoteProps: "as-needed",
  jsxSingleQuote: false,
  trailingComma: "es5",
  bracketSpacing: true,
  bracketSameLine: false,
  jsxBracketSameLine: false,
  arrowParens: "always",
  rangeEnd: null,
  requirePragma: false,
  insertPragma: false,
  proseWrap: "preserve",
  htmlWhitespaceSensitivity: "css",
  vueIndentScriptAndStyle: false,
  endOfLine: "lf",
  embeddedLanguageFormatting: "auto",
  singleAttributePerLine: false,
  overrides: [
    {
      files: "**/*.mts",
      options: {
        parser: "babel-ts",
        singleQuote: true
      },
    },
  ],
};
